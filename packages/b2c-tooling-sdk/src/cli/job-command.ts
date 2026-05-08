/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {getJobLog, getJobErrorMessage, type JobExecution} from '../operations/jobs/index.js';
import {createJobsBackend, type JobsBackend, type JobExecutionInfo} from '../operations/jobs/index.js';
import {t} from '../i18n/index.js';

/**
 * Base command for job operations.
 *
 * Extends InstanceCommand with job-specific functionality like
 * displaying job logs on failure and creating backend-aware job clients.
 *
 * @example
 * export default class MyJobCommand extends JobCommand<typeof MyJobCommand> {
 *   async run(): Promise<void> {
 *     const backend = this.createJobsBackend();
 *     const execution = await backend.executeJob('my-job');
 *   }
 * }
 */
export abstract class JobCommand<T extends typeof Command> extends InstanceCommand<T> {
  protected createJobsBackend(): JobsBackend {
    return this.createBackend(createJobsBackend);
  }

  /**
   * Display a job's log file content and error message if available.
   * Accepts both canonical JobExecutionInfo and legacy OCAPI JobExecution.
   * Outputs to stderr since this is typically shown for failed jobs.
   */
  protected async showJobLog(execution: JobExecutionInfo | JobExecution): Promise<void> {
    if (isCanonicalExecution(execution)) {
      return this.showCanonicalJobLog(execution);
    }
    return this.showOcapiJobLog(execution);
  }

  private async showCanonicalJobLog(execution: JobExecutionInfo): Promise<void> {
    const errorMessage = getCanonicalJobErrorMessage(execution);

    if (!execution.isLogFileExisting) {
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
      return;
    }

    try {
      const backend = this.createJobsBackend();
      const log = await backend.getJobLog(execution);
      const logFileName = execution.logFilePath?.split('/').pop() ?? 'job.log';

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

  private async showOcapiJobLog(execution: JobExecution): Promise<void> {
    const errorMessage = getJobErrorMessage(execution);

    if (!execution.is_log_file_existing) {
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
      return;
    }

    try {
      const log = await getJobLog(this.instance, execution);
      const logFileName = execution.log_file_path?.split('/').pop() ?? 'job.log';

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
}

function isCanonicalExecution(execution: JobExecutionInfo | JobExecution): execution is JobExecutionInfo {
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
