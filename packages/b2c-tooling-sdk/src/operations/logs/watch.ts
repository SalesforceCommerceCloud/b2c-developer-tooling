/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {B2CInstance} from '../../instance/index.js';
import {tailLogs} from './tail.js';
import type {LogEntry, LogFile, TailLogsOptions, TailLogsResult} from './types.js';
import {
  DEFAULT_LOG_WATCH_POLL_MAX_ENTRIES,
  LogWatchBuffer,
  type LogWatchBatch,
  type LogWatchBufferOptions,
  type LogWatchPollOptions,
  type LogWatchStats,
} from './watch-buffer.js';

const ROTATION_CAP = 100;

export interface WatchLogsOptions extends LogWatchBufferOptions {
  /** Log prefixes. Default: `["error", "customerror"]`. */
  prefixes?: string[];
  /** WebDAV polling interval in milliseconds. Default: 3000. */
  pollInterval?: number;
  /** Existing entries per file to buffer at startup. Default: 0. */
  lastEntries?: number;
  /** Converts remote paths in messages to local paths. */
  pathNormalizer?: (message: string) => string;
  /** Replaces {@link tailLogs}, for tests. */
  tail?: (instance: B2CInstance, options: TailLogsOptions) => Promise<TailLogsResult>;
}

export interface LogWatchPoll extends LogWatchBatch<LogEntry> {
  /** Files discovered since the previous poll. */
  filesDiscovered: LogFile[];
  /** Files that rotated since the previous poll. */
  filesRotated: LogFile[];
}

export interface LogWatchInfo extends LogWatchStats {
  prefixes: string[];
  /** Every file discovered since the watch started. */
  filesDiscovered: LogFile[];
}

/**
 * A running tail of instance logs that buffers entries until they are polled,
 * for hosts that read logs in turns (agent tools, request/response UIs) rather
 * than through callbacks.
 */
export interface LogWatch {
  readonly prefixes: string[];
  /** Wait up to `timeoutMs` for activity, then drain buffered entries and events. */
  poll(options?: LogWatchPollOptions): Promise<LogWatchPoll>;
  info(): LogWatchInfo;
  /** Stop tailing. Unread entries stay readable through `poll()`. Safe to repeat. */
  stop(): Promise<void>;
}

const DEFAULT_PREFIXES = ['error', 'customerror'];

/**
 * Start a buffered log watch. Entries matching `level`/`search` are buffered up
 * to the caps, oldest dropped first; `poll()` reports how many were dropped.
 *
 * @example
 * ```typescript
 * const watch = await watchLogs(instance, {prefixes: ['error'], level: ['ERROR']});
 * const {entries, truncated} = await watch.poll({timeoutMs: 5000});
 * await watch.stop();
 * ```
 */
export async function watchLogs(instance: B2CInstance, options: WatchLogsOptions = {}): Promise<LogWatch> {
  const prefixes = options.prefixes ?? DEFAULT_PREFIXES;
  const discovered: LogFile[] = [];
  let pendingDiscovered: LogFile[] = [];
  let rotations: LogFile[] = [];
  const buffer = new LogWatchBuffer<LogEntry>(options, () => rotations.length > 0);
  const tail = await (options.tail ?? tailLogs)(instance, {
    prefixes,
    pollInterval: options.pollInterval ?? 3000,
    lastEntries: options.lastEntries ?? 0,
    pathNormalizer: options.pathNormalizer,
    onEntry: (entry) => buffer.push(entry),
    onError: (error) => buffer.pushError(error),
    onFileDiscovered(file) {
      if (buffer.stopped || discovered.some((known) => known.name === file.name)) return;
      discovered.push(file);
      pendingDiscovered.push(file);
      buffer.lastActivityAt = Date.now();
    },
    onFileRotated(file) {
      if (buffer.stopped) return;
      rotations.push(file);
      if (rotations.length > ROTATION_CAP) rotations = rotations.slice(-ROTATION_CAP);
      buffer.notify();
    },
  });
  let stopping: Promise<void> | undefined;
  return {
    prefixes,
    async poll(pollOptions = {}) {
      await buffer.wait(pollOptions.timeoutMs ?? 0);
      const batch = buffer.drain(pollOptions.maxEntries ?? DEFAULT_LOG_WATCH_POLL_MAX_ENTRIES);
      const filesDiscovered = pendingDiscovered;
      const filesRotated = rotations;
      pendingDiscovered = [];
      rotations = [];
      return {...batch, filesDiscovered, filesRotated};
    },
    info: () => ({...buffer.stats(), prefixes, filesDiscovered: [...discovered]}),
    stop() {
      stopping ??= (async () => {
        buffer.stop();
        await tail.stop().catch(() => {});
        await tail.done.catch(() => {});
      })();
      return stopping;
    },
  };
}
