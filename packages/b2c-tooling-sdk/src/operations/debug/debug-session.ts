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
  private currentBreakpoints: SdapiBreakpoint[] = [];
  private haltWaiters = new Set<{resolve: (thread: SdapiScriptThread) => void; reject: (error: Error) => void}>();

  constructor(config: DebugSessionConfig, callbacks: DebugSessionCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.client = new SdapiClient({
      hostname: config.hostname,
      username: config.username,
      password: config.password,
      clientId: config.clientId,
      selfSignedApi: config.selfSignedApi,
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

    try {
      // Start keepalive timer
      const keepaliveInterval = this.config.keepaliveInterval ?? DEFAULT_KEEPALIVE_INTERVAL;
      this.keepaliveTimer = setInterval(() => void this.keepalive(), keepaliveInterval);

      // Start thread poller
      const pollInterval = this.config.pollInterval ?? DEFAULT_POLL_INTERVAL;
      this.pollTimer = setInterval(() => void this.pollThreads(), pollInterval);

      this.logger.debug('Script debugger connected');

      this.callbacks.onConnected?.(this.config.hostname);
    } catch (err) {
      // Ensure timers are cleared if anything (incl. onConnected callback) throws
      // after we started them; otherwise we'd leak intervals.
      this.stopTimers();
      this.connected = false;
      try {
        await this.client.deleteClient();
      } catch (deleteErr) {
        this.logger.debug({err: deleteErr}, 'Failed to clean up debugger client after connect error');
      }
      throw err;
    }
  }

  /**
   * Disconnect: stop timers, delete client.
   */
  async disconnect(): Promise<void> {
    this.stopTimers();
    this.rejectHaltWaiters(new Error('Debug session ended'));

    if (this.connected) {
      try {
        await this.client.deleteClient();
      } catch (error) {
        this.logger.warn({error}, 'Error deleting debugger client during disconnect');
      }
      this.connected = false;
    }

    this.knownThreads.clear();
    this.currentBreakpoints = [];
    this.logger.debug('Script debugger disconnected');
    this.callbacks.onDisconnected?.();
  }

  /**
   * Set breakpoints (replaces all current breakpoints).
   */
  async setBreakpoints(breakpoints: BreakpointInput[]): Promise<SdapiBreakpoint[]> {
    await this.client.deleteBreakpoints();
    this.currentBreakpoints = [];
    if (breakpoints.length > 0) this.currentBreakpoints = await this.client.setBreakpoints(breakpoints);
    return this.getBreakpoints();
  }

  /**
   * Add breakpoints to the current set; existing breakpoints at the same script
   * and line are replaced.
   */
  async addBreakpoints(breakpoints: BreakpointInput[]): Promise<SdapiBreakpoint[]> {
    const key = (bp: BreakpointInput) => `${bp.script_path}:${bp.line_number}`;
    const added = new Set(breakpoints.map((bp) => key(bp)));
    return this.setBreakpoints([
      ...this.currentBreakpoints
        .filter((bp) => !added.has(key(bp)))
        .map(
          (bp): BreakpointInput => ({
            script_path: bp.script_path,
            line_number: bp.line_number,
            condition: bp.condition,
          }),
        ),
      ...breakpoints,
    ]);
  }

  /** Breakpoints set by the last {@link setBreakpoints} or {@link addBreakpoints}. */
  getBreakpoints(): SdapiBreakpoint[] {
    return [...this.currentBreakpoints];
  }

  /**
   * Wait for a thread to halt. Resolves at once with an already halted thread,
   * otherwise with the next thread to halt, or `null` after `timeoutMs`.
   * Rejects when the session is not connected or disconnects, the debugger is disabled, or `signal` aborts.
   */
  async waitForHalt(timeoutMs: number, signal?: AbortSignal): Promise<null | SdapiScriptThread> {
    signal?.throwIfAborted();
    if (!this.connected) throw new Error('Debug session is not connected');
    const halted = this.getKnownThreads().find((thread) => thread.status === 'halted');
    if (halted) return halted;
    return new Promise((resolve, reject) => {
      const finish = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        this.haltWaiters.delete(waiter);
      };
      const waiter = {
        resolve(thread: SdapiScriptThread) {
          finish();
          resolve(thread);
        },
        reject(error: Error) {
          finish();
          reject(error);
        },
      };
      const onAbort = () => waiter.reject(signal!.reason instanceof Error ? signal!.reason : new Error('Aborted'));
      const timer = setTimeout(() => {
        finish();
        resolve(null);
      }, timeoutMs);
      signal?.addEventListener('abort', onAbort, {once: true});
      this.haltWaiters.add(waiter);
    });
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

  /**
   * Returns the session cookie (`dwsid`) established with the debugger, or
   * `undefined` if not yet connected. This cookie pins requests to the app
   * server holding the debugger session; callers can use it to route an
   * external request (e.g. a storefront browser) to the same app server so
   * breakpoints are hit.
   */
  getSessionCookie(name = 'dwsid'): string | undefined {
    return this.client.getCookie(name);
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

  private notifyHalted(thread: SdapiScriptThread): void {
    for (const waiter of [...this.haltWaiters]) waiter.resolve(thread);
    this.callbacks.onThreadStopped?.(thread);
  }

  private rejectHaltWaiters(error: Error): void {
    for (const waiter of [...this.haltWaiters]) waiter.reject(error);
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
            this.notifyHalted(thread);
          }
        } else if (previous.status !== thread.status) {
          // State changed
          this.knownThreads.set(thread.id, thread);
          if (thread.status === 'halted') {
            this.logThreadHalted(thread);
            this.notifyHalted(thread);
          } else {
            this.logger.debug(`Thread ${thread.id} resumed`);
            this.callbacks.onThreadContinued?.(thread.id);
          }
        } else if (thread.status === 'halted' && this.haltLocationChanged(previous, thread)) {
          // Still halted but at a different location (hit another breakpoint or stepped)
          this.knownThreads.set(thread.id, thread);
          this.logThreadHalted(thread);
          this.notifyHalted(thread);
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
        this.rejectHaltWaiters(new Error('The script debugger was disabled'));
        this.callbacks.onDebuggerDisabled?.();
      } else {
        this.logger.debug({error}, 'Thread poll error');
        this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}
