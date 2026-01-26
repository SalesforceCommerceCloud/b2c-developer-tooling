/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Represents a log file on a B2C Commerce instance.
 */
export interface LogFile {
  /** File name (e.g., "error-blade1-20250125.log") */
  name: string;
  /** Log prefix/type (e.g., "error", "customerror", "debug") */
  prefix: string;
  /** File size in bytes */
  size: number;
  /** Last modified date */
  lastModified: Date;
  /** Full WebDAV path to the file */
  path: string;
}

/**
 * Represents a parsed log entry.
 */
export interface LogEntry {
  /** File name this entry came from */
  file: string;
  /** Log level (INFO, WARN, ERROR, DEBUG, etc.) */
  level?: string;
  /** Timestamp string from the log entry */
  timestamp?: string;
  /** Log message (with path normalization applied if enabled) */
  message: string;
  /** Raw unprocessed log line */
  raw: string;
}

/**
 * Options for listing log files.
 */
export interface ListLogsOptions {
  /**
   * Filter by log prefixes (e.g., ["error", "customerror"]).
   * If not specified, returns all log files.
   */
  prefixes?: string[];
  /**
   * Sort field: "name", "date", or "size".
   * @default "date"
   */
  sortBy?: 'name' | 'date' | 'size';
  /**
   * Sort order.
   * @default "desc"
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Callback functions for tail operation events.
 */
export interface TailLogsCallbacks {
  /** Called for each new log entry */
  onEntry?: (entry: LogEntry) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when a new log file is discovered */
  onFileDiscovered?: (file: LogFile) => void;
  /** Called when file rotation is detected (file size decreased) */
  onFileRotated?: (file: LogFile) => void;
}

/**
 * Options for tailing logs.
 */
export interface TailLogsOptions extends TailLogsCallbacks {
  /**
   * Filter by log prefixes (e.g., ["error", "customerror"]).
   * @default ["error", "customerror"]
   */
  prefixes?: string[];
  /**
   * Polling interval in milliseconds.
   * @default 3000
   */
  pollInterval?: number;
  /**
   * Include existing content when starting (tail from beginning).
   * @default false
   */
  includeExisting?: boolean;
  /**
   * Maximum number of entries to collect before stopping.
   * When set, the tail operation will automatically stop after collecting
   * this many entries. Useful for programmatic access.
   */
  maxEntries?: number;
  /**
   * Path normalizer function to convert remote paths to local paths.
   * Called on each log message to make paths clickable in IDEs.
   */
  pathNormalizer?: (message: string) => string;
}

/**
 * Result of a tail operation.
 */
export interface TailLogsResult {
  /** Stop the tailing operation */
  stop: () => Promise<void>;
  /** Currently tracked files */
  files: LogFile[];
  /** Collected entries (when maxEntries is set) */
  entries: LogEntry[];
  /** Promise that resolves when tailing stops (via stop() or maxEntries) */
  done: Promise<void>;
}

/**
 * Options for getting recent logs (one-shot retrieval).
 */
export interface GetRecentLogsOptions {
  /**
   * Filter by log prefixes (e.g., ["error", "customerror"]).
   * @default ["error", "customerror"]
   */
  prefixes?: string[];
  /**
   * Maximum number of entries to retrieve.
   * @default 100
   */
  maxEntries?: number;
  /**
   * Maximum bytes to read from the end of each file.
   * @default 65536 (64KB)
   */
  tailBytes?: number;
  /**
   * Path normalizer function to convert remote paths to local paths.
   */
  pathNormalizer?: (message: string) => string;
}
