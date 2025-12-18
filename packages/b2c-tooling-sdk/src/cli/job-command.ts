/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {InstanceCommand} from './instance-command.js';
import {getJobLog, getJobErrorMessage, type JobExecution} from '../operations/jobs/index.js';
import {t} from '../i18n/index.js';

/**
 * Base command for job operations.
 *
 * Extends InstanceCommand with job-specific functionality like
 * displaying job logs on failure.
 *
 * @example
 * export default class MyJobCommand extends JobCommand<typeof MyJobCommand> {
 *   async run(): Promise<void> {
 *     try {
 *       await executeJob(this.instance, 'my-job');
 *     } catch (error) {
 *       if (error instanceof JobExecutionError) {
 *         await this.showJobLog(error.execution);
 *       }
 *       throw error;
 *     }
 *   }
 * }
 */
export abstract class JobCommand<T extends typeof Command> extends InstanceCommand<T> {
  /**
   * Display a job's log file content and error message if available.
   * Outputs to stderr since this is typically shown for failed jobs.
   *
   * @param execution - Job execution with log file info
   */
  protected async showJobLog(execution: JobExecution): Promise<void> {
    // Extract error message from failed step executions
    const errorMessage = getJobErrorMessage(execution);

    if (!execution.is_log_file_existing) {
      // No log file, but we may still have an error message
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

      // Log the error message separately if available
      if (errorMessage) {
        this.logger.error(t('cli.job.errorMessage', 'Error: {{message}}', {message: errorMessage}));
      }
    } catch {
      this.warn(t('cli.job.logFetchFailed', 'Could not retrieve job log'));
      // Still try to show error message even if log fetch failed
      if (errorMessage) {
        this.logger.error({errorMessage}, errorMessage);
      }
    }
  }
}
