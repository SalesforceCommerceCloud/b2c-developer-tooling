/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {tailLogs, type LogEntry, type LogFile} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {t} from '../../i18n/index.js';
import {
  DEFAULT_PREFIXES,
  formatEntry,
  setupPathNormalizer,
  matchesLevel,
  matchesSearch,
} from '../../utils/logs/index.js';

/**
 * Default polling interval in milliseconds.
 */
const DEFAULT_INTERVAL = 3000;

export default class LogsTail extends InstanceCommand<typeof LogsTail> {
  static description = t('commands.logs.tail.description', 'Tail log files on a B2C Commerce instance in real-time');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --filter error --filter customerror --filter debug',
    '<%= config.bin %> <%= command.id %> --interval 5000',
    '<%= config.bin %> <%= command.id %> --cartridge-path ./cartridges',
    '<%= config.bin %> <%= command.id %> --last 5',
    '<%= config.bin %> <%= command.id %> --last 0',
    '<%= config.bin %> <%= command.id %> --level ERROR --level FATAL',
    '<%= config.bin %> <%= command.id %> --search "PaymentProcessor"',
    '<%= config.bin %> <%= command.id %> --level ERROR --search "OrderMgr"',
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
    interval: Flags.integer({
      description: 'Polling interval in milliseconds',
      default: DEFAULT_INTERVAL,
    }),
    'cartridge-path': Flags.string({
      description: 'Override cartridge path for path normalization (auto-discovered by default)',
    }),
    'no-normalize': Flags.boolean({
      description: 'Disable automatic path normalization',
      default: false,
    }),
    last: Flags.integer({
      char: 'l',
      description: 'Show last N entries per file on startup (0 to skip)',
      default: 1,
    }),
    level: Flags.string({
      description: 'Filter by log level (ERROR, WARN, INFO, DEBUG, FATAL, TRACE)',
      multiple: true,
    }),
    search: Flags.string({
      char: 'g',
      description: 'Filter entries containing this text (case-insensitive)',
    }),
    'no-color': Flags.boolean({
      description: 'Disable colored output',
      default: false,
    }),
  };

  async run(): Promise<void> {
    this.requireServer();
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const useColor = !this.flags['no-color'] && process.stdout.isTTY && !this.jsonEnabled();

    // Set up path normalizer for IDE click-to-open
    const pathNormalizer = setupPathNormalizer(this.flags['cartridge-path'], this.flags['no-normalize']);

    // Store filter flags for use in callback
    const levelFilter = this.flags.level;
    const searchFilter = this.flags.search;

    this.log(
      t('commands.logs.tail.starting', 'Tailing logs from {{hostname}} (prefixes: {{prefixes}})...', {
        hostname,
        prefixes: this.flags.filter.join(', '),
      }),
    );
    this.log(t('commands.logs.tail.interrupt', 'Press Ctrl+C to stop.\n'));

    // Track discovered files for JSON output
    const discoveredFiles: LogFile[] = [];
    const collectedEntries: LogEntry[] = [];

    const {stop, done} = await tailLogs(this.instance, {
      prefixes: this.flags.filter,
      pollInterval: this.flags.interval,
      lastEntries: this.flags.last,
      pathNormalizer,
      onEntry: (entry) => {
        // Apply filters
        if (levelFilter && levelFilter.length > 0 && !matchesLevel(entry, levelFilter)) {
          return;
        }
        if (searchFilter && !matchesSearch(entry, searchFilter)) {
          return;
        }

        if (this.jsonEnabled()) {
          // NDJSON output - one JSON object per line
          ux.stdout(JSON.stringify(entry));
          collectedEntries.push(entry);
        } else {
          ux.stdout(formatEntry(entry, useColor));
        }
      },
      onFileDiscovered: (file) => {
        discoveredFiles.push(file);
        if (!this.jsonEnabled()) {
          this.log(t('commands.logs.tail.fileDiscovered', 'Discovered log file: {{name}}', {name: file.name}));
        }
      },
      onFileRotated: (file) => {
        if (!this.jsonEnabled()) {
          this.log(t('commands.logs.tail.fileRotated', 'Log file rotated: {{name}}', {name: file.name}));
        }
      },
      onError: (error) => {
        this.warn(t('commands.logs.tail.error', 'Error: {{message}}', {message: error.message}));
      },
    });

    // Handle SIGINT (Ctrl+C) for graceful shutdown
    const handleSignal = async (): Promise<void> => {
      this.log(t('commands.logs.tail.stopping', '\nStopping log tail...'));
      await stop();
    };

    process.on('SIGINT', () => {
      handleSignal().catch(() => {});
    });
    process.on('SIGTERM', () => {
      handleSignal().catch(() => {});
    });

    // Wait for tailing to complete
    await done;

    this.log(t('commands.logs.tail.stopped', 'Log tailing stopped.'));
  }
}
