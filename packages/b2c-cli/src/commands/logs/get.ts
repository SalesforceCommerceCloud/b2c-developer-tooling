/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getRecentLogs, type LogEntry} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {t} from '../../i18n/index.js';
import {
  DEFAULT_PREFIXES,
  formatEntry,
  setupPathNormalizer,
  parseSinceTime,
  filterBySince,
  filterByLevel,
  filterBySearch,
} from '../../utils/logs/index.js';

/**
 * Default number of entries to retrieve.
 */
const DEFAULT_COUNT = 20;

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
    const pathNormalizer = setupPathNormalizer(this.flags['cartridge-path'], this.flags['no-normalize']);

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
