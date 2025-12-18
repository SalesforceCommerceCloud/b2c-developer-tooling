import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {waitForJob, JobExecutionError, type JobExecution} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {t} from '../../i18n/index.js';

export default class JobWait extends JobCommand<typeof JobWait> {
  static args = {
    jobId: Args.string({
      description: 'Job ID',
      required: true,
    }),
    executionId: Args.string({
      description: 'Execution ID to wait for',
      required: true,
    }),
  };

  static description = t('commands.job.wait.description', 'Wait for a job execution to complete');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-job abc123-def456',
    '<%= config.bin %> <%= command.id %> my-job abc123-def456 --timeout 600',
    '<%= config.bin %> <%= command.id %> my-job abc123-def456 --poll-interval 5',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: no timeout)',
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds',
      default: 3,
    }),
    'show-log': Flags.boolean({
      description: 'Show job log on failure',
      default: true,
    }),
  };

  async run(): Promise<JobExecution> {
    this.requireOAuthCredentials();

    const {jobId, executionId} = this.args;
    const {timeout, 'poll-interval': pollInterval, 'show-log': showLog} = this.flags;

    this.log(
      t('commands.job.wait.waiting', 'Waiting for job {{jobId}} execution {{executionId}}...', {
        jobId,
        executionId,
      }),
    );

    try {
      const execution = await waitForJob(this.instance, jobId, executionId, {
        timeout: timeout ? timeout * 1000 : undefined,
        pollInterval: pollInterval * 1000,
        onProgress: (exec, elapsed) => {
          if (!this.jsonEnabled()) {
            const elapsedSec = Math.floor(elapsed / 1000);
            this.log(
              t('commands.job.wait.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                status: exec.execution_status,
                elapsed: elapsedSec.toString(),
              }),
            );
          }
        },
      });

      const durationSec = execution.duration ? (execution.duration / 1000).toFixed(1) : 'N/A';
      this.log(
        t('commands.job.wait.completed', 'Job completed: {{status}} (duration: {{duration}}s)', {
          status: execution.exit_status?.code || execution.execution_status,
          duration: durationSec,
        }),
      );

      return execution;
    } catch (error) {
      if (error instanceof JobExecutionError) {
        if (showLog) {
          await this.showJobLog(error.execution);
        }
        this.error(
          t('commands.job.wait.jobFailed', 'Job failed: {{status}}', {
            status: error.execution.exit_status?.code || 'ERROR',
          }),
        );
      }
      throw error;
    }
  }
}
