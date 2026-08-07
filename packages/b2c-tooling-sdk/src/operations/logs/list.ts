/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Log file listing operations.
 */
import type {B2CInstance} from '../../instance/index.js';
import {getLogger} from '../../logging/logger.js';
import type {ListLogsOptions, LogFile} from './types.js';

/**
 * Known log file prefixes in B2C Commerce.
 * Used to extract the prefix from log file names.
 */
const LOG_PREFIXES = [
  // Custom logs (must check first due to "custom" prefix)
  'customdebug',
  'custominfo',
  'customwarn',
  'customerror',
  'customfatal',
  // System logs
  'error',
  'warn',
  'info',
  'debug',
  'fatal',
  'api',
  'deprecation',
  'jobs',
  'staging',
  'quota',
  'sql',
  'service',
  'syslog',
  'security',
  'analytics',
  'migration',
  // Custom named logs (format: custom-<name>-...)
  'custom',
] as const;

/**
 * Extracts the log prefix from a filename.
 *
 * @param filename - Log file name (e.g., "error-blade1-20250125.log")
 * @returns The prefix (e.g., "error") or "unknown"
 *
 * @example
 * extractPrefix("error-blade1-20250125.log") // "error"
 * extractPrefix("customerror-blade1-20250125.log") // "customerror"
 * extractPrefix("custom-mylog-blade1-20250125.log") // "custom-mylog"
 */
export function extractPrefix(filename: string): string {
  // Handle custom-<name> pattern (e.g., custom-mylog-blade1-...)
  // Custom log names use word characters only (no dashes) to distinguish from hostname
  const customMatch = filename.match(/^(custom-[a-zA-Z0-9_]+)-/);
  if (customMatch) {
    return customMatch[1];
  }

  // Check known prefixes (order matters - longer matches first)
  for (const prefix of LOG_PREFIXES) {
    if (filename.startsWith(`${prefix}-`) || filename.startsWith(`${prefix}_`)) {
      return prefix;
    }
  }

  // Fallback: extract first segment before dash or underscore
  const match = filename.match(/^([a-zA-Z]+)[-_]/);
  return match ? match[1] : 'unknown';
}

/**
 * Lists the `.log` files in a single Logs directory (depth 1, non-recursive).
 *
 * @param instance - B2C instance to list logs from
 * @param relativeDir - Directory relative to `Logs/` (e.g. "internal"); "" for the root Logs directory
 * @returns Array of log files found directly in that directory
 *
 * For nested directories the returned {@link LogFile.name} and {@link LogFile.path}
 * include the relative directory so file identities stay unique across subdirectories
 * (e.g. `internal/server-...log`) and reads target the correct WebDAV path.
 */
async function listLogFilesInDir(instance: B2CInstance, relativeDir: string): Promise<LogFile[]> {
  const logger = getLogger();
  const propfindPath = relativeDir ? `Logs/${relativeDir}` : 'Logs';

  let entries;
  try {
    entries = await instance.webdav.propfind(propfindPath, '1');
  } catch (error) {
    // A non-existent subdirectory (e.g. a typo'd path filter) should not abort the
    // whole listing — log and treat it as empty.
    logger.debug({error, dir: propfindPath}, `Failed to list log directory: ${propfindPath}`);
    return [];
  }

  return entries
    .filter((entry) => {
      // Skip directories (including the listed directory itself)
      if (entry.isCollection) return false;

      // Skip if not a .log file
      const name = entry.displayName || entry.href.split('/').pop() || '';
      if (!name.endsWith('.log')) return false;

      return true;
    })
    .map((entry) => {
      const basename = entry.displayName || entry.href.split('/').pop() || '';
      const relativeName = relativeDir ? `${relativeDir}/${basename}` : basename;

      return {
        name: relativeName,
        prefix: extractPrefix(basename),
        size: entry.contentLength || 0,
        lastModified: entry.lastModified || new Date(0),
        path: `Logs/${relativeName}`,
      };
    });
}

/**
 * Lists log files on a B2C Commerce instance.
 *
 * Filters in {@link ListLogsOptions.prefixes} are matched in one of two ways:
 *
 * - **Prefix filters** (no `/`, e.g. `"error"`) match the extracted log-category
 *   prefix of files in the top-level `Logs/` directory.
 * - **Path filters** (contain a `/`, e.g. `"internal/server"`) recurse into the
 *   named subdirectory of `Logs/` and match against each file's path relative to
 *   `Logs/`. This is the only case that lists subdirectories — by default only the
 *   top-level `Logs/` directory is scanned.
 *
 * @param instance - B2C instance to list logs from
 * @param options - Listing options (filters, sorting)
 * @returns Array of log files
 *
 * @example
 * ```typescript
 * // List all error and customerror logs (top-level)
 * const logs = await listLogFiles(instance, {
 *   prefixes: ['error', 'customerror'],
 *   sortBy: 'date',
 *   sortOrder: 'desc'
 * });
 *
 * // List server logs in the internal/ subdirectory
 * const internal = await listLogFiles(instance, {prefixes: ['internal/server']});
 * ```
 */
export async function listLogFiles(instance: B2CInstance, options: ListLogsOptions = {}): Promise<LogFile[]> {
  const logger = getLogger();
  const {prefixes, sortBy = 'date', sortOrder = 'desc'} = options;

  logger.debug({prefixes, sortBy, sortOrder}, 'Listing log files');

  // Partition filters: path-like filters (containing "/") select files in a
  // subdirectory by relative path; the rest match the top-level category prefix.
  const allFilters = prefixes ?? [];
  const pathFilters = allFilters.filter((p) => p.includes('/'));
  const prefixFilters = allFilters.filter((p) => !p.includes('/'));

  // Always scan the top-level Logs directory.
  const topLevel = await listLogFilesInDir(instance, '');

  // Recurse only when a path-like filter is present, and only into the
  // subdirectory that filter names (the segment before its last "/").
  const subDirs = new Set(pathFilters.map((p) => p.slice(0, p.lastIndexOf('/'))).filter((dir) => dir.length > 0));
  const nested: LogFile[] = [];
  for (const dir of subDirs) {
    nested.push(...(await listLogFilesInDir(instance, dir)));
  }

  // Filter by prefix and/or path if any filters were specified.
  let filtered: LogFile[];
  if (allFilters.length === 0) {
    filtered = topLevel;
  } else {
    const prefixSet = new Set(prefixFilters.map((p) => p.toLowerCase()));
    const pathSet = pathFilters.map((p) => p.toLowerCase());

    // Top-level files match by category prefix (exact or startsWith, e.g. "custom" → "custom-mylog").
    const matchedTopLevel = topLevel.filter((file) => {
      const prefix = file.prefix.toLowerCase();
      if (prefixSet.has(prefix)) return true;
      for (const p of prefixSet) {
        if (prefix.startsWith(p)) return true;
      }
      return false;
    });

    // Nested files match by relative path (exact or startsWith, e.g. "internal/server").
    const matchedNested = nested.filter((file) => {
      const relativePath = file.name.toLowerCase();
      return pathSet.some((p) => relativePath === p || relativePath.startsWith(p));
    });

    // Dedupe by path in case multiple filters select the same file.
    const byPath = new Map<string, LogFile>();
    for (const file of [...matchedTopLevel, ...matchedNested]) {
      byPath.set(file.path, file);
    }
    filtered = [...byPath.values()];
  }

  // Sort the results
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
      default:
        comparison = a.lastModified.getTime() - b.lastModified.getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  logger.debug({count: filtered.length}, `Found ${filtered.length} log files`);

  return filtered;
}
