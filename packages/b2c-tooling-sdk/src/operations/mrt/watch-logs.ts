/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {AuthStrategy} from '../../auth/types.js';
import {
  DEFAULT_LOG_WATCH_POLL_MAX_ENTRIES,
  LogWatchBuffer,
  type LogWatchBatch,
  type LogWatchBufferOptions,
  type LogWatchPollOptions,
  type LogWatchStats,
} from '../logs/watch-buffer.js';
import {tailMrtLogs, type MrtLogEntry, type TailMrtLogsOptions, type TailMrtLogsResult} from './tail-logs.js';

export interface WatchMrtLogsOptions extends LogWatchBufferOptions {
  /** MRT project slug. */
  projectSlug: string;
  /** MRT environment slug. */
  environmentSlug: string;
  /** MRT API origin URL. */
  origin?: string;
  /** User email sent with the log stream connection. */
  user?: string;
  /** Replaces {@link tailMrtLogs}, for tests. */
  tail?: (options: TailMrtLogsOptions, auth: AuthStrategy) => Promise<TailMrtLogsResult>;
}

export type MrtLogWatchPoll = LogWatchBatch<MrtLogEntry>;

export interface MrtLogWatchInfo extends LogWatchStats {
  projectSlug: string;
  environmentSlug: string;
  origin?: string;
}

/**
 * A live MRT log stream that buffers entries until they are polled. The stream
 * can end on its own (idle timeout, expired credentials, server restart); the
 * next poll reports `stopped: true` and the connection error, and buffered
 * entries stay readable.
 */
export interface MrtLogWatch {
  poll(options?: LogWatchPollOptions): Promise<MrtLogWatchPoll>;
  info(): MrtLogWatchInfo;
  /** Close the stream. Unread entries stay readable through `poll()`. Safe to repeat. */
  stop(): Promise<void>;
}

/**
 * Start a buffered MRT log watch. See {@link watchLogs} for buffering and filters.
 *
 * @example
 * ```typescript
 * const watch = await watchMrtLogs({projectSlug: 'my-project', environmentSlug: 'production', level: ['ERROR']}, auth);
 * const {entries, stopped} = await watch.poll({timeoutMs: 5000});
 * await watch.stop();
 * ```
 */
export async function watchMrtLogs(options: WatchMrtLogsOptions, auth: AuthStrategy): Promise<MrtLogWatch> {
  const {projectSlug, environmentSlug, origin} = options;
  const buffer = new LogWatchBuffer<MrtLogEntry>(options);
  const tail = await (options.tail ?? tailMrtLogs)(
    {
      projectSlug,
      environmentSlug,
      origin,
      user: options.user,
      onEntry: (entry) => buffer.push(entry),
      // A failed connection reports its error as the stream closes; keep it for the next poll.
      onError: (error) => buffer.pushError(error, {whenStopped: true}),
      onClose: () => buffer.stop(),
    },
    auth,
  );
  // `done` rejects when the stream closes uncleanly; the error is already buffered.
  tail.done.catch(() => {});
  let stopping: Promise<void> | undefined;
  return {
    async poll(pollOptions = {}) {
      await buffer.wait(pollOptions.timeoutMs ?? 0);
      return buffer.drain(pollOptions.maxEntries ?? DEFAULT_LOG_WATCH_POLL_MAX_ENTRIES);
    },
    info: () => ({...buffer.stats(), projectSlug, environmentSlug, origin}),
    stop() {
      stopping ??= (async () => {
        buffer.stop();
        try {
          tail.stop();
        } catch {
          // Best effort.
        }
        await tail.done.catch(() => {});
      })();
      return stopping;
    },
  };
}
