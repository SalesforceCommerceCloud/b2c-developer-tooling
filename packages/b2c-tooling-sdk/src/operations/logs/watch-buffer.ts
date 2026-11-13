/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Bounded buffer shared by the instance and MRT log watches. Internal: the
 * public surface is `watchLogs()` and `watchMrtLogs()`.
 */

/** Maximum buffered entries before the oldest are dropped. */
export const DEFAULT_LOG_WATCH_BUFFER_CAP = 5000;
/** Maximum buffered bytes (raw + message) before the oldest entries are dropped. */
export const DEFAULT_LOG_WATCH_BUFFER_BYTES_CAP = 50 * 1024 * 1024;
/** Maximum entries returned by one poll. */
export const DEFAULT_LOG_WATCH_POLL_MAX_ENTRIES = 200;

const ERROR_CAP = 25;

export interface LogWatchError {
  message: string;
  /** ISO timestamp. */
  at: string;
}

/** Entry filters applied as entries arrive, before buffering. */
export interface LogWatchFilterOptions {
  /** Keep only these levels (case-insensitive). Entries without a level are dropped when set. */
  level?: string[];
  /** Keep only entries whose message or raw line contains this text (case-insensitive). */
  search?: string;
}

export interface LogWatchBufferOptions extends LogWatchFilterOptions {
  /** Maximum buffered entries. Default: 5000. */
  bufferCap?: number;
  /** Maximum buffered bytes. Default: 50 MiB. */
  bufferBytesCap?: number;
}

export interface LogWatchPollOptions {
  /** Maximum entries to return. Default: 200. */
  maxEntries?: number;
  /** Wait this long when nothing is buffered. Default: 0 (return immediately). */
  timeoutMs?: number;
}

/** Counters common to every log watch. */
export interface LogWatchStats {
  bufferedEntries: number;
  /** Entries dropped from a full buffer since the last poll. */
  droppedEntries: number;
  totalEntriesSeen: number;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Epoch milliseconds of the last entry, event, or poll. */
  lastActivityAt: number;
  stopped: boolean;
}

/** Fields common to every poll result. */
export interface LogWatchBatch<E> {
  entries: E[];
  errors: LogWatchError[];
  /** Entries dropped from a full buffer since the previous poll. */
  droppedEntries: number;
  /** Entries still buffered after this poll. */
  bufferedRemaining: number;
  /** More entries are buffered; poll again. */
  truncated: boolean;
  stopped: boolean;
}

interface LoggedEntry {
  level?: string;
  message?: string;
  raw?: string;
}

function entryBytes(entry: LoggedEntry): number {
  return (entry.raw?.length ?? 0) + (entry.message?.length ?? 0);
}

export function createEntryFilter(options: LogWatchFilterOptions): (entry: LoggedEntry) => boolean {
  const levels = options.level?.length ? new Set(options.level.map((level) => level.toUpperCase())) : undefined;
  const search = options.search?.toLowerCase();
  return (entry) => {
    if (levels && !(entry.level && levels.has(entry.level.toUpperCase()))) return false;
    return (
      !search ||
      (entry.message ?? '').toLowerCase().includes(search) ||
      (entry.raw ?? '').toLowerCase().includes(search)
    );
  };
}

export class LogWatchBuffer<E extends LoggedEntry> {
  readonly createdAt = Date.now();
  lastActivityAt = this.createdAt;
  stopped = false;
  private bytes = 0;
  private dropped = 0;
  private readonly entries: E[] = [];
  private readonly errors: LogWatchError[] = [];
  private readonly accepts: (entry: E) => boolean;
  private readonly bufferCap: number;
  private readonly bufferBytesCap: number;
  private total = 0;
  private waiters: Array<() => void> = [];

  constructor(
    options: LogWatchBufferOptions,
    /** Extra pending events (such as rotations) that make a poll return early. */
    private readonly hasPendingEvents: () => boolean = () => false,
  ) {
    this.accepts = createEntryFilter(options);
    this.bufferCap = options.bufferCap ?? DEFAULT_LOG_WATCH_BUFFER_CAP;
    this.bufferBytesCap = options.bufferBytesCap ?? DEFAULT_LOG_WATCH_BUFFER_BYTES_CAP;
  }

  /** Drain up to `maxEntries` entries and all errors. */
  drain(maxEntries: number): LogWatchBatch<E> {
    const entries = this.entries.splice(0, maxEntries);
    for (const entry of entries) this.bytes -= entryBytes(entry);
    if (this.bytes < 0 || this.entries.length === 0) this.bytes = 0;
    const droppedEntries = this.dropped;
    this.dropped = 0;
    this.lastActivityAt = Date.now();
    return {
      entries,
      errors: this.errors.splice(0),
      droppedEntries,
      bufferedRemaining: this.entries.length,
      truncated: this.entries.length > 0,
      stopped: this.stopped,
    };
  }

  /** Mark activity that a poll should return for (for example a rotation). */
  notify(): void {
    this.lastActivityAt = Date.now();
    const waiters = this.waiters;
    this.waiters = [];
    for (const resolve of waiters) resolve();
  }

  /** Buffer an entry that passes the filters, dropping the oldest when over either cap. */
  push(entry: E): void {
    if (this.stopped || !this.accepts(entry)) return;
    this.entries.push(entry);
    this.bytes += entryBytes(entry);
    this.total += 1;
    // Keep at least one entry so a single oversized entry is still delivered.
    while (this.entries.length > 1 && (this.entries.length > this.bufferCap || this.bytes > this.bufferBytesCap)) {
      this.bytes -= entryBytes(this.entries.shift()!);
      this.dropped += 1;
    }
    this.notify();
  }

  pushError(error: Error, options: {whenStopped?: boolean} = {}): void {
    if (this.stopped && !options.whenStopped) return;
    this.errors.push({message: error.message, at: new Date().toISOString()});
    if (this.errors.length > ERROR_CAP) this.errors.splice(0, this.errors.length - ERROR_CAP);
    this.notify();
  }

  stats(): LogWatchStats {
    return {
      bufferedEntries: this.entries.length,
      droppedEntries: this.dropped,
      totalEntriesSeen: this.total,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt,
      stopped: this.stopped,
    };
  }

  /** Stop accepting entries and release waiting polls. Buffered entries stay readable. */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.notify();
  }

  /** Resolve when something is buffered, the watch stops, or `timeoutMs` elapses. */
  async wait(timeoutMs: number): Promise<void> {
    if (timeoutMs <= 0 || this.entries.length > 0 || this.errors.length > 0 || this.stopped || this.hasPendingEvents())
      return;
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.waiters = this.waiters.filter((waiter) => waiter !== done);
        resolve();
      };
      const timer = setTimeout(done, timeoutMs);
      this.waiters.push(done);
    });
  }
}
