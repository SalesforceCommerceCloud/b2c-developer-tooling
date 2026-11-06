/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Log operations for B2C Commerce instances.
 *
 * This module provides functions for listing, tailing, and analyzing log files
 * on B2C Commerce instances via WebDAV.
 *
 * @module operations/logs
 *
 * @example
 * List log files:
 * ```typescript
 * import { listLogFiles } from '@salesforce/b2c-tooling-sdk/operations/logs';
 *
 * const files = await listLogFiles(instance, {
 *   prefixes: ['error', 'customerror'],
 *   sortBy: 'date',
 *   sortOrder: 'desc'
 * });
 *
 * for (const file of files) {
 *   console.log(`${file.name} (${file.size} bytes)`);
 * }
 * ```
 *
 * @example
 * Tail logs in real-time:
 * ```typescript
 * import { tailLogs, createPathNormalizer } from '@salesforce/b2c-tooling-sdk/operations/logs';
 *
 * const normalizer = createPathNormalizer({ cartridgePath: './cartridges' });
 *
 * const { stop, done } = await tailLogs(instance, {
 *   prefixes: ['error', 'customerror'],
 *   pathNormalizer: normalizer,
 *   onEntry: (entry) => {
 *     console.log(`[${entry.file}] ${entry.level}: ${entry.message}`);
 *   },
 *   onError: (err) => console.error('Error:', err),
 * });
 *
 * // Stop after 30 seconds
 * setTimeout(() => stop(), 30000);
 *
 * await done;
 * ```
 *
 * @example
 * Get recent logs (one-shot):
 * ```typescript
 * import { getRecentLogs } from '@salesforce/b2c-tooling-sdk/operations/logs';
 *
 * const entries = await getRecentLogs(instance, {
 *   prefixes: ['error'],
 *   maxEntries: 50
 * });
 *
 * for (const entry of entries) {
 *   console.log(`[${entry.timestamp}] ${entry.message}`);
 * }
 * ```
 */

// Types
export type {
  GetRecentLogsOptions,
  ListLogsOptions,
  LogEntry,
  LogFile,
  TailLogsCallbacks,
  TailLogsOptions,
  TailLogsResult,
} from './types.js';

// List operations
export {extractPrefix, listLogFiles, matchesPrefixFilters, unreadCustomPrefixes} from './list.js';

// Tail operations
export {aggregateLogEntries, getRecentLogs, parseLogEntry, splitLines, tailLogs} from './tail.js';

// Buffered watches
export {watchLogs} from './watch.js';
export type {LogWatch, LogWatchInfo, LogWatchPoll, WatchLogsOptions} from './watch.js';
export {
  DEFAULT_LOG_WATCH_BUFFER_BYTES_CAP,
  DEFAULT_LOG_WATCH_BUFFER_CAP,
  DEFAULT_LOG_WATCH_POLL_MAX_ENTRIES,
} from './watch-buffer.js';
export type {
  LogWatchBatch,
  LogWatchBufferOptions,
  LogWatchError,
  LogWatchFilterOptions,
  LogWatchPollOptions,
  LogWatchStats,
} from './watch-buffer.js';

// Path normalization
export {
  createPathNormalizer,
  discoverAndCreateNormalizer,
  extractPaths,
  type PathNormalizerOptions,
} from './path-normalizer.js';

// Filtering helpers
export {
  filterByLevel,
  filterBySearch,
  filterBySince,
  matchesLevel,
  matchesSearch,
  parseLogTimestamp,
  parseRelativeTime,
  parseSinceTime,
} from './filter.js';
