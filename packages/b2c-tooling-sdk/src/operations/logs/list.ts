/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Log file listing operations.
 */
import {HTTPError} from '../../errors/http-error.js';
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
 * Wraps a failed Logs PROPFIND in an error that names the refused credential
 * and what to fix. Mirrors the WebDAV auth precedence in B2CInstance
 * (Basic auth when allowed and configured, otherwise OAuth).
 */
function logAccessError(instance: B2CInstance, dir: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const status = error instanceof HTTPError ? error.response.status : undefined;
  if (status !== 401 && status !== 403) {
    return new Error(`Cannot list ${dir}: ${message}`, {cause: error});
  }

  const {auth} = instance;
  const methods = auth.authMethods ?? ['basic'];
  let hint: string;
  if (auth.basic && methods.includes('basic')) {
    hint =
      `The Basic auth credentials for user "${auth.basic.username}" were refused. ` +
      'Use a WebDAV File Access access key of that Business Manager user as the password, ' +
      'not the Account Manager password. Create one with "b2c bm access-key create" or at ' +
      `https://${instance.config.hostname}/on/demandware.store/Sites-Site/default/ViewAccessKeys-List.`;
  } else if (auth.oauth?.clientId) {
    hint =
      `API client ${auth.oauth.clientId} was refused. Grant it read access to "/logs" in Business Manager ` +
      'under Administration > Organization > WebDAV Client Permissions.';
  } else {
    hint = 'Check the WebDAV credentials for this instance.';
  }
  return new Error(`Cannot list ${dir}: ${message}. ${hint}`, {cause: error});
}

/**
 * Checks whether a top-level log file is selected by any of the given prefix filters.
 *
 * A filter matches when the file's extracted category or its file name starts with
 * the filter (case-insensitive). Matching the file name lets a filter select a custom
 * logger whose name contains a dash, which the category alone cannot express.
 *
 * @param file - Log file (its `name` and extracted `prefix`)
 * @param filters - Prefix filters (without `/`)
 * @returns True when at least one filter matches
 *
 * @example
 * matchesPrefixFilters({name: 'custom-My-Api-blade1-20250125.log', prefix: 'custom-My'}, ['custom-My-Api']) // true
 * matchesPrefixFilters({name: 'customerror-blade1-20250125.log', prefix: 'customerror'}, ['custom-']) // false
 */
export function matchesPrefixFilters(file: Pick<LogFile, 'name' | 'prefix'>, filters: string[]): boolean {
  const prefix = file.prefix.toLowerCase();
  const name = file.name.toLowerCase();
  return filters.some((filter) => {
    const f = filter.toLowerCase();
    return prefix.startsWith(f) || name.startsWith(f);
  });
}

/**
 * Returns the `custom-<name>` log categories in `files` that the given filters
 * do not select, sorted by name.
 *
 * Custom logger files (`Logger.getLogger('<name>', ...)`) are not part of the
 * default `error`/`customerror` read, so callers use this to point users at
 * them when a read finds nothing. Path filters (containing `/`) are ignored.
 *
 * @param files - Top-level log files, e.g. from {@link listLogFiles} without filters
 * @param filters - The filters that were used for the read
 * @returns Custom logger categories that were not read
 */
export function unreadCustomPrefixes(files: LogFile[], filters: string[]): string[] {
  const prefixFilters = filters.filter((f) => !f.includes('/'));
  const prefixes = new Set<string>();
  for (const file of files) {
    if (file.prefix.startsWith('custom-') && !matchesPrefixFilters(file, prefixFilters)) {
      prefixes.add(file.prefix);
    }
  }
  return [...prefixes].sort((a, b) => a.localeCompare(b));
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
    // whole listing — log and treat it as empty. Anything else (auth/permission
    // failures, token errors, the top-level Logs directory) must surface.
    if (relativeDir && error instanceof HTTPError && error.response.status === 404) {
      logger.debug({err: error, dir: propfindPath}, `Log directory not found: ${propfindPath}`);
      return [];
    }
    throw logAccessError(instance, propfindPath, error);
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
 * - **Prefix filters** (no `/`, e.g. `"error"`) match the start of the extracted
 *   log-category prefix or of the file name of files in the top-level `Logs/`
 *   directory (see {@link matchesPrefixFilters}).
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
    const pathSet = pathFilters.map((p) => p.toLowerCase());

    // Top-level files match by category or file name (startsWith, e.g. "custom" → "custom-mylog").
    const matchedTopLevel = topLevel.filter((file) => matchesPrefixFilters(file, prefixFilters));

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
