/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  siteArchiveImportSet,
  JobExecutionError,
  type ImportSetEvent,
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
      'Apply an ordered set of site archives, skipping items already recorded on the instance',
    ),
    '/cli/jobs.html#b2c-job-import-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dry-run',
    '<%= config.bin %> <%= command.id %> ./release-data',
    '<%= config.bin %> <%= command.id %> --break-lock',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    'set-id': Flags.string({
      description: 'Remote receipt and lock namespace for an independent migration history',
    }),
    'dry-run': Flags.boolean({
      description: 'Show pending and applied items without locking, importing, or writing state',
      default: false,
    }),
    'keep-archive': Flags.boolean({
      char: 'k',
      description: 'Keep each uploaded archive on the instance after import',
      default: false,
    }),
    'break-lock': Flags.boolean({
      description: 'Remove an existing import-set lock before acquiring it',
      default: false,
    }),
    'stale-lock-seconds': Flags.integer({
      description: 'Take over a lock whose heartbeat is older than this many seconds',
      default: 1800,
      min: 1,
    }),
    'lock-poll-interval': Flags.integer({
      description: 'Seconds between checks while another runner holds the set lock',
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
      'break-lock': breakLock,
      'stale-lock-seconds': staleLockSeconds,
      'lock-poll-interval': lockPollIntervalSeconds,
      timeout,
      'poll-interval': pollIntervalSeconds,
      'show-log': showLog = true,
    } = this.flags;

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
          this.log(`  ${item.status === 'skipped' ? 'applied' : 'pending'}  ${item.id}`);
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

  private handleEvent(event: ImportSetEvent): void {
    if (this.jsonEnabled()) return;

    switch (event.type) {
      case 'item-imported': {
        this.log(`  ${event.index}/${event.total} imported   ${event.item.id}`);
        break;
      }
      case 'item-importing': {
        this.log(`  ${event.index}/${event.total} importing  ${event.item.id}`);
        break;
      }
      case 'item-skipped': {
        this.log(`  ${event.index}/${event.total} skipped    ${event.item.id}`);
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
        this.log(
          t(
            'commands.job.importSet.plan',
            'Import set {{setId}}: {{total}} item(s), {{pending}} pending, {{skipped}} already applied',
            {
              setId: event.setId,
              total: String(event.total),
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
            'Receipt marker for {{item}} is invalid; the item will be imported again.',
            {item: event.item.id},
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
      this.log(`  ${item.id}`);
      for (const line of item.note!.split('\n')) {
        this.log(line.length > 0 ? `    ${line}` : '');
      }
    }
  }
}
