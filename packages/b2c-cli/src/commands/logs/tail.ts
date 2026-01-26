/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  tailLogs,
  createPathNormalizer,
  discoverAndCreateNormalizer,
  type LogEntry,
  type LogFile,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {t} from '../../i18n/index.js';

/**
 * Default log prefixes to tail.
 */
const DEFAULT_PREFIXES = ['error', 'customerror'];

/**
 * Default polling interval in milliseconds.
 */
const DEFAULT_INTERVAL = 3000;

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

export default class LogsTail extends InstanceCommand<typeof LogsTail> {
  static description = t('commands.logs.tail.description', 'Tail log files on a B2C Commerce instance in real-time');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --prefix error customerror debug',
    '<%= config.bin %> <%= command.id %> --interval 5000',
    '<%= config.bin %> <%= command.id %> --cartridge-path ./cartridges',
    '<%= config.bin %> <%= command.id %> --include-existing',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    prefix: Flags.string({
      char: 'p',
      description: 'Log prefixes to filter (can specify multiple)',
      multiple: true,
      default: DEFAULT_PREFIXES,
    }),
    interval: Flags.integer({
      char: 'i',
      description: 'Polling interval in milliseconds',
      default: DEFAULT_INTERVAL,
    }),
    'cartridge-path': Flags.string({
      char: 'c',
      description: 'Override cartridge path for path normalization (auto-discovered by default)',
    }),
    'no-normalize': Flags.boolean({
      description: 'Disable automatic path normalization',
      default: false,
    }),
    'include-existing': Flags.boolean({
      description: 'Include existing log content when starting (instead of only new entries)',
      default: false,
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
    // Priority: 1) explicit --cartridge-path, 2) auto-discover cartridges, 3) none
    let pathNormalizer: ((msg: string) => string) | undefined;
    if (!this.flags['no-normalize']) {
      if (this.flags['cartridge-path']) {
        // Explicit path provided
        pathNormalizer = createPathNormalizer({cartridgePath: this.flags['cartridge-path']});
      } else {
        // Auto-discover cartridges from current directory
        pathNormalizer = discoverAndCreateNormalizer();
      }
    }

    this.log(
      t('commands.logs.tail.starting', 'Tailing logs from {{hostname}} (prefixes: {{prefixes}})...', {
        hostname,
        prefixes: this.flags.prefix.join(', '),
      }),
    );
    this.log(t('commands.logs.tail.interrupt', 'Press Ctrl+C to stop.\n'));

    // Track discovered files for JSON output
    const discoveredFiles: LogFile[] = [];
    const collectedEntries: LogEntry[] = [];

    const {stop, done} = await tailLogs(this.instance, {
      prefixes: this.flags.prefix,
      pollInterval: this.flags.interval,
      includeExisting: this.flags['include-existing'],
      pathNormalizer,
      onEntry: (entry) => {
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
