/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Debug session manager for the SDAPI.
 *
 * Manages the debugger lifecycle, polls for halted threads, and sends periodic
 * keepalive resets to prevent the 60-second halt timeout. State changes are
 * communicated via callbacks.
 *
 * @module operations/debug/debug-session
 */
import {getLogger} from '../../logging/logger.js';
import {SdapiClient, SdapiError} from './sdapi-client.js';
import type {
  BreakpointInput,
  DebugSessionCallbacks,
  DebugSessionConfig,
  SdapiBreakpoint,
  SdapiScriptThread,
} from './types.js';

const DEFAULT_POLL_INTERVAL = 500;
const DEFAULT_KEEPALIVE_INTERVAL = 15_000;

export class DebugSessionManager {
  readonly client: SdapiClient;
  private readonly config: DebugSessionConfig;
  private readonly callbacks: DebugSessionCallbacks;
  private readonly logger = getLogger();

  private pollTimer?: ReturnType<typeof setInterval>;
  private keepaliveTimer?: ReturnType<typeof setInterval>;

  /** Last known thread states keyed by thread id */
  private knownThreads = new Map<number, SdapiScriptThread>();
  private connected = false;

  constructor(config: DebugSessionConfig, callbacks: DebugSessionCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.client = new SdapiClient({
      hostname: config.hostname,
      username: config.username,
      password: config.password,
      clientId: config.clientId,
    });
  }

  /**
   * Connect to the debugger: enable the client, start polling and keepalive.
   */
  async connect(): Promise<void> {
    this.logger.debug({hostname: this.config.hostname}, 'Connecting to script debugger');

    // Take over any existing session (same pattern as Python reference)
    try {
      await this.client.deleteClient();
    } catch {
      // Ignore — client may not exist yet
    }

    await this.client.createClient();
    this.connected = true;

    // Start keepalive timer
    const keepaliveInterval = this.config.keepaliveInterval ?? DEFAULT_KEEPALIVE_INTERVAL;
    this.keepaliveTimer = setInterval(() => void this.keepalive(), keepaliveInterval);

    // Start thread poller
    const pollInterval = this.config.pollInterval ?? DEFAULT_POLL_INTERVAL;
    this.pollTimer = setInterval(() => void this.pollThreads(), pollInterval);

    this.logger.debug('Script debugger connected');
    this.callbacks.onConnected?.(this.config.hostname);
  }

  /**
   * Disconnect: stop timers, delete client.
   */
  async disconnect(): Promise<void> {
    this.stopTimers();

    if (this.connected) {
      try {
        await this.client.deleteClient();
      } catch (error) {
        this.logger.warn({error}, 'Error deleting debugger client during disconnect');
      }
      this.connected = false;
    }

    this.knownThreads.clear();
    this.logger.debug('Script debugger disconnected');
    this.callbacks.onDisconnected?.();
  }

  /**
   * Set breakpoints (replaces all current breakpoints).
   */
  async setBreakpoints(breakpoints: BreakpointInput[]): Promise<SdapiBreakpoint[]> {
    await this.client.deleteBreakpoints();
    if (breakpoints.length === 0) return [];
    return this.client.setBreakpoints(breakpoints);
  }

  /**
   * Resume a halted thread.
   */
  async resume(threadId: number): Promise<void> {
    await this.client.resume(threadId);
  }

  /**
   * Step over (next line).
   */
  async stepOver(threadId: number): Promise<void> {
    await this.client.stepOver(threadId);
  }

  /**
   * Step into function.
   */
  async stepInto(threadId: number): Promise<void> {
    await this.client.stepInto(threadId);
  }

  /**
   * Step out of function.
   */
  async stepOut(threadId: number): Promise<void> {
    await this.client.stepOut(threadId);
  }

  /**
   * Get the current list of known threads (from last poll).
   */
  getKnownThreads(): SdapiScriptThread[] {
    return [...this.knownThreads.values()];
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private stopTimers(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = undefined;
    }
  }

  private async keepalive(): Promise<void> {
    try {
      await this.client.resetThreads();
    } catch (error) {
      this.logger.debug({error}, 'Keepalive reset failed');
    }
  }

  private haltLocationChanged(prev: SdapiScriptThread, curr: SdapiScriptThread): boolean {
    const prevLoc = prev.call_stack?.[0]?.location;
    const currLoc = curr.call_stack?.[0]?.location;
    if (!prevLoc || !currLoc) return prevLoc !== currLoc;
    return prevLoc.script_path !== currLoc.script_path || prevLoc.line_number !== currLoc.line_number;
  }

  private logThreadHalted(thread: SdapiScriptThread): void {
    const topFrame = thread.call_stack?.[0];
    if (topFrame) {
      const loc = topFrame.location;
      const fn = loc.function_name || '<anonymous>';
      this.logger.debug(`Thread ${thread.id} halted at ${loc.script_path}:${loc.line_number} (${fn})`);
    } else {
      this.logger.debug(`Thread ${thread.id} halted`);
    }
  }

  private async pollThreads(): Promise<void> {
    try {
      const threads = await this.client.getThreads();
      const currentIds = new Set<number>();

      for (const thread of threads) {
        currentIds.add(thread.id);
        const previous = this.knownThreads.get(thread.id);

        if (!previous) {
          // New thread appeared
          this.knownThreads.set(thread.id, thread);
          if (thread.status === 'halted') {
            this.logThreadHalted(thread);
            this.callbacks.onThreadStopped?.(thread);
          }
        } else if (previous.status !== thread.status) {
          // State changed
          this.knownThreads.set(thread.id, thread);
          if (thread.status === 'halted') {
            this.logThreadHalted(thread);
            this.callbacks.onThreadStopped?.(thread);
          } else {
            this.logger.debug(`Thread ${thread.id} resumed`);
            this.callbacks.onThreadContinued?.(thread.id);
          }
        } else if (thread.status === 'halted' && this.haltLocationChanged(previous, thread)) {
          // Still halted but at a different location (hit another breakpoint or stepped)
          this.knownThreads.set(thread.id, thread);
          this.logThreadHalted(thread);
          this.callbacks.onThreadStopped?.(thread);
        } else {
          this.knownThreads.set(thread.id, thread);
        }
      }

      // Detect threads that disappeared
      for (const [id] of this.knownThreads) {
        if (!currentIds.has(id)) {
          this.knownThreads.delete(id);
          this.logger.debug(`Thread ${id} exited`);
          this.callbacks.onThreadExited?.(id);
        }
      }
    } catch (error) {
      if (error instanceof SdapiError && error.status === 412) {
        // Debugger disabled — stop polling
        this.logger.warn('Debugger was disabled externally');
        this.stopTimers();
        this.connected = false;
        this.callbacks.onDebuggerDisabled?.();
      } else {
        this.logger.debug({error}, 'Thread poll error');
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}
