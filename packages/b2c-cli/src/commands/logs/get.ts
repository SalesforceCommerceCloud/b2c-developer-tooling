/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getRecentLogs,
  createPathNormalizer,
  discoverAndCreateNormalizer,
  type LogEntry,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {t} from '../../i18n/index.js';

/**
 * Default log prefixes to retrieve.
 */
const DEFAULT_PREFIXES = ['error', 'customerror'];

/**
 * Default number of entries to retrieve.
 */
const DEFAULT_COUNT = 20;

/**
 * ANSI color codes for log levels.
 */
const LEVEL_COLORS: Record<string, string> = {
  ERROR: '\u001B[31m', // Red
  FATAL: '\u001B[35m', // Magenta
  WARN: '\u001B[33m', // Yellow
  INFO: '\u001B[36m', // Cyan
  DEBUG: '\u001B[90m', // Gray
  TRACE: '\u001B[90m', // Gray
};

const RESET = '\u001B[0m';
const DIM = '\u001B[2m';
const BOLD = '\u001B[1m';

/**
 * Formats a log entry for human-readable output.
 *
 * Output format:
 * LEVEL [timestamp] [file]
 * message (may be multi-line)
 */
function formatEntry(entry: LogEntry, useColor: boolean): string {
  const headerParts: string[] = [];

  // Level first (most important for scanning)
  if (entry.level) {
    if (useColor) {
      const color = LEVEL_COLORS[entry.level] || '';
      headerParts.push(`${color}${BOLD}${entry.level}${RESET}`);
    } else {
      headerParts.push(entry.level);
    }
  }

  // Timestamp
  if (entry.timestamp) {
    if (useColor) {
      headerParts.push(`${DIM}[${entry.timestamp}]${RESET}`);
    } else {
      headerParts.push(`[${entry.timestamp}]`);
    }
  }

  // File name (dimmed)
  if (useColor) {
    headerParts.push(`${DIM}[${entry.file}]${RESET}`);
  } else {
    headerParts.push(`[${entry.file}]`);
  }

  // Build output: header line followed by message, with trailing blank line
  const header = headerParts.join(' ');
  return `${header}\n${entry.message}\n`;
}

/**
 * Parses a relative time string (e.g., "5m", "1h", "2d") into milliseconds.
 * Returns null if the string is not a valid relative time format.
 */
function parseRelativeTime(timeStr: string): null | number {
  const match = timeStr.match(/^(\d+)([mhd])$/i);
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'd': {
      return value * 24 * 60 * 60 * 1000;
    }
    case 'h': {
      return value * 60 * 60 * 1000;
    }
    case 'm': {
      return value * 60 * 1000;
    }
    default: {
      return null;
    }
  }
}

/**
 * Parses a --since value into a Date object.
 * Supports:
 * - Relative times: "5m", "1h", "2d"
 * - ISO 8601: "2026-01-25T10:00:00"
 */
function parseSinceTime(sinceStr: string): Date {
  // Try relative time first
  const relativeMs = parseRelativeTime(sinceStr);
  if (relativeMs !== null) {
    return new Date(Date.now() - relativeMs);
  }

  // Try ISO 8601
  const date = new Date(sinceStr);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `Invalid --since value: "${sinceStr}". Use relative time (e.g., "5m", "1h", "2d") or ISO 8601 (e.g., "2026-01-25T10:00:00")`,
    );
  }

  return date;
}

/**
 * Parses a B2C log timestamp into a Date object.
 * Expected format: "2025-01-25 10:30:45.123 GMT"
 */
function parseLogTimestamp(timestamp: string): Date | null {
  // B2C format: "2025-01-25 10:30:45.123 GMT"
  // Convert to ISO format for parsing
  const isoFormat = timestamp.replace(' GMT', 'Z').replace(' ', 'T');
  const date = new Date(isoFormat);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Filters entries by timestamp.
 */
function filterBySince(entries: LogEntry[], since: Date): LogEntry[] {
  return entries.filter((entry) => {
    if (!entry.timestamp) return true; // Include entries without timestamps
    const entryDate = parseLogTimestamp(entry.timestamp);
    return entryDate === null || entryDate >= since;
  });
}

/**
 * Filters entries by log level.
 */
function filterByLevel(entries: LogEntry[], levels: string[]): LogEntry[] {
  const upperLevels = new Set(levels.map((l) => l.toUpperCase()));
  return entries.filter((entry) => {
    // Include entries without level if no specific level filter
    if (!entry.level) return false;
    return upperLevels.has(entry.level.toUpperCase());
  });
}

/**
 * Filters entries by text search (case-insensitive substring match).
 */
function filterBySearch(entries: LogEntry[], search: string): LogEntry[] {
  const lowerSearch = search.toLowerCase();
  return entries.filter((entry) => {
    return entry.message.toLowerCase().includes(lowerSearch) || entry.raw.toLowerCase().includes(lowerSearch);
  });
}

interface LogsGetResult {
  count: number;
  entries: LogEntry[];
}

export default class LogsGet extends InstanceCommand<typeof LogsGet> {
  static description = t('commands.logs.get.description', 'Get recent log entries from a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count 50',
    '<%= config.bin %> <%= command.id %> --filter error --filter customerror --filter debug',
    '<%= config.bin %> <%= command.id %> --since 5m',
    '<%= config.bin %> <%= command.id %> --since "2026-01-25T10:00:00"',
    '<%= config.bin %> <%= command.id %> --level ERROR --level FATAL',
    '<%= config.bin %> <%= command.id %> --search OrderMgr',
    '<%= config.bin %> <%= command.id %> --since 1h --level ERROR --search "PaymentProcessor" --json',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    filter: Flags.string({
      char: 'f',
      description: 'Log prefixes to filter (can specify multiple)',
      multiple: true,
      default: DEFAULT_PREFIXES,
    }),
    count: Flags.integer({
      char: 'n',
      description: 'Maximum number of entries to retrieve',
      default: DEFAULT_COUNT,
    }),
    since: Flags.string({
      description: 'Only show entries after this time (e.g., "5m", "1h", "2d", or ISO 8601)',
    }),
    level: Flags.string({
      description: 'Filter by log level (ERROR, WARN, INFO, DEBUG, FATAL, TRACE)',
      multiple: true,
    }),
    search: Flags.string({
      char: 'g',
      description: 'Filter entries containing this text (case-insensitive)',
    }),
    'cartridge-path': Flags.string({
      description: 'Override cartridge path for path normalization (auto-discovered by default)',
    }),
    'no-normalize': Flags.boolean({
      description: 'Disable automatic path normalization',
      default: false,
    }),
    'no-color': Flags.boolean({
      description: 'Disable colored output',
      default: false,
    }),
  };

  async run(): Promise<LogsGetResult> {
    this.requireServer();
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const useColor = !this.flags['no-color'] && process.stdout.isTTY && !this.jsonEnabled();

    // Set up path normalizer for IDE click-to-open
    // Priority: 1) explicit --cartridge-path, 2) auto-discover cartridges, 3) none
    let pathNormalizer: ((msg: string) => string) | undefined;
    if (!this.flags['no-normalize']) {
      pathNormalizer = this.flags['cartridge-path']
        ? createPathNormalizer({cartridgePath: this.flags['cartridge-path']})
        : discoverAndCreateNormalizer();
    }

    // Parse --since if provided
    let sinceDate: Date | undefined;
    if (this.flags.since) {
      sinceDate = parseSinceTime(this.flags.since);
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.logs.get.fetching', 'Fetching recent logs from {{hostname}} (prefixes: {{prefixes}})...', {
          hostname,
          prefixes: this.flags.filter.join(', '),
        }),
      );
    }

    // Fetch entries from SDK - request more than needed if we'll be filtering client-side
    const needsClientFilter = sinceDate || this.flags.level || this.flags.search;
    const fetchCount = needsClientFilter ? Math.max(this.flags.count * 5, 500) : this.flags.count;

    let entries = await getRecentLogs(this.instance, {
      prefixes: this.flags.filter,
      maxEntries: fetchCount,
      pathNormalizer,
    });

    // Apply client-side filters
    if (sinceDate) {
      entries = filterBySince(entries, sinceDate);
    }

    if (this.flags.level && this.flags.level.length > 0) {
      entries = filterByLevel(entries, this.flags.level);
    }

    if (this.flags.search) {
      entries = filterBySearch(entries, this.flags.search);
    }

    // Limit to requested count after filtering
    entries = entries.slice(0, this.flags.count);

    const result: LogsGetResult = {
      count: entries.length,
      entries,
    };

    if (this.jsonEnabled()) {
      return result;
    }

    if (entries.length === 0) {
      ux.stdout(t('commands.logs.get.noEntries', 'No log entries found.'));
      return result;
    }

    // Output entries (most recent first, which is how they come from getRecentLogs)
    for (const entry of entries) {
      ux.stdout(formatEntry(entry, useColor));
    }

    this.log(t('commands.logs.get.summary', '\nRetrieved {{count}} log entries.', {count: entries.length}));

    return result;
  }
}
