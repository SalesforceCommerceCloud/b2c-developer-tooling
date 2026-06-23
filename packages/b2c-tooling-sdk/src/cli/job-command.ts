/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {BackendDispatcher} from '../compat/dispatcher.js';
import {createScapiJobsClient, type ScapiJobsClient} from '../clients/scapi-jobs.js';
import {mapOcapiExecution, type JobExecution, type JobExecutionInfo} from '../operations/jobs/index.js';
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
export abstract class JobCommand<T extends typeof Command> extends InstanceCommand<T> {
  protected createJobsDispatcher(): BackendDispatcher<ScapiJobsClient> {
    return this.createDispatcher('jobs', () => this.buildScapiJobsClient());
  }

  /**
   * Builds a SCAPI Jobs client, or `undefined` if SCAPI is not configured.
   * Used both as the dispatcher's SCAPI factory and directly by SCAPI-only
   * commands (e.g. `job execution delete`) that don't use the dispatcher.
   */
  protected buildScapiJobsClient(): ScapiJobsClient | undefined {
    if (!this.hasScapiConfig()) return undefined;
    return createScapiJobsClient(
      {
        shortCode: this.resolvedConfig.values.shortCode!,
        tenantId: this.resolvedConfig.values.tenantId!,
      },
      this.getOAuthStrategy(),
    );
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
    const canonical = isCanonical(execution) ? execution : mapOcapiExecution(execution);
    const errorMessage = getCanonicalJobErrorMessage(canonical);

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
    } catch {
      this.warn(t('cli.job.logFetchFailed', 'Could not retrieve job log'));
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
    }
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
