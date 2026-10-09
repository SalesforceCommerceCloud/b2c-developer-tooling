/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createJobsCompatibilityBackend, type JobsCompatibilityBackend} from '@salesforce/b2c-tooling-sdk/compat';
import {
  siteArchiveImport,
  siteArchiveImportSplit,
  JobExecutionError,
  getJobLog,
  type JobExecution,
  type SiteArchiveImportResult,
  type WaitForJobOptions,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import type {B2COperationContext} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

const STOREFRONT_SETUP_JOB_ID = 'sfcc-post-import-setup-storefront';
const STOREFRONT_DISCOVERY_POLL_INTERVAL_SECONDS = 2;
const STOREFRONT_DISCOVERY_TIMEOUT_SECONDS = 60;

interface StorefrontWaitContext {
  backend: JobsCompatibilityBackend;
  knownExecutionIds: Set<string>;
}

interface StorefrontImportResult {
  importResult: SiteArchiveImportResult | SiteArchiveImportResult[];
  storefrontSetupExecution: JobExecution;
}

type JobImportResult = SiteArchiveImportResult | SiteArchiveImportResult[] | StorefrontImportResult;

/**
 * Parses a human-friendly size string into bytes. A bare number is interpreted
 * as mebibytes (the default unit); suffixes `b`, `kb`, `mb`, `gb` (and their
 * `kib`/`mib`/`gib` forms) are also accepted, case-insensitively.
 */
function parseSize(input: string): number {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(b|kb|kib|mb|mib|gb|gib)?\s*$/i.exec(input);
  if (!match) {
    throw new Error(`Invalid size: "${input}". Use e.g. 190, 190mb, or 512kb.`);
  }
  const value = Number(match[1]);
  const unit = (match[2] ?? 'mb').toLowerCase();
  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    kib: 1024,
    mb: 1024 * 1024,
    mib: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
    gib: 1024 * 1024 * 1024,
  };
  return Math.floor(value * multipliers[unit]);
}

export default class JobImport extends JobCommand<typeof JobImport> {
  static args = {
    target: Args.string({
      description: 'Directory, zip file, or remote filename to import',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.job.import.description',
      'Import a site archive to a B2C Commerce instance using sfcc-site-archive-import job',
    ),
    '/cli/jobs.html#b2c-job-import',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./my-site-data',
    '<%= config.bin %> <%= command.id %> ./export.zip',
    '<%= config.bin %> <%= command.id %> ./my-site-data --keep-archive',
    '<%= config.bin %> <%= command.id %> existing-archive.zip --remote',
    '<%= config.bin %> <%= command.id %> ./my-site-data sites/RefArch libraries/mylib',
    "<%= config.bin %> <%= command.id %> ./my-site-data 'libraries/**'",
    '<%= config.bin %> <%= command.id %> ./big-site-data --split',
    '<%= config.bin %> <%= command.id %> ./big-site-data --split --max-size 150mb',
    '<%= config.bin %> <%= command.id %> ./storefront-export.zip --wait-for-storefront',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for import job to complete',
      default: true,
      allowNo: true,
    }),
    'keep-archive': Flags.boolean({
      char: 'k',
      description: 'Keep archive on instance after import',
      default: false,
    }),
    remote: Flags.boolean({
      char: 'r',
      description: 'Target is a filename already on the instance (in Impex/src/instance/)',
      default: false,
    }),
    split: Flags.boolean({
      char: 's',
      description:
        'Split a large directory import into multiple archive parts (XML first, static assets deferred) to stay under the instance size limit',
      default: false,
    }),
    'max-size': Flags.string({
      description: 'Per-archive size limit for --split (e.g. 190, 190mb, 512kb; bare number is MiB)',
      default: '190mb',
      dependsOn: ['split'],
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when using --wait',
      default: 3,
      dependsOn: ['wait'],
    }),
    'wait-for-storefront': Flags.boolean({
      description: `Wait for ${STOREFRONT_SETUP_JOB_ID} after a successful import`,
      default: false,
      dependsOn: ['wait'],
    }),
    'show-log': Flags.boolean({
      description: 'Show job log on failure',
      default: true,
    }),
  };

  // Allow additional positionals after `target` to specify a subset of
  // paths/globs to include from a directory import.
  static strict = false;

  protected operations = {
    createJobsCompatibilityBackend,
    getJobLog,
    siteArchiveImport,
    siteArchiveImportSplit,
    sleep: async (milliseconds: number): Promise<void> =>
      new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
      }),
  };

  async run(): Promise<JobImportResult> {
    this.requireOAuthCredentials();
    this.requireWebDavCredentials();

    const {argv} = await this.parse(JobImport);
    const {target} = this.args;
    // Additional positionals after `target` are paths/globs to include from
    // a directory import. Variadic args from oclif arrive in `argv` after the
    // declared positionals, so drop the first element (which is `target`).
    const extraPaths = (argv as string[]).slice(1);
    const {
      wait,
      'keep-archive': keepArchive,
      remote,
      split,
      'max-size': maxSizeRaw,
      timeout,
      'poll-interval': pollInterval,
      'wait-for-storefront': waitForStorefront,
      'show-log': showLog = true,
    } = this.flags;

    const maxBytes = this.validateFlags({remote, split, wait, waitForStorefront, extraPaths, maxSizeRaw});

    const hostname = this.resolvedConfig.values.hostname!;

    // Safety evaluation — check rules for import job before executing.
    // Command-level rules are already evaluated generically in BaseCommand.init().
    const jobEvaluation = this.safetyGuard.evaluate({type: 'job', jobId: 'sfcc-site-archive-import'});
    if (jobEvaluation.action === 'block') {
      this.error(jobEvaluation.reason, {exit: 1});
    }
    if (jobEvaluation.action === 'confirm') {
      await this.confirmOrBlock(jobEvaluation);
    }

    // Create lifecycle context
    const context = this.createContext('job:import', {
      target,
      remote,
      keepArchive,
      hostname,
      paths: extraPaths.length > 0 ? extraPaths : undefined,
      split,
      maxBytes: split ? maxBytes : undefined,
      waitForStorefront,
    });

    // Run beforeOperation hooks - check for skip
    const beforeResult = await this.runBeforeHooks(context);
    if (beforeResult.skip) {
      this.log(
        t('commands.job.import.skipped', 'Import skipped: {{reason}}', {
          reason: beforeResult.skipReason || 'skipped by plugin',
        }),
      );
      return {
        execution: {execution_status: 'finished', exit_status: {code: 'skipped'}},
        archiveFilename: '',
        archiveKept: false,
      } as unknown as SiteArchiveImportResult;
    }

    // After safety evaluation passes, temporarily allow WebDAV operations
    // that are part of the import flow (upload PUT, cleanup DELETE on Impex paths).
    const cleanupSafetyRule = this.safetyGuard.temporarilyAddRule({
      method: 'DELETE',
      path: '**/Impex/**',
      action: 'allow',
    });

    if (remote) {
      this.log(
        t('commands.job.import.importingRemote', 'Importing {{target}} from {{hostname}}...', {
          target,
          hostname,
        }),
      );
    } else {
      this.log(
        t('commands.job.import.importing', 'Importing {{target}} to {{hostname}}...', {
          target,
          hostname,
        }),
      );
    }

    try {
      const waitOptions = {
        timeoutSeconds: timeout,
        pollIntervalSeconds: pollInterval,
        onPoll: (info: {status: string; elapsedSeconds: number}) => {
          if (!this.jsonEnabled()) {
            this.log(
              t('commands.job.import.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                status: info.status,
                elapsed: String(info.elapsedSeconds),
              }),
            );
          }
        },
      };

      const storefrontWait = waitForStorefront ? await this.prepareStorefrontWait() : undefined;

      if (split) {
        return await this.runSplitImport({context, target, maxBytes, keepArchive, waitOptions, storefrontWait});
      }

      return await this.runSingleImport({
        context,
        target,
        remote,
        wait,
        keepArchive,
        maxBytes,
        paths: extraPaths.length > 0 ? extraPaths : undefined,
        waitOptions,
        storefrontWait,
      });
    } catch (error) {
      // Run afterOperation hooks with failure
      await this.runAfterHooks(context, {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - context.startTime,
        data: error instanceof JobExecutionError ? error.execution : undefined,
      });

      if (error instanceof JobExecutionError) {
        if (showLog) {
          await this.showJobLog(error.execution);
        }
        this.error(
          t('commands.job.import.failed', 'Import failed: {{status}}', {
            status: error.execution.exit_status?.code || 'ERROR',
          }),
        );
      }
      if (error instanceof Error) {
        this.error(
          t('commands.job.import.error', 'Import error: {{message}}', {
            message: error.message,
          }),
        );
      }
      throw error;
    } finally {
      cleanupSafetyRule();
    }
  }

  /** Waits for the delayed post-import job to appear, then for it to finish. */
  private async addStorefrontSetupResult(
    importResult: SiteArchiveImportResult | SiteArchiveImportResult[],
    storefrontWait: StorefrontWaitContext | undefined,
    waitOptions: WaitForJobOptions,
  ): Promise<JobImportResult> {
    if (!storefrontWait) {
      return importResult;
    }

    this.log(t('commands.job.import.storefrontDiscovering', `Waiting for ${STOREFRONT_SETUP_JOB_ID} to start...`));

    const maxSearches =
      Math.ceil(STOREFRONT_DISCOVERY_TIMEOUT_SECONDS / STOREFRONT_DISCOVERY_POLL_INTERVAL_SECONDS) + 1;
    const findNewExecution = async (attempt: number): Promise<JobExecution | undefined> => {
      const executions = await storefrontWait.backend.searchJobExecutions({
        jobId: STOREFRONT_SETUP_JOB_ID,
        count: 25,
      });
      const storefrontExecution = executions.hits.find(
        (execution) => execution.id !== undefined && !storefrontWait.knownExecutionIds.has(execution.id),
      );
      if (storefrontExecution?.id) {
        return storefrontExecution;
      }
      if (attempt >= maxSearches - 1) {
        return undefined;
      }
      await this.operations.sleep(STOREFRONT_DISCOVERY_POLL_INTERVAL_SECONDS * 1000);
      return findNewExecution(attempt + 1);
    };

    const storefrontExecution = await findNewExecution(0);

    if (!storefrontExecution?.id) {
      const dataErrors = await this.getImportDataErrors(importResult);
      throw new Error(
        `${STOREFRONT_SETUP_JOB_ID} did not start within ${STOREFRONT_DISCOVERY_TIMEOUT_SECONDS} seconds after the import completed${dataErrors}`,
      );
    }

    const completedExecution = await storefrontWait.backend.waitForJob(
      STOREFRONT_SETUP_JOB_ID,
      storefrontExecution.id,
      {
        ...waitOptions,
        onPoll: (info) => {
          if (!this.jsonEnabled()) {
            this.log(
              t('commands.job.import.storefrontProgress', '  Storefront setup: {{status}} ({{elapsed}}s elapsed)', {
                status: info.status,
                elapsed: String(info.elapsedSeconds),
              }),
            );
          }
        },
      },
    );

    this.log(
      t('commands.job.import.storefrontCompleted', 'Storefront setup completed: {{status}}', {
        status: completedExecution.exit_status?.code || completedExecution.execution_status,
      }),
    );

    return {importResult, storefrontSetupExecution: completedExecution};
  }

  /** Reads import diagnostics only after storefront setup discovery times out. */
  private async getImportDataErrors(
    importResult: SiteArchiveImportResult | SiteArchiveImportResult[],
  ): Promise<string> {
    if (this.flags['show-log'] === false) return '';

    const diagnostics: string[] = [];
    for (const {execution} of Array.isArray(importResult) ? importResult : [importResult]) {
      if (!execution.is_log_file_existing || !execution.log_file_path) continue;
      try {
        // Read split-import logs sequentially to avoid downloading many large logs at once.
        // eslint-disable-next-line no-await-in-loop
        const log = await this.operations.getJobLog(this.instance, execution);
        const errors = log.split(/\r?\n/).flatMap((line) => {
          const index = line.indexOf('[DATAERROR]');
          return index === -1 ? [] : [line.slice(index).trim()];
        });
        if (errors.length > 0) {
          diagnostics.push(
            t('commands.job.import.dataErrors', 'Import execution {{executionId}} data errors:\n{{errors}}', {
              executionId: execution.id ?? 'unknown',
              errors: errors.join('\n'),
            }),
          );
        }
      } catch {
        // Best-effort diagnostics must not replace the original discovery timeout.
      }
    }
    return diagnostics.length > 0 ? `\n${diagnostics.join('\n')}` : '';
  }

  /**
   * Captures existing storefront setup executions before importing so the
   * follow-up wait cannot attach to a stale run.
   */
  private async prepareStorefrontWait(): Promise<StorefrontWaitContext> {
    const backend = this.operations.createJobsCompatibilityBackend(this.instance);
    const executions = await backend.searchJobExecutions({jobId: STOREFRONT_SETUP_JOB_ID, count: 100});
    const knownExecutionIds = new Set(
      executions.hits.map((execution) => execution.id).filter((id): id is string => id !== undefined),
    );
    return {backend, knownExecutionIds};
  }

  /**
   * Runs a single-archive import, wiring an oversize callback that recommends
   * `--split` when the assembled archive exceeds the size ceiling.
   */
  private async runSingleImport(opts: {
    context: B2COperationContext;
    target: string;
    remote: boolean;
    wait: boolean;
    keepArchive: boolean;
    maxBytes: number;
    paths: string[] | undefined;
    waitOptions: WaitForJobOptions;
    storefrontWait: StorefrontWaitContext | undefined;
  }): Promise<JobImportResult> {
    const {context, target, remote, wait, keepArchive, maxBytes, paths, waitOptions, storefrontWait} = opts;
    const importTarget = remote ? {remoteFilename: target} : target;

    const result = await this.operations.siteArchiveImport(this.instance, importTarget, {
      keepArchive,
      wait,
      paths,
      // Measure the assembled archive against the same default ceiling and, if
      // it's over, recommend --split so the user can act immediately.
      maxBytes: remote ? undefined : maxBytes,
      onOversize: ({bytes, maxBytes: limit}) => {
        if (!this.jsonEnabled()) {
          this.warn(
            t(
              'commands.job.import.oversize',
              'Archive is {{size}} MiB, over the {{limit}} MiB limit — the instance may reject it. Re-run with --split to import it in multiple parts.',
              {
                size: (bytes / (1024 * 1024)).toFixed(1),
                limit: (limit / (1024 * 1024)).toFixed(0),
              },
            ),
          );
        }
      },
      waitOptions,
    });

    if (wait) {
      const durationSec = result.execution.duration ? (result.execution.duration / 1000).toFixed(1) : 'N/A';
      this.log(
        t('commands.job.import.completed', 'Import completed: {{status}} (duration: {{duration}}s)', {
          status: result.execution.exit_status?.code || result.execution.execution_status,
          duration: durationSec,
        }),
      );
    } else {
      this.log(
        t('commands.job.import.started', 'Import job started: {{executionId}} (status: {{status}})', {
          executionId: result.execution.id,
          status: result.execution.execution_status,
        }),
      );
    }

    if (result.archiveKept) {
      this.log(
        t('commands.job.import.archiveKept', 'Archive kept at: Impex/src/instance/{{filename}}', {
          filename: result.archiveFilename,
        }),
      );
    }

    const finalResult = await this.addStorefrontSetupResult(result, storefrontWait, waitOptions);

    await this.runAfterHooks(context, {
      success: true,
      duration: Date.now() - context.startTime,
      data: finalResult,
    });

    return finalResult;
  }

  /**
   * Runs a multi-part split import of a directory, logging the plan and each
   * part's progress. A failing part throws JobExecutionError (handled by the
   * caller's catch), so a normal return means all parts imported successfully.
   */
  private async runSplitImport(opts: {
    context: B2COperationContext;
    target: string;
    maxBytes: number;
    keepArchive: boolean;
    waitOptions: WaitForJobOptions;
    storefrontWait: StorefrontWaitContext | undefined;
  }): Promise<JobImportResult> {
    const {context, target, maxBytes, keepArchive, waitOptions, storefrontWait} = opts;
    const results = await this.operations.siteArchiveImportSplit(this.instance, target, {
      maxBytes,
      keepArchive,
      waitOptions,
      onPlan: (plan) => {
        if (!this.jsonEnabled()) {
          this.log(
            t(
              'commands.job.import.splitPlan',
              'Split into {{parts}} archive part(s): {{xml}} metadata, {{assets}} static asset(s) (max {{size}} MiB each)',
              {
                parts: String(plan.partCount),
                xml: String(plan.xmlPartCount),
                assets: String(plan.assetPartCount),
                size: (plan.maxBytes / (1024 * 1024)).toFixed(0),
              },
            ),
          );
        }
      },
      onPart: (info) => {
        if (!this.jsonEnabled()) {
          this.log(
            t(
              'commands.job.import.splitPart',
              '  Part {{index}}/{{total}} ({{kind}}): {{filename}} — {{files}} file(s), {{size}} MiB',
              {
                index: String(info.index),
                total: String(info.total),
                kind: info.kind,
                filename: info.filename,
                files: String(info.fileCount),
                size: (info.bytes / (1024 * 1024)).toFixed(1),
              },
            ),
          );
        }
      },
    });

    this.log(
      t('commands.job.import.splitCompleted', 'Import completed: {{parts}} part(s) imported', {
        parts: String(results.length),
      }),
    );

    const finalResult = await this.addStorefrontSetupResult(results, storefrontWait, waitOptions);

    await this.runAfterHooks(context, {
      success: true,
      duration: Date.now() - context.startTime,
      data: finalResult,
    });

    return finalResult;
  }

  /**
   * Validates the flag combination and resolves the `--max-size` value to
   * bytes. Calls `this.error` (which exits) on any invalid combination.
   */
  private validateFlags(opts: {
    remote: boolean;
    split: boolean;
    wait: boolean;
    waitForStorefront: boolean;
    extraPaths: string[];
    maxSizeRaw: string | undefined;
  }): number {
    const {remote, split, wait, waitForStorefront, extraPaths, maxSizeRaw} = opts;

    if (extraPaths.length > 0 && remote) {
      this.error('Path arguments are not supported with --remote.');
    }
    if (split && remote) {
      this.error('--split is not supported with --remote.');
    }
    if (split && extraPaths.length > 0) {
      this.error('--split imports the whole directory; path arguments are not supported with --split.');
    }
    if (split && !wait) {
      this.error('--split requires waiting for each part; it cannot be combined with --no-wait.');
    }
    if (waitForStorefront && !wait) {
      this.error('--wait-for-storefront requires --wait; it cannot be combined with --no-wait.');
    }

    try {
      // Fall back to the flag default when unset (e.g. in unit tests that
      // construct flags directly and bypass oclif defaults).
      return parseSize(maxSizeRaw ?? '190mb');
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
