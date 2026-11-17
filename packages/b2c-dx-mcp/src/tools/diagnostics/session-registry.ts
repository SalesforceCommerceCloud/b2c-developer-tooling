/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {DebugSessionManager, SourceMapper} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import type {ToolExecutionContext} from '../adapter.js';
import type {ToolResolution} from '../project-context.js';

const IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface DebugSessionEntry {
  sessionId: string;
  hostname: string;
  clientId: string;
  manager: DebugSessionManager;
  sourceMapper: SourceMapper;
  cartridges: CartridgeMapping[];
  createdAt: number;
  lastActivityAt: number;
  resolution?: ToolResolution;
}

export interface RegisterSessionOptions {
  hostname: string;
  clientId: string;
  manager: DebugSessionManager;
  sourceMapper: SourceMapper;
  cartridges: CartridgeMapping[];
  resolution?: ToolResolution;
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

  registerSession(opts: RegisterSessionOptions): DebugSessionEntry {
    const {hostname, clientId, manager, sourceMapper, cartridges, resolution} = opts;
    const existing = this.findByHostAndClientId(hostname, clientId);
    if (existing) {
      throw new Error(
        `A debug session already exists for ${hostname} ` +
          `(session_id: "${existing.sessionId}"). ` +
          `End it with debug_end_session first.`,
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
      createdAt: now,
      lastActivityAt: now,
      resolution,
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

/**
 * Resolve the registry from the tool execution context, throwing a clear
 * error if it's missing, then look up the session by ID. Used by every
 * debug tool that takes a session_id.
 */
export function getSessionEntry(context: ToolExecutionContext, sessionId: string): DebugSessionEntry {
  const registry = context.serverContext?.debugSessions;
  if (!registry) {
    throw new Error('Debug session registry not available');
  }
  return registry.getSessionOrThrow(sessionId);
}

/** Resolve the registry from the tool context (for tools that don't need a specific session). */
export function getRegistry(context: ToolExecutionContext): DebugSessionRegistry {
  const registry = context.serverContext?.debugSessions;
  if (!registry) {
    throw new Error('Debug session registry not available');
  }
  return registry;
}
