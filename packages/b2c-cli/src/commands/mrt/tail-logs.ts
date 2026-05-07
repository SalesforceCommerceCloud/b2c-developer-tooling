/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getProfile, tailMrtLogs, type MrtLogEntry} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../i18n/index.js';
import {formatMrtEntry, colorLevel, colorHighlight} from '../../utils/mrt-logs/index.js';

export default class MrtTailLogs extends MrtCommand<typeof MrtTailLogs> {
  static description = t(
    'commands.mrt.tail-logs.description',
    'Tail application logs from a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --level ERROR --level WARN',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --json',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --search "timeout"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --search "GET|POST"',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    level: Flags.string({
      description: 'Filter by log level (ERROR, WARN, INFO, DEBUG, etc.)',
      multiple: true,
    }),
    search: Flags.string({
      char: 'g',
      description: 'Filter entries matching this regex pattern (case-insensitive)',
    }),
    'no-color': Flags.boolean({
      description: 'Disable colored output',
      default: false,
    }),
  };

  async run(): Promise<void> {
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: environment, mrtOrigin: origin} = this.resolvedConfig.values;

    if (!project) {
      this.error('MRT project is required. Provide --project flag, set MRT_PROJECT, or set mrtProject in dw.json.');
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const auth = this.getMrtAuth();
    const useColor = !this.flags['no-color'] && process.stdout.isTTY && !this.jsonEnabled();
    const levelFilter = this.flags.level;
    const searchFilter = this.flags.search;

    // Compile search regexes:
    //  - `searchTestRegex` (no `g` flag) is used for `.test()` so we don't have
    //    to manage `lastIndex` on a shared global regex.
    //  - `searchRegex` (global) is passed to the highlighter to mark every match.
    let searchTestRegex: RegExp | undefined;
    let searchRegex: RegExp | undefined;
    if (searchFilter) {
      try {
        searchTestRegex = new RegExp(searchFilter, 'i');
        searchRegex = new RegExp(searchFilter, 'gi');
      } catch {
        this.error(`Invalid search pattern: "${searchFilter}". Must be a valid regular expression.`);
      }
    }

    // Pre-compute level filter set
    const upperLevels = levelFilter && levelFilter.length > 0 ? new Set(levelFilter.map((l) => l.toUpperCase())) : null;

    // Best-effort user email for WebSocket connection
    let user: string | undefined;
    try {
      const profile = await getProfile({origin}, auth);
      user = profile.email;
    } catch {
      // Non-fatal: proceed without user email
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.mrt.tail-logs.connecting', 'Connecting to {{project}}/{{environment}} logs...', {
          project,
          environment,
        }),
      );

      // Log active filters
      if (upperLevels) {
        const levels = useColor ? [...upperLevels].map((l) => colorLevel(l)).join(', ') : [...upperLevels].join(', ');
        this.log(t('commands.mrt.tail-logs.filterLevel', 'Filtering by level: {{levels}}', {levels}));
      }
      if (searchFilter) {
        const pattern = useColor ? colorHighlight(searchFilter) : searchFilter;
        this.log(t('commands.mrt.tail-logs.filterSearch', 'Filtering by pattern: {{pattern}}', {pattern}));
      }
    }

    const {stop, done} = await tailMrtLogs(
      {
        projectSlug: project,
        environmentSlug: environment,
        origin,
        user,
        onEntry: (entry: MrtLogEntry) => {
          // Apply level filter
          if (upperLevels && (!entry.level || !upperLevels.has(entry.level.toUpperCase()))) return;

          // Apply search filter (regex match against message and raw)
          if (searchTestRegex) {
            const matchesMessage = searchTestRegex.test(entry.message);
            const matchesRaw = searchTestRegex.test(entry.raw);
            if (!matchesMessage && !matchesRaw) return;
          }

          if (this.jsonEnabled()) {
            ux.stdout(JSON.stringify(entry));
          } else {
            ux.stdout(formatMrtEntry(entry, {useColor, searchHighlight: searchRegex}));
          }
        },
        onConnect: () => {
          if (!this.jsonEnabled()) {
            this.log(t('commands.mrt.tail-logs.connected', 'Connected. Waiting for log entries...'));
            this.log(t('commands.mrt.tail-logs.interrupt', 'Press Ctrl+C to stop.\n'));
          }
        },
        onError: (error: Error) => {
          this.warn(t('commands.mrt.tail-logs.error', 'WebSocket error: {{message}}', {message: error.message}));
        },
        onClose: (_code: number, _reason: string) => {
          if (!this.jsonEnabled()) {
            this.log(t('commands.mrt.tail-logs.disconnected', '\nDisconnected from log stream.'));
          }
        },
      },
      auth,
    );

    // Graceful shutdown on signals. Capture ref so we can deregister; otherwise
    // repeated invocations of this command stack handlers on the global process.
    let stopping = false;
    const handleSignal = (): void => {
      if (stopping) return;
      stopping = true;
      stop();
    };

    process.on('SIGINT', handleSignal);
    process.on('SIGTERM', handleSignal);

    try {
      await done;
    } finally {
      process.removeListener('SIGINT', handleSignal);
      process.removeListener('SIGTERM', handleSignal);
    }
  }
}
