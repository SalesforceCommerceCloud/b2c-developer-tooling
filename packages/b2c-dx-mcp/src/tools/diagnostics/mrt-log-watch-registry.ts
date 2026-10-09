/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {MrtLogEntry, TailMrtLogsResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {ToolExecutionContext} from '../adapter.js';
import type {ToolResolution} from '../project-context.js';

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

export interface PollWaiter {
  resolve: () => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface MrtLogWatchEntry {
  watchId: string;
  /** MRT project slug being tailed. */
  project: string;
  /** MRT environment slug being tailed. */
  environment: string;
  /** MRT API origin URL (used for the logs WebSocket host). */
  origin?: string;
  buffer: MrtLogEntry[];
  /** Running byte size of `buffer` (raw + message), used for the byte cap. */
  bufferBytes: number;
  errors: Array<{message: string; at: string}>;
  totalEntriesSeen: number;
  droppedEntries: number;
  bufferCap: number;
  bufferBytesCap: number;
  stop: () => void;
  done: Promise<void>;
  pollWaiters: PollWaiter[];
  createdAt: number;
  lastActivityAt: number;
  /**
   * True once the underlying WebSocket has closed — either via stop() or
   * because the server closed/failed the connection on its own. A stopped
   * watch keeps its buffered entries until drained or idle-reaped.
   */
  stopped: boolean;
  resolution?: ToolResolution;
}

export interface RegisterMrtWatchOptions {
  project: string;
  environment: string;
  origin?: string;
  tailResult: TailMrtLogsResult;
  bufferCap?: number;
  bufferBytesCap?: number;
  resolution?: ToolResolution;
}

/** Approximate in-memory byte cost of a buffered entry. */
function entryBytes(entry: MrtLogEntry): number {
  return (entry.raw?.length ?? 0) + (entry.message?.length ?? 0);
}

/**
 * Stable dedup key for an MRT log watch. A developer may tail several
 * (project, environment, origin) tuples concurrently — unlike the SFCC log
 * watch which keys on hostname — so all three components form the key. A space
 * separator is safe since project/environment slugs are URL-safe (no spaces).
 */
export function mrtWatchKey(project: string, environment: string, origin?: string): string {
  return `${project}\u0000${environment}\u0000${origin ?? ''}`;
}

/**
 * In-memory registry of background MRT log-tail streams.
 *
 * Mirrors `LogWatchRegistry` (SFCC instance logs) but adapted for the MRT
 * logging WebSocket: there are no log files, prefixes, or rotations — just a
 * single live stream per (project, environment, origin). The stream can also
 * close on its own (idle timeout, auth expiry, server restart), which is
 * recorded as `stopped: true` plus a buffered error so a poll can surface it.
 */
export class MrtLogWatchRegistry {
  private cleanupTimer: ReturnType<typeof setInterval> | undefined;
  private readonly watches = new Map<string, MrtLogWatchEntry>();

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
  appendEntry(watchId: string, entry: MrtLogEntry): void {
    const w = this.watches.get(watchId);
    if (!w || w.stopped) return;
    w.buffer.push(entry);
    w.bufferBytes += entryBytes(entry);
    w.totalEntriesSeen += 1;

    // Evict oldest entries until under BOTH the count cap and the byte cap.
    // Always keep at least one entry so a single oversized entry is still
    // deliverable.
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
    // Record the error even once stopped — a connection failure surfaces as an
    // error right as the stream closes, and the agent still needs to see it.
    if (!w) return;
    w.errors.push({message: err.message, at: new Date().toISOString()});
    if (w.errors.length > ERROR_CAP) {
      w.errors.splice(0, w.errors.length - ERROR_CAP);
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
      w.stop();
    } catch {
      // Best-effort
    }

    try {
      // tailMrtLogs rejects `done` on a non-clean WebSocket close; swallow it so
      // shutdown doesn't surface an unhandled rejection.
      await w.done;
    } catch {
      // Ignore
    }

    this.watches.delete(watchId);
  }

  /**
   * Drain buffered entries (up to maxEntries) and any error events from the
   * watch. Removes drained items from the underlying buffers.
   */
  drain(
    watchId: string,
    maxEntries: number,
  ): {
    entries: MrtLogEntry[];
    errors: Array<{message: string; at: string}>;
    truncated: boolean;
  } {
    const w = this.getWatchOrThrow(watchId);
    const entries = w.buffer.splice(0, maxEntries);
    for (const e of entries) {
      w.bufferBytes -= entryBytes(e);
    }
    if (w.bufferBytes < 0 || w.buffer.length === 0) w.bufferBytes = 0;
    const truncated = w.buffer.length > 0;
    const errors = w.errors.splice(0);
    w.lastActivityAt = Date.now();
    return {entries, errors, truncated};
  }

  findByKey(project: string, environment: string, origin?: string): MrtLogWatchEntry | undefined {
    const key = mrtWatchKey(project, environment, origin);
    for (const w of this.watches.values()) {
      if (mrtWatchKey(w.project, w.environment, w.origin) === key) return w;
    }
    return undefined;
  }

  getWatch(watchId: string): MrtLogWatchEntry | undefined {
    return this.watches.get(watchId);
  }

  getWatchOrThrow(watchId: string): MrtLogWatchEntry {
    const w = this.watches.get(watchId);
    if (!w) {
      throw new Error(
        `No MRT log watch found with id "${watchId}". Use mrt_logs_watch(action: list) to see active watches.`,
      );
    }
    w.lastActivityAt = Date.now();
    return w;
  }

  listWatches(): MrtLogWatchEntry[] {
    return [...this.watches.values()];
  }

  /**
   * Mark a watch's stream as closed (the WebSocket ended on its own or via
   * stop). Keeps the entry so buffered entries can still be drained and the
   * `stopped` flag is observable on the next poll; idle cleanup removes it
   * later. Resolves any blocked pollers so they return promptly.
   */
  markStreamClosed(watchId: string): void {
    const w = this.watches.get(watchId);
    if (!w || w.stopped) return;
    w.stopped = true;
    w.lastActivityAt = Date.now();
    this.flushWaiters(w);
  }

  registerWatch(opts: RegisterMrtWatchOptions): MrtLogWatchEntry {
    const {
      project,
      environment,
      origin,
      tailResult,
      bufferCap = DEFAULT_BUFFER_CAP,
      bufferBytesCap = DEFAULT_BUFFER_BYTES_CAP,
    } = opts;

    const existing = this.findByKey(project, environment, origin);
    if (existing) {
      throw new Error(
        `An MRT log watch already exists for ${project}/${environment} (watch_id: "${existing.watchId}"). ` +
          `Stop it with mrt_logs_watch(action: stop) first, or poll the existing watch.`,
      );
    }

    const watchId = randomUUID();
    const now = Date.now();
    const entry: MrtLogWatchEntry = {
      buffer: [],
      bufferBytes: 0,
      bufferBytesCap,
      bufferCap,
      createdAt: now,
      done: tailResult.done,
      droppedEntries: 0,
      environment,
      errors: [],
      lastActivityAt: now,
      origin,
      pollWaiters: [],
      project,
      stop: tailResult.stop,
      stopped: false,
      totalEntriesSeen: 0,
      watchId,
      resolution: opts.resolution,
    };
    this.watches.set(watchId, entry);
    return entry;
  }

  /**
   * Wait until at least one entry is buffered (or an error event arrives, or
   * the stream stops), or until timeout elapses. Returns immediately if there
   * is already activity to report.
   */
  async waitForActivity(watchId: string, timeoutMs: number): Promise<void> {
    const w = this.getWatchOrThrow(watchId);
    if (w.buffer.length > 0 || w.errors.length > 0 || w.stopped) {
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
        logger.info({watchId: id, project: w.project, environment: w.environment}, 'Cleaning up idle MRT log watch');
        return this.destroyWatch(id);
      }),
    );
  }

  private flushWaiters(w: MrtLogWatchEntry): void {
    if (w.pollWaiters.length === 0) return;
    const waiters = w.pollWaiters.splice(0);
    for (const waiter of waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve();
    }
  }
}

export function getMrtLogWatchRegistry(context: ToolExecutionContext): MrtLogWatchRegistry {
  const registry = context.serverContext?.mrtLogWatches;
  if (!registry) {
    throw new Error('MRT log watch registry not available');
  }
  return registry;
}
