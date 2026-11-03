/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {BackendDispatcher} from '../compat/dispatcher.js';
import {createScapiJobsClient, type ScapiJobsClient} from '../clients/scapi-jobs.js';
import {
  getJobExecution as ocapiGetJobExecution,
  mapOcapiExecution,
  scapiGetJobExecution,
  type JobExecution,
  type JobExecutionInfo,
} from '../operations/jobs/index.js';
import {t} from '../i18n/index.js';

/**
 * Base command for job operations.
 *
 * Provides:
 * - {@link createJobsDispatcher} for routing operations to SCAPI or OCAPI
 * - {@link buildScapiJobsClient} for SCAPI-only commands (e.g. delete) that
 *   don't need the dispatcher's auto-fallback
 * - {@link showJobLog} for retrieving and printing canonical job logs on failure
 *
 * @example
 * ```ts
 * import {scapiExecuteJob, mapOcapiExecution, executeJob as ocapiExecuteJob} from
 *   '@salesforce/b2c-tooling-sdk/operations/jobs';
 *
 * export default class MyJobCommand extends JobCommand<typeof MyJobCommand> {
 *   async run() {
 *     const dispatcher = this.createJobsDispatcher();
 *     const exec = await dispatcher.run({
 *       scapi: (client) => scapiExecuteJob(client, 'my-job', {tenantId: this.resolvedConfig.values.tenantId!}),
 *       ocapi: async () => mapOcapiExecution(await ocapiExecuteJob(this.instance, 'my-job')),
 *     });
 *   }
 * }
 * ```
 */
const LOG_FILE_RETRY_ATTEMPTS = 2;
const LOG_FILE_RETRY_DELAY_MS = 2000;

export abstract class JobCommand<T extends typeof Command> extends InstanceCommand<T> {
  protected createJobsDispatcher(): BackendDispatcher<ScapiJobsClient> {
    return this.createDispatcher('jobs', () => this.buildScapiJobsClient());
  }

  /**
   * Builds a SCAPI Jobs client, or `undefined` if SCAPI is not configured.
   * Used both as the dispatcher's SCAPI factory and directly by SCAPI-only
   * commands (e.g. `job execution delete`) that don't use the dispatcher.
   *
   * The shortCode/tenantId and the scope-flexible auth strategy come from the
   * instance ({@link B2CInstance.scapiClientConfig}), which already encodes the
   * "only stateless OAuth qualifies for auto-SCAPI" gating.
   */
  protected buildScapiJobsClient(): ScapiJobsClient | undefined {
    const scapi = this.instance.scapiClientConfig;
    if (!scapi) return undefined;
    return createScapiJobsClient({shortCode: scapi.shortCode, tenantId: scapi.tenantId}, scapi.auth);
  }

  /**
   * Display a job execution's log file content and error message if available.
   *
   * Accepts either canonical {@link JobExecutionInfo} (preferred) or raw
   * OCAPI {@link JobExecution} (from the legacy {@link JobExecutionError}).
   * Raw OCAPI is mapped to canonical at the entry point so the rest of the
   * function works on a single shape.
   */
  protected async showJobLog(execution: JobExecutionInfo | JobExecution): Promise<void> {
    let canonical = isCanonical(execution) ? execution : mapOcapiExecution(execution);
    const errorMessage = getCanonicalJobErrorMessage(canonical);

    if (!canonical.isLogFileExisting) {
      canonical = await this.refreshForLogFile(canonical);
    }

    if (!canonical.isLogFileExisting) {
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
      return;
    }

    try {
      const log = await this.fetchCanonicalLog(canonical);
      const logFileName = canonical.logFilePath?.split('/').pop() ?? 'job.log';

      const header = t('cli.job.logHeader', 'Job log ({{logFileName}}):', {logFileName});
      this.logger.error({log, errorMessage}, `${header}\n${log}`);

      if (errorMessage) {
        this.logger.error(t('cli.job.errorMessage', 'Error: {{message}}', {message: errorMessage}));
      }

      const dataErrors = extractDataErrors(log);
      if (dataErrors.length > 0) {
        this.logger.error(
          {dataErrors},
          t('cli.job.dataErrors', 'Data errors:\n{{errors}}', {errors: dataErrors.join('\n')}),
        );
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const webdavPath = canonical.logFilePath?.replace(/^\/Sites\/LOGS\//i, '');
      this.warn(
        webdavPath
          ? t(
              'cli.job.logFetchFailedWithHint',
              'Could not retrieve job log: {{reason}}\nTry: b2c webdav get --root logs {{path}} --user-auth',
              {reason, path: webdavPath},
            )
          : t('cli.job.logFetchFailedReason', 'Could not retrieve job log: {{reason}}', {reason}),
      );
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
    }
  }

  /** Delay between log-file re-checks; overridable in tests. */
  protected async sleepBeforeLogRetry(milliseconds: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  /**
   * Re-reads the execution a few times when the log file is not flagged as
   * written yet; jobs that fail within seconds often finish before the
   * platform marks the log as existing. Best effort: any failure returns
   * the execution unchanged.
   */
  private async refreshForLogFile(execution: JobExecutionInfo): Promise<JobExecutionInfo> {
    if (!execution.jobId || !execution.id) return execution;

    const tenantId = this.resolvedConfig.values.tenantId;
    const getExecution = () =>
      this.createJobsDispatcher().run<JobExecutionInfo>({
        scapi: (client) => scapiGetJobExecution(client, execution.jobId, execution.id, tenantId!),
        ocapi: async () => mapOcapiExecution(await ocapiGetJobExecution(this.instance, execution.jobId, execution.id)),
      });

    for (let attempt = 0; attempt < LOG_FILE_RETRY_ATTEMPTS; attempt++) {
      try {
        // Sequential by design: each re-check waits before the next request.
        await this.sleepBeforeLogRetry(LOG_FILE_RETRY_DELAY_MS);
        const refreshed = await getExecution();
        if (refreshed.isLogFileExisting) return refreshed;
      } catch {
        return execution;
      }
    }
    return execution;
  }

  private async fetchCanonicalLog(execution: JobExecutionInfo): Promise<string> {
    const logPath = execution.logFilePath;
    if (!logPath) {
      throw new Error('No log file path available');
    }
    // Both SCAPI and OCAPI return logFilePath under /Sites/LOGS/...; WebDAV
    // base is /webdav/Sites, so the leading /Sites/ is stripped.
    const webdavPath = logPath.replace(/^\/Sites\//, '');
    const content = await this.instance.webdav.get(webdavPath);
    return new TextDecoder().decode(content);
  }
}

function isCanonical(execution: JobExecutionInfo | JobExecution): execution is JobExecutionInfo {
  return 'executionStatus' in execution;
}

function getCanonicalJobErrorMessage(execution: JobExecutionInfo): string | undefined {
  if (!execution.stepExecutions || execution.stepExecutions.length === 0) {
    return undefined;
  }
  for (let i = execution.stepExecutions.length - 1; i >= 0; i--) {
    const step = execution.stepExecutions[i];
    if (step.exitStatus?.status === 'error' && step.exitStatus?.message) {
      return step.exitStatus.message;
    }
  }
  return undefined;
}

/** Returns `[DATAERROR]` lines from a job log, which carry the cause of site import failures. */
function extractDataErrors(log: string): string[] {
  return log.split(/\r?\n/).flatMap((line) => {
    const index = line.indexOf('[DATAERROR]');
    return index === -1 ? [] : [line.slice(index).trim()];
  });
}
