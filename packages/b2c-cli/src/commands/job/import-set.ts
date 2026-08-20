/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import path from 'node:path';
import {
  siteArchiveImportSet,
  JobExecutionError,
  type ImportSetEvent,
  type ImportSetItem,
  type ImportSetResult,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {t, withDocs} from '../../i18n/index.js';

const DEFAULT_IMPORT_SET_DIRECTORY = './migrations';
const DEFAULT_IMPORT_SET_ID = 'migrations';

export default class JobImportSet extends JobCommand<typeof JobImportSet> {
  static args = {
    directory: Args.string({
      description: 'Directory whose immediate child directories and zip files form the ordered import set',
      default: DEFAULT_IMPORT_SET_DIRECTORY,
    }),
  };

  static description = withDocs(
    t(
      'commands.job.importSet.description',
      'Apply an ordered set of site import/export archives, skipping archives already recorded on the instance',
    ),
    '/cli/jobs.html#b2c-job-import-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dry-run',
    '<%= config.bin %> <%= command.id %> --no-cartridge-metadata',
    '<%= config.bin %> <%= command.id %> ./release-data',
    '<%= config.bin %> <%= command.id %> --break-lock',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    'set-id': Flags.string({
      description: 'Name for an independent import history',
    }),
    'dry-run': Flags.boolean({
      description: 'Preview pending and applied archives without importing or changing history',
      default: false,
    }),
    'keep-archive': Flags.boolean({
      char: 'k',
      description: 'Keep each uploaded archive on the instance after import',
      default: false,
    }),
    'cartridge-metadata': Flags.boolean({
      description: 'Include archives from metadata directories in discovered cartridges before other imports',
      allowNo: true,
      default: true,
    }),
    'import-set-exclude': Flags.string({
      description: 'Exclude a project-relative directory recursively from import-set source discovery',
      env: 'SFCC_IMPORT_SET_EXCLUDE',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    'break-lock': Flags.boolean({
      description: 'Recover an import set after confirming its previous runner has stopped',
      default: false,
    }),
    'stale-lock-seconds': Flags.integer({
      description: 'Consider an inactive import-set run stale after this many seconds',
      default: 1800,
      min: 1,
    }),
    'lock-poll-interval': Flags.integer({
      description: 'Seconds between checks while waiting for another import-set run',
      default: 3,
      min: 1,
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Per-import job timeout in seconds (default: no timeout)',
      min: 1,
    }),
    'poll-interval': Flags.integer({
      description: 'Job polling interval in seconds',
      default: 3,
      min: 1,
    }),
    'show-log': Flags.boolean({
      description: 'Show the job log when an import fails',
      default: true,
    }),
  };

  protected operations = {siteArchiveImportSet};

  async run(): Promise<ImportSetResult> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const directory = this.args.directory ?? DEFAULT_IMPORT_SET_DIRECTORY;
    const {
      'set-id': setId,
      'dry-run': dryRun,
      'keep-archive': keepArchive,
      'cartridge-metadata': includeCartridgeMetadata = true,
      'break-lock': breakLock,
      'stale-lock-seconds': staleLockSeconds,
      'lock-poll-interval': lockPollIntervalSeconds,
      timeout,
      'poll-interval': pollIntervalSeconds,
      'show-log': showLog = true,
    } = this.flags;
    const cartridgeRoot = this.flags['project-directory'];
    const excludeDirectories = this.resolvedConfig.values.importSetExclude;

    if (!dryRun) {
      const jobEvaluation = this.safetyGuard.evaluate({type: 'job', jobId: 'sfcc-site-archive-import'});
      if (jobEvaluation.action === 'block') this.error(jobEvaluation.reason, {exit: 1});
      if (jobEvaluation.action === 'confirm') await this.confirmOrBlock(jobEvaluation);
    }

    const effectiveSetId = setId ?? DEFAULT_IMPORT_SET_ID;
    const context = this.createContext('job:import-set', {
      directory,
      setId: effectiveSetId,
      dryRun,
      keepArchive,
      includeCartridgeMetadata,
      cartridgeRoot,
      excludeDirectories,
      staleLockSeconds,
    });
    const beforeResult = await this.runBeforeHooks(context);
    if (beforeResult.skip) {
      this.log(
        t('commands.job.importSet.skipped', 'Import set skipped: {{reason}}', {
          reason: beforeResult.skipReason || 'skipped by plugin',
        }),
      );
      return {
        setId: effectiveSetId,
        directory,
        dryRun,
        runId: 'skipped',
        items: [],
        imported: 0,
        skipped: 0,
        pending: 0,
      };
    }

    const cleanupSafetyRule = this.safetyGuard.temporarilyAddRule({
      method: 'DELETE',
      path: '**/Impex/b2c-cli/**',
      action: 'allow',
    });
    const startedAt = Date.now();

    try {
      const result = await this.operations.siteArchiveImportSet(this.instance, directory, {
        setId: effectiveSetId,
        dryRun,
        keepArchive,
        includeCartridgeMetadata,
        cartridgeRoot,
        excludeDirectories,
        breakLock,
        staleLockSeconds,
        lockPollIntervalSeconds,
        waitOptions: {
          timeoutSeconds: timeout,
          pollIntervalSeconds,
          onPoll: ({status, elapsedSeconds}) => {
            if (!this.jsonEnabled()) {
              this.log(
                t('commands.job.importSet.progress', '    Status: {{status}} ({{elapsed}}s elapsed)', {
                  status,
                  elapsed: String(elapsedSeconds),
                }),
              );
            }
          },
        },
        onEvent: (event) => this.handleEvent(event),
      });

      if (dryRun && !this.jsonEnabled()) {
        for (const item of result.items) {
          this.log(`  ${item.status === 'skipped' ? 'applied' : 'pending'}  ${this.formatItemSource(item)}`);
        }
      }

      if (!this.jsonEnabled()) {
        this.log(
          dryRun
            ? t('commands.job.importSet.dryRunSummary', 'Dry run: {{pending}} pending, {{skipped}} already applied', {
                pending: String(result.pending),
                skipped: String(result.skipped),
              })
            : t('commands.job.importSet.summary', 'Import set complete: {{imported}} imported, {{skipped}} skipped', {
                imported: String(result.imported),
                skipped: String(result.skipped),
              }),
        );
        this.logNotes(result, dryRun);
      }

      await this.runAfterHooks(context, {
        success: true,
        duration: Date.now() - startedAt,
        data: result,
      });
      return result;
    } catch (error) {
      await this.runAfterHooks(context, {
        success: false,
        duration: Date.now() - startedAt,
        error: error instanceof Error ? error : new Error(String(error)),
        data: error instanceof JobExecutionError ? error.execution : undefined,
      });

      if (error instanceof JobExecutionError && showLog) await this.showJobLog(error.execution);
      this.error(
        t('commands.job.importSet.error', 'Import set failed: {{message}}', {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      cleanupSafetyRule();
    }
  }

  private formatItemSource(item: ImportSetItem): string {
    const displayRoot = path.resolve(this.flags['project-directory'] ?? process.cwd());
    const relativePath = path.relative(displayRoot, item.target);
    return (relativePath || path.basename(item.target)).split(path.sep).join('/');
  }

  private handleEvent(event: ImportSetEvent): void {
    if (this.jsonEnabled()) return;

    switch (event.type) {
      case 'item-imported': {
        this.log(`  ${event.index}/${event.total} imported   ${this.formatItemSource(event.item)}`);
        break;
      }
      case 'item-importing': {
        this.log(`  ${event.index}/${event.total} importing  ${this.formatItemSource(event.item)}`);
        break;
      }
      case 'item-skipped': {
        this.log(`  ${event.index}/${event.total} skipped    ${this.formatItemSource(event.item)}`);
        break;
      }
      case 'lock-acquired': {
        this.log(t('commands.job.importSet.lockAcquired', 'Acquired import-set lock.'));
        break;
      }
      case 'lock-takeover': {
        const age = event.ageSeconds === undefined ? 'unknown' : Math.floor(event.ageSeconds).toString();
        this.warn(
          event.forced
            ? t('commands.job.importSet.lockBreak', 'Breaking the existing import-set lock.')
            : t('commands.job.importSet.lockStale', 'Taking over stale import-set lock (age: {{age}}s).', {age}),
        );
        break;
      }
      case 'lock-wait': {
        this.log(t('commands.job.importSet.lockWait', 'Another runner holds the import-set lock; waiting...'));
        break;
      }
      case 'plan': {
        const archiveCount = t(
          event.total === 1 ? 'commands.job.importSet.archiveCountOne' : 'commands.job.importSet.archiveCountMany',
          event.total === 1 ? '{{total}} archive' : '{{total}} archives',
          {total: String(event.total)},
        );
        this.log(
          t('commands.job.importSet.plan', 'Import set {{setId}} on {{hostname}}:', {
            setId: event.setId,
            hostname: this.instance.config.hostname,
          }),
        );
        this.log(
          t(
            'commands.job.importSet.planCounts',
            '  {{archiveCount}}, {{pending}} pending, {{skipped}} already applied',
            {
              archiveCount,
              pending: String(event.pending),
              skipped: String(event.skipped),
            },
          ),
        );
        break;
      }
      case 'receipt-invalid': {
        this.warn(
          t(
            'commands.job.importSet.invalidReceipt',
            'The recorded import history for {{archive}} is invalid; the archive will be imported again.',
            {archive: this.formatItemSource(event.item)},
          ),
        );
        break;
      }
    }
  }

  /**
   * Prints post-import notes: the README contents of each item that was just
   * imported (or, during a dry run, each pending item). Notes for items already
   * applied on the instance are omitted so the summary reflects only this run.
   */
  private logNotes(result: ImportSetResult, dryRun: boolean): void {
    const relevantStatus = dryRun ? 'pending' : 'imported';
    const withNotes = result.items.filter((item) => item.status === relevantStatus && item.note);
    if (withNotes.length === 0) return;

    this.log('');
    this.log(
      dryRun
        ? t('commands.job.importSet.notesHeadingDryRun', 'Post-import notes (preview):')
        : t('commands.job.importSet.notesHeading', 'Post-import notes:'),
    );
    for (const item of withNotes) {
      this.log('');
      this.log(`  ${this.formatItemSource(item)}`);
      for (const line of item.note!.split('\n')) {
        this.log(line.length > 0 ? `    ${line}` : '');
      }
    }
  }
}
