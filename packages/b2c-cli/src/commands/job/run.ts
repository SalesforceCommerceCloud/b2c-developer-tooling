/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {JobCommand, type B2COperationContext} from '@salesforce/b2c-tooling-sdk/cli';
import {
  executeJob,
  waitForJob,
  JobExecutionError,
  type JobExecution,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
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
    String.raw`<%= config.bin %> <%= command.id %> sfcc-search-index-product-full-update --body '{"site_scope":{"named_sites":["RefArch"]}}'`,
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
      exclusive: ['body'],
    }),
    body: Flags.string({
      char: 'B',
      description: 'Raw JSON request body (for system jobs with non-standard schemas)',
      exclusive: ['param'],
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
    const {wait, timeout, param, body, 'no-wait-running': noWaitRunning, 'show-log': showLog} = this.flags;

    // Parse parameters or body
    const parameters = this.parseParameters(param || []);
    const rawBody = body ? this.parseBody(body) : undefined;

    // Create lifecycle context
    const context = this.createContext('job:run', {
      jobId,
      parameters: rawBody ? undefined : parameters,
      body: rawBody,
      wait,
      hostname: this.resolvedConfig.hostname,
    });

    // Run beforeOperation hooks - check for skip
    const beforeResult = await this.runBeforeHooks(context);
    if (beforeResult.skip) {
      this.log(
        t('commands.job.run.skipped', 'Job execution skipped: {{reason}}', {
          reason: beforeResult.skipReason || 'skipped by plugin',
        }),
      );
      // Return a mock execution for JSON output
      return {execution_status: 'finished', exit_status: {code: 'skipped'}} as unknown as JobExecution;
    }

    this.log(
      t('commands.job.run.executing', 'Executing job {{jobId}} on {{hostname}}...', {
        jobId,
        hostname: this.resolvedConfig.hostname!,
      }),
    );

    let execution: JobExecution;
    try {
      execution = await executeJob(this.instance, jobId, {
        parameters: rawBody ? undefined : parameters,
        body: rawBody,
        waitForRunning: !noWaitRunning,
      });
    } catch (error) {
      this.handleExecutionError(error, context);
    }

    this.log(
      t('commands.job.run.started', 'Job started: {{executionId}} (status: {{status}})', {
        executionId: execution.id,
        status: execution.execution_status,
      }),
    );

    // Wait for completion if requested
    if (wait) {
      execution = await this.waitForJobCompletion({
        jobId,
        executionId: execution.id!,
        timeout,
        showLog,
        context,
      });
    } else {
      // Not waiting - run afterOperation hooks with current state
      await this.runAfterHooks(context, {
        success: true,
        duration: Date.now() - context.startTime,
        data: execution,
      });
    }

    return execution;
  }

  private handleExecutionError(error: unknown, context: B2COperationContext): never {
    // Run afterOperation hooks with failure (fire-and-forget, errors ignored)
    this.runAfterHooks(context, {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      duration: Date.now() - context.startTime,
    }).catch(() => {});

    if (error instanceof Error) {
      this.error(t('commands.job.run.executionFailed', 'Failed to execute job: {{message}}', {message: error.message}));
    }
    throw error;
  }

  private async handleWaitError(error: unknown, showLog: boolean, context: B2COperationContext): Promise<never> {
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
        t('commands.job.run.jobFailed', 'Job failed: {{status}}', {
          status: error.execution.exit_status?.code || 'ERROR',
        }),
      );
    }
    throw error;
  }

  private parseBody(body: string): Record<string, unknown> {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      this.error(t('commands.job.run.invalidBody', 'Invalid JSON body: {{body}}', {body}));
    }
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

  private async waitForJobCompletion(options: {
    jobId: string;
    executionId: string;
    timeout: number | undefined;
    showLog: boolean;
    context: B2COperationContext;
  }): Promise<JobExecution> {
    const {jobId, executionId, timeout, showLog, context} = options;
    this.log(t('commands.job.run.waiting', 'Waiting for job to complete...'));

    try {
      const execution = await waitForJob(this.instance, jobId, executionId, {
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

      // Run afterOperation hooks with success
      await this.runAfterHooks(context, {
        success: true,
        duration: Date.now() - context.startTime,
        data: execution,
      });

      return execution;
    } catch (error) {
      return this.handleWaitError(error, showLog, context);
    }
  }
}
