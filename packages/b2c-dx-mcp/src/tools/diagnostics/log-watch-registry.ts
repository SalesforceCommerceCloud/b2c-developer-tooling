/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {LogEntry, LogFile, TailLogsResult} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {ToolExecutionContext} from '../adapter.js';

const IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Maximum number of buffered entries before oldest are evicted. */
export const DEFAULT_BUFFER_CAP = 5000;

/**
 * Maximum cumulative bytes buffered before oldest entries are evicted.
 * Guards against a small number of pathologically large entries (e.g. multi-MB
 * stack traces) blowing past the count cap's intended memory bound.
 */
export const DEFAULT_BUFFER_BYTES_CAP = 50 * 1024 * 1024; // 50 MB

/** Maximum number of buffered errors before oldest are evicted. */
const ERROR_CAP = 25;

/** Maximum number of buffered rotation events before oldest are evicted. */
const ROTATION_CAP = 100;

export interface PollWaiter {
  resolve: () => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface LogWatchEntry {
  watchId: string;
  hostname: string;
  prefixes: string[];
  buffer: LogEntry[];
  /** Running byte size of `buffer` (raw + message), used for the byte cap. */
  bufferBytes: number;
  rotations: LogFile[];
  /** Cumulative deduped list of every file ever discovered (for logs_watch_list). */
  filesDiscovered: LogFile[];
  /** Files discovered since the last poll drain (what logs_watch_poll returns). */
  pendingFilesDiscovered: LogFile[];
  errors: Array<{message: string; at: string}>;
  totalEntriesSeen: number;
  droppedEntries: number;
  bufferCap: number;
  bufferBytesCap: number;
  stop: () => Promise<void>;
  done: Promise<void>;
  pollWaiters: PollWaiter[];
  createdAt: number;
  lastActivityAt: number;
  stopped: boolean;
}

export interface RegisterWatchOptions {
  hostname: string;
  prefixes: string[];
  tailResult: TailLogsResult;
  bufferCap?: number;
  bufferBytesCap?: number;
}

/** Approximate in-memory byte cost of a buffered entry. */
function entryBytes(entry: LogEntry): number {
  return (entry.raw?.length ?? 0) + (entry.message?.length ?? 0);
}

export class LogWatchRegistry {
  private cleanupTimer: ReturnType<typeof setInterval> | undefined;
  private readonly watches = new Map<string, LogWatchEntry>();

  constructor() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleWatches().catch(() => {});
    }, CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  /**
   * Append a log entry to a watch buffer. Evicts oldest if over cap.
   * Resolves any pending poll waiters.
   */
  appendEntry(watchId: string, entry: LogEntry): void {
    const w = this.watches.get(watchId);
    if (!w || w.stopped) return;
    w.buffer.push(entry);
    w.bufferBytes += entryBytes(entry);
    w.totalEntriesSeen += 1;

    // Evict oldest entries until under BOTH the count cap and the byte cap.
    // The byte cap guards against a few pathologically large entries (e.g.
    // multi-MB stack traces) exceeding the intended memory bound. Always keep
    // at least one entry so a single oversized entry is still deliverable.
    while (w.buffer.length > 1 && (w.buffer.length > w.bufferCap || w.bufferBytes > w.bufferBytesCap)) {
      const dropped = w.buffer.shift()!;
      w.bufferBytes -= entryBytes(dropped);
      w.droppedEntries += 1;
    }

    w.lastActivityAt = Date.now();
    this.flushWaiters(w);
  }

  appendError(watchId: string, err: Error): void {
    const w = this.watches.get(watchId);
    if (!w || w.stopped) return;
    w.errors.push({message: err.message, at: new Date().toISOString()});
    if (w.errors.length > ERROR_CAP) {
      w.errors.splice(0, w.errors.length - ERROR_CAP);
    }
    w.lastActivityAt = Date.now();
  }

  /**
   * Append a discovered file (deduped by name).
   */
  appendFileDiscovered(watchId: string, file: LogFile): void {
    const w = this.watches.get(watchId);
    if (!w || w.stopped) return;
    if (!w.filesDiscovered.some((f) => f.name === file.name)) {
      w.filesDiscovered.push(file);
      // Queue for the next poll drain so each newly-discovered file is reported
      // exactly once, while filesDiscovered keeps the cumulative view for list.
      w.pendingFilesDiscovered.push(file);
    }
    w.lastActivityAt = Date.now();
  }

  appendRotation(watchId: string, file: LogFile): void {
    const w = this.watches.get(watchId);
    if (!w || w.stopped) return;
    w.rotations.push(file);
    if (w.rotations.length > ROTATION_CAP) {
      w.rotations.splice(0, w.rotations.length - ROTATION_CAP);
    }
    w.lastActivityAt = Date.now();
    this.flushWaiters(w);
  }

  async destroyAll(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    const promises = [...this.watches.keys()].map((id) => this.destroyWatch(id));
    await Promise.allSettled(promises);
  }

  async destroyWatch(watchId: string): Promise<void> {
    const w = this.watches.get(watchId);
    if (!w) return;

    w.stopped = true;

    // Resolve any in-flight waiters so callers don't hang
    for (const waiter of w.pollWaiters) {
      clearTimeout(waiter.timer);
      waiter.resolve();
    }
    w.pollWaiters.length = 0;

    try {
      await w.stop();
    } catch {
      // Best-effort
    }

    try {
      await w.done;
    } catch {
      // Tail may reject if it was in the middle of polling; ignore.
    }

    this.watches.delete(watchId);
  }

  /**
   * Drain buffered entries (up to maxEntries) and any rotation/error events
   * from the watch. Removes drained items from the underlying buffers.
   */
  drain(
    watchId: string,
    maxEntries: number,
  ): {
    entries: LogEntry[];
    errors: Array<{message: string; at: string}>;
    filesDiscovered: LogFile[];
    rotations: LogFile[];
    truncated: boolean;
  } {
    const w = this.getWatchOrThrow(watchId);
    const entries = w.buffer.splice(0, maxEntries);
    for (const e of entries) {
      w.bufferBytes -= entryBytes(e);
    }
    if (w.bufferBytes < 0 || w.buffer.length === 0) w.bufferBytes = 0;
    const truncated = w.buffer.length > 0;
    const rotations = w.rotations.splice(0);
    const errors = w.errors.splice(0);
    // Only files discovered since the last poll — drained like rotations/errors.
    const filesDiscovered = w.pendingFilesDiscovered.splice(0);
    w.lastActivityAt = Date.now();
    return {entries, errors, filesDiscovered, rotations, truncated};
  }

  findByHostname(hostname: string): LogWatchEntry | undefined {
    for (const w of this.watches.values()) {
      if (w.hostname === hostname) return w;
    }
    return undefined;
  }

  getWatch(watchId: string): LogWatchEntry | undefined {
    return this.watches.get(watchId);
  }

  getWatchOrThrow(watchId: string): LogWatchEntry {
    const w = this.watches.get(watchId);
    if (!w) {
      throw new Error(`No log watch found with id "${watchId}". Use logs_watch_list to see active watches.`);
    }
    w.lastActivityAt = Date.now();
    return w;
  }

  listWatches(): LogWatchEntry[] {
    return [...this.watches.values()];
  }

  registerWatch(opts: RegisterWatchOptions): LogWatchEntry {
    const {
      hostname,
      prefixes,
      tailResult,
      bufferCap = DEFAULT_BUFFER_CAP,
      bufferBytesCap = DEFAULT_BUFFER_BYTES_CAP,
    } = opts;

    const existing = this.findByHostname(hostname);
    if (existing) {
      throw new Error(
        `A log watch already exists for ${hostname} (watch_id: "${existing.watchId}"). ` +
          `Stop it with logs_watch_stop first, or poll the existing watch.`,
      );
    }

    const watchId = randomUUID();
    const now = Date.now();
    const entry: LogWatchEntry = {
      buffer: [],
      bufferBytes: 0,
      bufferBytesCap,
      bufferCap,
      createdAt: now,
      done: tailResult.done,
      droppedEntries: 0,
      errors: [],
      filesDiscovered: [],
      hostname,
      lastActivityAt: now,
      pendingFilesDiscovered: [],
      pollWaiters: [],
      prefixes,
      rotations: [],
      stop: tailResult.stop,
      stopped: false,
      totalEntriesSeen: 0,
      watchId,
    };
    this.watches.set(watchId, entry);
    return entry;
  }

  /**
   * Wait until at least one entry is buffered (or rotation/error event), or until
   * timeout elapses. Returns immediately if the buffer is non-empty.
   */
  async waitForActivity(watchId: string, timeoutMs: number): Promise<void> {
    const w = this.getWatchOrThrow(watchId);
    if (w.buffer.length > 0 || w.rotations.length > 0 || w.errors.length > 0 || w.stopped) {
      return;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const idx = w.pollWaiters.findIndex((waiter) => waiter.timer === timer);
        if (idx !== -1) w.pollWaiters.splice(idx, 1);
        resolve();
      }, timeoutMs);
      w.pollWaiters.push({resolve: () => resolve(), timer});
    });
  }

  private async cleanupIdleWatches(): Promise<void> {
    const logger = getLogger();
    const now = Date.now();
    const idle = [...this.watches.entries()].filter(([, w]) => now - w.lastActivityAt > IDLE_TTL_MS);
    await Promise.allSettled(
      idle.map(([id, w]) => {
        logger.info({watchId: id, hostname: w.hostname}, 'Cleaning up idle log watch');
        return this.destroyWatch(id);
      }),
    );
  }

  private flushWaiters(w: LogWatchEntry): void {
    if (w.pollWaiters.length === 0) return;
    const waiters = w.pollWaiters.splice(0);
    for (const waiter of waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve();
    }
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
