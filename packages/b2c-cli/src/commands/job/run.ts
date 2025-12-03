import {Args, Flags} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling/cli';
import {executeJob, waitForJob, JobExecutionError, type JobExecution} from '@salesforce/b2c-tooling/operations/jobs';
import {t} from '../../i18n/index.js';

export default class JobRun extends JobCommand<typeof JobRun> {
  static args = {
    jobId: Args.string({
      description: 'Job ID to execute',
      required: true,
    }),
  };

  static description = t('commands.job.run.description', 'Execute a job on a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-custom-job',
    '<%= config.bin %> <%= command.id %> my-custom-job --wait',
    String.raw`<%= config.bin %> <%= command.id %> my-custom-job -P "SiteScope={\"all_storefront_sites\":true}" -P OtherParam=value`,
    '<%= config.bin %> <%= command.id %> my-custom-job --wait --timeout 600',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for job to complete',
      default: false,
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds when waiting (default: no timeout)',
    }),
    param: Flags.string({
      char: 'P',
      description: 'Job parameter in format "name=value" (use -P multiple times for multiple params)',
      multiple: true,
      multipleNonGreedy: true,
    }),
    'no-wait-running': Flags.boolean({
      description: 'Do not wait for running job to finish before starting',
      default: false,
    }),
    'show-log': Flags.boolean({
      description: 'Show job log on failure',
      default: true,
    }),
  };

  async run(): Promise<JobExecution> {
    this.requireOAuthCredentials();

    const {jobId} = this.args;
    const {wait, timeout, param, 'no-wait-running': noWaitRunning, 'show-log': showLog} = this.flags;

    // Parse parameters
    const parameters = this.parseParameters(param || []);

    this.log(
      t('commands.job.run.executing', 'Executing job {{jobId}} on {{hostname}}...', {
        jobId,
        hostname: this.resolvedConfig.hostname!,
      }),
    );

    let execution: JobExecution;
    try {
      execution = await executeJob(this.instance, jobId, {
        parameters,
        waitForRunning: !noWaitRunning,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.job.run.executionFailed', 'Failed to execute job: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }

    this.log(
      t('commands.job.run.started', 'Job started: {{executionId}} (status: {{status}})', {
        executionId: execution.id,
        status: execution.execution_status,
      }),
    );

    // Wait for completion if requested
    if (wait) {
      this.log(t('commands.job.run.waiting', 'Waiting for job to complete...'));

      try {
        execution = await waitForJob(this.instance, jobId, execution.id!, {
          timeout: timeout ? timeout * 1000 : undefined,
          onProgress: (exec, elapsed) => {
            if (!this.jsonEnabled()) {
              const elapsedSec = Math.floor(elapsed / 1000);
              this.log(
                t('commands.job.run.progress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                  status: exec.execution_status,
                  elapsed: elapsedSec.toString(),
                }),
              );
            }
          },
        });

        const durationSec = execution.duration ? (execution.duration / 1000).toFixed(1) : 'N/A';
        this.log(
          t('commands.job.run.completed', 'Job completed: {{status}} (duration: {{duration}}s)', {
            status: execution.exit_status?.code || execution.execution_status,
            duration: durationSec,
          }),
        );
      } catch (error) {
        if (error instanceof JobExecutionError) {
          if (showLog) {
            await this.showJobLog(error.execution);
          }
          this.error(
            t('commands.job.run.jobFailed', 'Job failed: {{status}}', {
              status: error.execution.exit_status?.code || 'ERROR',
            }),
          );
        }
        throw error;
      }
    }

    // JSON output handled by oclif
    if (this.jsonEnabled()) {
      return execution;
    }

    return execution;
  }

  private parseParameters(params: string[]): Array<{name: string; value: string}> {
    return params.map((p) => {
      const eqIndex = p.indexOf('=');
      if (eqIndex === -1) {
        this.error(
          t('commands.job.run.invalidParam', 'Invalid parameter format: {{param}}. Expected "name=value"', {param: p}),
        );
      }
      return {
        name: p.slice(0, eqIndex),
        value: p.slice(eqIndex + 1),
      };
    });
  }
}
