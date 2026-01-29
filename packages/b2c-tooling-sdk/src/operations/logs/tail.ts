/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Log tailing operations for B2C Commerce.
 */
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import {listLogFiles} from './list.js';
import type {GetRecentLogsOptions, LogEntry, LogFile, TailLogsOptions, TailLogsResult} from './types.js';

/**
 * Default log prefixes to tail.
 */
const DEFAULT_PREFIXES = ['error', 'customerror'];

/**
 * Default polling interval in milliseconds.
 */
const DEFAULT_POLL_INTERVAL = 3000;

/**
 * Default max entries for getRecentLogs.
 */
const DEFAULT_MAX_ENTRIES = 100;

/**
 * Default bytes to read from end of file for getRecentLogs.
 */
const DEFAULT_TAIL_BYTES = 65536; // 64KB

/**
 * Regex to detect the start of a new log entry.
 * Matches: [YYYY-MM-DD HH:MM:SS.mmm GMT]
 */
const LOG_ENTRY_START = /^\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+\s+\w+\]/;

/**
 * Parses the first line of a log entry to extract timestamp, level, and message.
 *
 * Expected format: [timestamp GMT] LEVEL context - message
 * Example: [2025-01-25 10:30:45.123 GMT] ERROR PipelineCallServlet|... - Error message
 *
 * The message field will contain:
 * - The content portion from the first line (after LEVEL)
 * - Plus any continuation lines (stack traces, etc.)
 *
 * @param firstLine - First line of the log entry
 * @param file - File name the entry came from
 * @param fullMessage - Complete raw message including all lines
 * @param pathNormalizer - Optional function to normalize paths in the message
 * @returns Parsed log entry
 */
export function parseLogEntry(
  firstLine: string,
  file: string,
  fullMessage: string,
  pathNormalizer?: (msg: string) => string,
): LogEntry {
  // Try to parse the standard B2C log format: [timestamp GMT] LEVEL message
  const match = firstLine.match(/^\[([^\]]+)\]\s+(INFO|WARN|ERROR|DEBUG|FATAL|TRACE)\s+(.*)$/s);

  if (match) {
    const [, timestamp, level, firstLineContent] = match;

    // Build the message: first line content + continuation lines
    const lines = fullMessage.split('\n');
    const continuationLines = lines.slice(1);
    let message = continuationLines.length > 0 ? [firstLineContent, ...continuationLines].join('\n') : firstLineContent;

    if (pathNormalizer) {
      message = pathNormalizer(message);
    }

    return {
      file,
      timestamp,
      level,
      message,
      raw: fullMessage,
    };
  }

  // Fallback: return as unparsed entry
  let message = fullMessage;
  if (pathNormalizer) {
    message = pathNormalizer(message);
  }

  return {
    file,
    message,
    raw: fullMessage,
  };
}

/**
 * Splits content into lines, handling incomplete lines at boundaries.
 * Uses TextDecoder with stream mode for proper UTF-8 multi-byte character handling.
 *
 * @param content - ArrayBuffer content
 * @param decoder - TextDecoder instance (should be reused for streaming)
 * @param isComplete - Whether this is the final chunk (flush decoder)
 * @returns Array of complete lines (without trailing incomplete line)
 */
export function splitLines(
  content: ArrayBuffer,
  decoder: InstanceType<typeof TextDecoder>,
  isComplete = true,
): string[] {
  const text = decoder.decode(content, {stream: !isComplete});

  // Split by newlines, keeping track of whether last line is complete
  const lines = text.split(/\r?\n/);

  // If the text doesn't end with a newline, the last line is incomplete
  // We should not include it in the results (it will be completed in next read)
  if (!isComplete && lines.length > 0 && !text.endsWith('\n')) {
    lines.pop();
  }

  // Filter out empty lines
  return lines.filter((line) => line.trim().length > 0);
}

/**
 * Aggregates lines into multi-line log entries.
 *
 * B2C log entries can span multiple lines. A new entry starts when a line
 * begins with a timestamp pattern: [YYYY-MM-DD HH:MM:SS.mmm GMT]
 *
 * @param lines - Array of individual lines
 * @param pendingLines - Lines carried over from previous chunk (incomplete entry)
 * @returns Object with complete entries and any pending lines for next chunk
 */
export function aggregateLogEntries(
  lines: string[],
  pendingLines: string[] = [],
): {entries: string[][]; pending: string[]} {
  const entries: string[][] = [];
  let currentEntry: string[] = [...pendingLines];

  for (const line of lines) {
    if (LOG_ENTRY_START.test(line)) {
      // This line starts a new entry
      if (currentEntry.length > 0) {
        // Save the previous entry
        entries.push(currentEntry);
      }
      currentEntry = [line];
    } else {
      // Continuation line - add to current entry
      currentEntry.push(line);
    }
  }

  // Return complete entries and any pending lines
  return {
    entries,
    pending: currentEntry,
  };
}

/**
 * Tails log files on a B2C Commerce instance.
 *
 * Continuously polls for new log content using HTTP Range requests for efficiency.
 * Calls the onEntry callback for each new log line.
 *
 * @param instance - B2C instance to tail logs from
 * @param options - Tailing options (filters, callbacks, polling interval)
 * @returns Tail result with stop() control and done promise
 *
 * @example
 * ```typescript
 * const result = await tailLogs(instance, {
 *   prefixes: ['error', 'customerror'],
 *   onEntry: (entry) => console.log(`[${entry.file}] ${entry.message}`),
 *   onError: (err) => console.error('Tail error:', err),
 * });
 *
 * // Stop after 10 seconds
 * setTimeout(() => result.stop(), 10000);
 *
 * // Wait for tailing to complete
 * await result.done;
 * ```
 */
export async function tailLogs(instance: B2CInstance, options: TailLogsOptions = {}): Promise<TailLogsResult> {
  const logger = getLogger();
  const {
    prefixes = DEFAULT_PREFIXES,
    pollInterval = DEFAULT_POLL_INTERVAL,
    lastEntries = 1,
    maxEntries,
    pathNormalizer,
    onEntry,
    onError,
    onFileDiscovered,
    onFileRotated,
  } = options;

  // Track file positions and collected entries
  const filePositions = new Map<string, number>();
  const fileSizes = new Map<string, number>();
  const trackedFiles: LogFile[] = [];
  const collectedEntries: LogEntry[] = [];

  // Control state
  let running = true;
  let resolveComplete: () => void;
  const donePromise = new Promise<void>((resolve) => {
    resolveComplete = resolve;
  });

  // TextDecoder for proper UTF-8 handling (one per file for streaming)
  const decoders = new Map<string, InstanceType<typeof TextDecoder>>();

  // Pending lines for multi-line entry aggregation (per file)
  const pendingLines = new Map<string, string[]>();

  /**
   * Stop the tailing operation.
   */
  const stop = async (): Promise<void> => {
    running = false;
    // Give a small delay to allow any in-flight requests to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  /**
   * Get or create a decoder for a file.
   */
  const getDecoder = (filename: string): InstanceType<typeof TextDecoder> => {
    let decoder = decoders.get(filename);
    if (!decoder) {
      decoder = new TextDecoder('utf-8', {fatal: false});
      decoders.set(filename, decoder);
    }
    return decoder;
  };

  /**
   * Fetch the last N entries from a file's tail.
   */
  const fetchLastEntries = async (file: LogFile, count: number): Promise<LogEntry[]> => {
    if (count <= 0 || file.size === 0) {
      return [];
    }

    try {
      // Read last ~64KB of the file to find recent entries
      const tailBytes = Math.min(file.size, DEFAULT_TAIL_BYTES);
      const startByte = Math.max(0, file.size - tailBytes);

      let content: ArrayBuffer;
      if (startByte === 0) {
        // Read entire file
        content = await instance.webdav.get(file.path);
      } else {
        // Use Range request for tail
        const response = await instance.webdav.request(file.path, {
          method: 'GET',
          headers: {
            Range: `bytes=${startByte}-`,
          },
        });

        if (response.status === 416) {
          // File might be smaller than expected, read entire file
          content = await instance.webdav.get(file.path);
        } else if (!response.ok && response.status !== 206) {
          throw new Error(`Failed to read ${file.name}: ${response.status}`);
        } else {
          content = await response.arrayBuffer();
        }
      }

      // Parse lines and aggregate into multi-line entries
      const decoder = new TextDecoder('utf-8', {fatal: false});
      const lines = splitLines(content, decoder, true);

      // If we started mid-file, skip lines until we find an entry start
      let startIndex = 0;
      if (startByte > 0) {
        for (let i = 0; i < lines.length; i++) {
          if (LOG_ENTRY_START.test(lines[i])) {
            startIndex = i;
            break;
          }
        }
      }

      // Aggregate lines into entries
      const {entries: rawEntries, pending} = aggregateLogEntries(lines.slice(startIndex), []);

      // Include pending as the last entry if it has content
      const allRawEntries = pending.length > 0 ? [...rawEntries, pending] : rawEntries;

      const entries: LogEntry[] = [];
      for (const entryLines of allRawEntries) {
        const firstLine = entryLines[0];
        const fullMessage = entryLines.join('\n');
        const entry = parseLogEntry(firstLine, file.name, fullMessage, pathNormalizer);
        entries.push(entry);
      }

      // Return only the last N entries (most recent)
      return entries.slice(-count);
    } catch (error) {
      logger.error({error, file: file.name}, `Error fetching last entries from ${file.name}`);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      return [];
    }
  };

  /**
   * Discover and track log files matching the prefix filters.
   */
  const discoverFiles = async (): Promise<void> => {
    try {
      const files = await listLogFiles(instance, {prefixes, sortBy: 'date', sortOrder: 'desc'});

      for (const file of files) {
        if (!filePositions.has(file.name)) {
          // New file discovered
          logger.debug({file: file.name}, `Discovered log file: ${file.name}`);

          trackedFiles.push(file);
          fileSizes.set(file.name, file.size);

          // Notify about discovery first
          if (onFileDiscovered) {
            onFileDiscovered(file);
          }

          // Fetch and emit last N entries if requested
          if (lastEntries > 0) {
            const recentEntries = await fetchLastEntries(file, lastEntries);
            for (const entry of recentEntries) {
              if (onEntry) {
                onEntry(entry);
              }
              if (maxEntries !== undefined) {
                collectedEntries.push(entry);
                if (collectedEntries.length >= maxEntries) {
                  running = false;
                  return;
                }
              }
            }
          }

          // Set position to end of file to only tail new content
          filePositions.set(file.name, file.size);
        } else {
          // Check for file rotation (size decreased)
          const previousSize = fileSizes.get(file.name) || 0;
          if (file.size < previousSize) {
            logger.debug({file: file.name, previousSize, newSize: file.size}, `File rotated: ${file.name}`);

            // Reset position to start of new file
            filePositions.set(file.name, 0);
            fileSizes.set(file.name, file.size);

            // Create fresh decoder and clear pending lines
            decoders.set(file.name, new TextDecoder('utf-8', {fatal: false}));
            pendingLines.delete(file.name);

            if (onFileRotated) {
              onFileRotated(file);
            }
          } else {
            fileSizes.set(file.name, file.size);
          }
        }
      }
    } catch (error) {
      logger.error({error}, 'Error discovering log files');
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  /**
   * Read new content from a file using Range request.
   */
  const readNewContent = async (file: LogFile): Promise<void> => {
    const position = filePositions.get(file.name) || 0;
    const currentSize = fileSizes.get(file.name) || 0;

    // No new content
    if (position >= currentSize) {
      return;
    }

    try {
      // Use Range header to get only new content
      const response = await instance.webdav.request(file.path, {
        method: 'GET',
        headers: {
          Range: `bytes=${position}-`,
        },
      });

      // Handle different response statuses
      if (response.status === 416) {
        // Range Not Satisfiable - position is at or past end of file
        // This can happen due to race conditions, just skip
        return;
      }

      if (!response.ok && response.status !== 206) {
        throw new Error(`Failed to read ${file.name}: ${response.status} ${response.statusText}`);
      }

      const content = await response.arrayBuffer();
      const decoder = getDecoder(file.name);

      // Update position based on content received
      const contentLength = content.byteLength;
      filePositions.set(file.name, position + contentLength);

      // Parse lines and aggregate into multi-line entries
      const lines = splitLines(content, decoder, true);
      const {entries: rawEntries, pending} = aggregateLogEntries(lines, pendingLines.get(file.name) || []);

      // Check if we've caught up to the end of the file
      const newPosition = position + contentLength;
      const atEndOfFile = newPosition >= currentSize;

      // If we're at the end of the file, flush pending as a complete entry
      // (the entry is complete for now, more content may arrive later)
      let allEntries = rawEntries;
      if (atEndOfFile && pending.length > 0) {
        allEntries = [...rawEntries, pending];
        pendingLines.set(file.name, []);
      } else {
        pendingLines.set(file.name, pending);
      }

      // Process complete entries
      for (const entryLines of allEntries) {
        const firstLine = entryLines[0];
        const fullMessage = entryLines.join('\n');
        const entry = parseLogEntry(firstLine, file.name, fullMessage, pathNormalizer);

        if (onEntry) {
          onEntry(entry);
        }

        if (maxEntries !== undefined) {
          collectedEntries.push(entry);
          if (collectedEntries.length >= maxEntries) {
            running = false;
            return;
          }
        }
      }
    } catch (error) {
      logger.error({error, file: file.name}, `Error reading ${file.name}`);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  /**
   * Main polling loop.
   */
  const poll = async (): Promise<void> => {
    // Initial file discovery
    await discoverFiles();

    while (running) {
      // Read new content from all tracked files
      for (const file of trackedFiles) {
        if (!running) break;
        await readNewContent(file);
      }

      if (!running) break;

      // Wait for next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Check for new files
      await discoverFiles();
    }

    resolveComplete();
  };

  // Start polling (don't await - runs in background)
  poll().catch((error) => {
    logger.error({error}, 'Polling error');
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    resolveComplete();
  });

  return {
    stop,
    files: trackedFiles,
    entries: collectedEntries,
    done: donePromise,
  };
}

/**
 * Gets recent log entries (one-shot retrieval).
 *
 * Useful for MCP server integration or programmatic access without continuous tailing.
 * Reads the tail end of log files and returns parsed entries.
 *
 * @param instance - B2C instance to get logs from
 * @param options - Retrieval options
 * @returns Array of recent log entries
 *
 * @example
 * ```typescript
 * // Get the last 50 error entries
 * const entries = await getRecentLogs(instance, {
 *   prefixes: ['error'],
 *   maxEntries: 50
 * });
 * ```
 */
export async function getRecentLogs(instance: B2CInstance, options: GetRecentLogsOptions = {}): Promise<LogEntry[]> {
  const logger = getLogger();
  const {
    prefixes = DEFAULT_PREFIXES,
    maxEntries = DEFAULT_MAX_ENTRIES,
    tailBytes = DEFAULT_TAIL_BYTES,
    pathNormalizer,
  } = options;

  logger.debug({prefixes, maxEntries, tailBytes}, 'Getting recent logs');

  // Get log files
  const files = await listLogFiles(instance, {
    prefixes,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const allEntries: LogEntry[] = [];

  // Read from files until we have enough entries
  for (const file of files) {
    if (allEntries.length >= maxEntries) break;

    try {
      // Calculate range to read (tail end of file)
      const startByte = Math.max(0, file.size - tailBytes);

      let content: ArrayBuffer;
      if (startByte === 0) {
        // Read entire file
        content = await instance.webdav.get(file.path);
      } else {
        // Use Range request for tail
        const response = await instance.webdav.request(file.path, {
          method: 'GET',
          headers: {
            Range: `bytes=${startByte}-`,
          },
        });

        if (response.status === 416) {
          // File might be smaller than expected, read entire file
          content = await instance.webdav.get(file.path);
        } else if (!response.ok && response.status !== 206) {
          throw new Error(`Failed to read ${file.name}: ${response.status}`);
        } else {
          content = await response.arrayBuffer();
        }
      }

      // Parse lines and aggregate into multi-line entries
      const decoder = new TextDecoder('utf-8', {fatal: false});
      const lines = splitLines(content, decoder, true);

      // If we started mid-file, skip lines until we find an entry start
      let startIndex = 0;
      if (startByte > 0) {
        for (let i = 0; i < lines.length; i++) {
          if (LOG_ENTRY_START.test(lines[i])) {
            startIndex = i;
            break;
          }
        }
      }

      // Aggregate lines into entries
      const {entries: rawEntries, pending} = aggregateLogEntries(lines.slice(startIndex), []);

      // Process complete entries (ignore pending - we're reading a snapshot)
      // Also include pending as the last entry if it has content
      const allRawEntries = pending.length > 0 ? [...rawEntries, pending] : rawEntries;

      for (const entryLines of allRawEntries) {
        const firstLine = entryLines[0];
        const fullMessage = entryLines.join('\n');
        const entry = parseLogEntry(firstLine, file.name, fullMessage, pathNormalizer);
        allEntries.push(entry);

        if (allEntries.length >= maxEntries) break;
      }
    } catch (error) {
      logger.error({error, file: file.name}, `Error reading ${file.name}`);
      // Continue to next file instead of failing completely
    }
  }

  // Return entries in reverse order (most recent first)
  return allEntries.reverse().slice(0, maxEntries);
}
