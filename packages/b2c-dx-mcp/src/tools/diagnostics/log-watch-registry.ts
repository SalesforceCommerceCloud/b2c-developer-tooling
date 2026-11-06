/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {LogWatch} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {ToolExecutionContext} from '../adapter.js';
import type {ToolResolution} from '../project-context.js';

const IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface LogWatchEntry {
  watchId: string;
  hostname: string;
  /** Buffered SDK watch; owns entries, filters and caps. */
  watch: LogWatch;
  resolution?: ToolResolution;
}

export interface RegisterWatchOptions {
  hostname: string;
  watch: LogWatch;
  resolution?: ToolResolution;
}

/** Tool-facing IDs for running instance log watches: one per hostname, reaped when idle. */
export class LogWatchRegistry {
  private cleanupTimer: ReturnType<typeof setInterval> | undefined;
  private readonly watches = new Map<string, LogWatchEntry>();

  constructor() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleWatches().catch(() => {});
    }, CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  async destroyAll(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    await Promise.allSettled([...this.watches.keys()].map((id) => this.destroyWatch(id)));
  }

  async destroyWatch(watchId: string): Promise<void> {
    const entry = this.watches.get(watchId);
    if (!entry) return;
    this.watches.delete(watchId);
    await entry.watch.stop().catch(() => {});
  }

  findByHostname(hostname: string): LogWatchEntry | undefined {
    for (const entry of this.watches.values()) {
      if (entry.hostname === hostname) return entry;
    }
    return undefined;
  }

  getWatch(watchId: string): LogWatchEntry | undefined {
    return this.watches.get(watchId);
  }

  getWatchOrThrow(watchId: string): LogWatchEntry {
    const entry = this.watches.get(watchId);
    if (!entry) {
      throw new Error(`No log watch found with id "${watchId}". Use logs_watch(action: list) to see active watches.`);
    }
    return entry;
  }

  listWatches(): LogWatchEntry[] {
    return [...this.watches.values()];
  }

  registerWatch(options: RegisterWatchOptions): LogWatchEntry {
    const existing = this.findByHostname(options.hostname);
    if (existing) {
      throw new Error(
        `A log watch already exists for ${options.hostname} (watch_id: "${existing.watchId}"). ` +
          `Stop it with logs_watch(action: stop) first, or poll the existing watch.`,
      );
    }
    const entry: LogWatchEntry = {watchId: randomUUID(), ...options};
    this.watches.set(entry.watchId, entry);
    return entry;
  }

  private async cleanupIdleWatches(): Promise<void> {
    const logger = getLogger();
    const now = Date.now();
    const idle = [...this.watches.values()].filter((entry) => now - entry.watch.info().lastActivityAt > IDLE_TTL_MS);
    await Promise.allSettled(
      idle.map((entry) => {
        logger.info({watchId: entry.watchId, hostname: entry.hostname}, 'Cleaning up idle log watch');
        return this.destroyWatch(entry.watchId);
      }),
    );
  }
}

export function getLogWatchRegistry(context: ToolExecutionContext): LogWatchRegistry {
  const registry = context.serverContext?.logWatches;
  if (!registry) {
    throw new Error('Log watch registry not available');
  }
  return registry;
}

export function getLogWatchEntry(context: ToolExecutionContext, watchId: string): LogWatchEntry {
  return getLogWatchRegistry(context).getWatchOrThrow(watchId);
}
