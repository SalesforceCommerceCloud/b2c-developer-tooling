/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  searchJobExecutions,
  getJobExecution,
  getJobLog,
  type JobExecution,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {t, withDocs} from '../../i18n/index.js';
import {highlightLogText} from '../../utils/logs/index.js';

interface JobLogResult {
  execution: JobExecution;
  log: string;
}

export default class JobLog extends InstanceCommand<typeof JobLog> {
  static args = {
    jobId: Args.string({
      description: 'Job ID',
      required: true,
    }),
    executionId: Args.string({
      description: 'Execution ID (if omitted, finds the most recent execution with a log)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.job.log.description', 'Retrieve the log for a job execution'),
    '/cli/jobs.html#b2c-job-log',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-job',
    '<%= config.bin %> <%= command.id %> my-job --failed',
    '<%= config.bin %> <%= command.id %> my-job abc123-def456',
    '<%= config.bin %> <%= command.id %> my-job --json',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    failed: Flags.boolean({
      description: 'Find the most recent failed execution with a log',
      default: false,
    }),
    'no-color': Flags.boolean({
      description: 'Disable colored output',
      default: false,
    }),
  };

  protected operations = {
    searchJobExecutions,
    getJobExecution,
    getJobLog,
  };

  async run(): Promise<JobLogResult> {
    this.requireOAuthCredentials();

    const {jobId, executionId} = this.args;
    const {failed} = this.flags;

    let execution: JobExecution;

    if (executionId) {
      this.log(
        t('commands.job.log.fetchingSpecific', 'Fetching log for job {{jobId}} execution {{executionId}}...', {
          jobId,
          executionId,
        }),
      );
      execution = await this.operations.getJobExecution(this.instance, jobId, executionId);
    } else {
      this.log(
        failed
          ? t(
              'commands.job.log.searchingFailed',
              'Searching for most recent failed execution with log for job {{jobId}}...',
              {jobId},
            )
          : t('commands.job.log.searching', 'Searching for most recent execution with log for job {{jobId}}...', {
              jobId,
            }),
      );

      const results = await this.operations.searchJobExecutions(this.instance, {
        jobId,
        status: failed ? ['ERROR'] : undefined,
        count: 10,
        sortBy: 'start_time',
        sortOrder: 'desc',
      });

      const match = results.hits.find((hit) => hit.is_log_file_existing);
      if (!match) {
        const msg = failed
          ? t(
              'commands.job.log.noFailedExecutionFound',
              'No failed execution with a log file found for job {{jobId}}',
              {jobId},
            )
          : t('commands.job.log.noExecutionFound', 'No execution with a log file found for job {{jobId}}', {
              jobId,
            });
        this.error(msg);
      }

      execution = match;
    }

    if (!execution.is_log_file_existing) {
      this.error(t('commands.job.log.noLogFile', 'No log file exists for this execution'));
    }

    this.log(
      t('commands.job.log.foundExecution', 'Found execution {{executionId}} ({{status}})', {
        executionId: execution.id ?? 'unknown',
        status: execution.exit_status?.code || execution.execution_status || 'unknown',
      }),
    );

    const log = await this.operations.getJobLog(this.instance, execution);

    if (!this.jsonEnabled()) {
      const useColor = !this.flags['no-color'] && process.stdout.isTTY;
      process.stdout.write(useColor ? highlightLogText(log) : log);
    }

    return {execution, log};
  }
}
