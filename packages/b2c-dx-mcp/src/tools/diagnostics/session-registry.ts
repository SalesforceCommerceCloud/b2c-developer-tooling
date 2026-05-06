/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {
  DebugSessionManager,
  SourceMapper,
  SdapiBreakpoint,
  SdapiScriptThread,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';

const IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface HaltWaiter {
  resolve: (thread: SdapiScriptThread) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface DebugSessionEntry {
  sessionId: string;
  hostname: string;
  clientId: string;
  manager: DebugSessionManager;
  sourceMapper: SourceMapper;
  cartridges: CartridgeMapping[];
  breakpoints: SdapiBreakpoint[];
  haltWaiters: HaltWaiter[];
  createdAt: number;
  lastActivityAt: number;
}

export class DebugSessionRegistry {
  private cleanupTimer: ReturnType<typeof setInterval> | undefined;
  private readonly sessions = new Map<string, DebugSessionEntry>();

  constructor() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleSessions().catch(() => {});
    }, CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  async destroyAll(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    const destroyPromises = [...this.sessions.keys()].map((id) => this.destroySession(id));
    await Promise.allSettled(destroyPromises);
  }

  async destroySession(sessionId: string): Promise<void> {
    const entry = this.sessions.get(sessionId);
    if (!entry) return;

    for (const waiter of entry.haltWaiters) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error('Debug session ended'));
    }
    entry.haltWaiters.length = 0;

    try {
      await entry.manager.disconnect();
    } catch {
      // Best-effort disconnect
    }

    this.sessions.delete(sessionId);
  }

  findByHostAndClientId(hostname: string, clientId: string): DebugSessionEntry | undefined {
    for (const entry of this.sessions.values()) {
      if (entry.hostname === hostname && entry.clientId === clientId) {
        return entry;
      }
    }
    return undefined;
  }

  getSession(sessionId: string): DebugSessionEntry | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionOrThrow(sessionId: string): DebugSessionEntry {
    const entry = this.sessions.get(sessionId);
    if (!entry) {
      throw new Error(`No debug session found with id "${sessionId}". Use debug_list_sessions to see active sessions.`);
    }
    entry.lastActivityAt = Date.now();
    return entry;
  }

  listSessions(): DebugSessionEntry[] {
    return [...this.sessions.values()];
  }

  registerSession(
    hostname: string,
    clientId: string,
    manager: DebugSessionManager,
    sourceMapper: SourceMapper,
    cartridges: CartridgeMapping[],
  ): DebugSessionEntry {
    const existing = this.findByHostAndClientId(hostname, clientId);
    if (existing) {
      throw new Error(
        `A debug session already exists for ${hostname} with client ID "${clientId}" ` +
          `(session_id: "${existing.sessionId}"). ` +
          `End it with debug_end_session first, or use a different client_id.`,
      );
    }

    const sessionId = randomUUID();
    const now = Date.now();
    const entry: DebugSessionEntry = {
      sessionId,
      hostname,
      clientId,
      manager,
      sourceMapper,
      cartridges,
      breakpoints: [],
      haltWaiters: [],
      createdAt: now,
      lastActivityAt: now,
    };
    this.sessions.set(sessionId, entry);
    return entry;
  }

  private async cleanupIdleSessions(): Promise<void> {
    const logger = getLogger();
    const now = Date.now();

    const idleSessions = [...this.sessions.entries()].filter(([, entry]) => now - entry.lastActivityAt > IDLE_TTL_MS);

    await Promise.allSettled(
      idleSessions.map(([sessionId, entry]) => {
        logger.info({sessionId, hostname: entry.hostname}, 'Cleaning up idle debug session');
        return this.destroySession(sessionId);
      }),
    );
  }
}
