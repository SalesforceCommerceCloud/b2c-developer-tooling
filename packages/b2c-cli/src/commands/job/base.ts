import {Command} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling/cli';
import {getJobLog, type JobExecution} from '@salesforce/b2c-tooling/operations/jobs';
import {t} from '../../i18n/index.js';

/**
 * Base command for job operations.
 * Provides common functionality for displaying job logs.
 */
export abstract class JobCommand<T extends typeof Command> extends InstanceCommand<T> {
  /**
   * Display a job's log file content.
   * Outputs to stderr since this is typically shown for failed jobs.
   *
   * @param execution - Job execution with log file info
   */
  protected async showJobLog(execution: JobExecution): Promise<void> {
    if (!execution.isLogFileExisting) {
      return;
    }

    try {
      const log = await getJobLog(this.instance, execution);
      const logFileName = execution.logFilePath?.split('/').pop() ?? 'job.log';

      // Output header and log content to stderr (this is error context)
      process.stderr.write(
        t('commands.job.logOutput', '\nJob log ({{logFileName}}):\n{{log}}\n', {
          logFileName,
          log,
        }),
      );
    } catch {
      this.warn(t('commands.job.logFetchFailed', 'Could not retrieve job log'));
    }
  }
}
