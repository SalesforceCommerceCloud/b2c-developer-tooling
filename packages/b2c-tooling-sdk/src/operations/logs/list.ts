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
 * Lists log files on a B2C Commerce instance.
 *
 * @param instance - B2C instance to list logs from
 * @param options - Listing options (filters, sorting)
 * @returns Array of log files
 *
 * @example
 * ```typescript
 * // List all error and customerror logs
 * const logs = await listLogFiles(instance, {
 *   prefixes: ['error', 'customerror'],
 *   sortBy: 'date',
 *   sortOrder: 'desc'
 * });
 * ```
 */
export async function listLogFiles(instance: B2CInstance, options: ListLogsOptions = {}): Promise<LogFile[]> {
  const logger = getLogger();
  const {prefixes, sortBy = 'date', sortOrder = 'desc'} = options;

  logger.debug({prefixes, sortBy, sortOrder}, 'Listing log files');

  // Get all files from Logs directory
  const entries = await instance.webdav.propfind('Logs', '1');

  // Filter to only log files (not directories, not the Logs directory itself)
  const logFiles: LogFile[] = entries
    .filter((entry) => {
      // Skip directories
      if (entry.isCollection) return false;

      // Skip if not a .log file
      const name = entry.displayName || entry.href.split('/').pop() || '';
      if (!name.endsWith('.log')) return false;

      return true;
    })
    .map((entry) => {
      const name = entry.displayName || entry.href.split('/').pop() || '';
      const prefix = extractPrefix(name);

      return {
        name,
        prefix,
        size: entry.contentLength || 0,
        lastModified: entry.lastModified || new Date(0),
        path: `Logs/${name}`,
      };
    });

  // Filter by prefix if specified
  let filtered = logFiles;
  if (prefixes && prefixes.length > 0) {
    const prefixSet = new Set(prefixes.map((p) => p.toLowerCase()));
    filtered = logFiles.filter((file) => {
      // Check exact prefix match
      if (prefixSet.has(file.prefix.toLowerCase())) return true;

      // Also check if the prefix starts with any of the specified prefixes
      // This handles cases like "custom-mylog" matching "custom"
      for (const p of prefixSet) {
        if (file.prefix.toLowerCase().startsWith(p)) return true;
      }

      return false;
    });
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
