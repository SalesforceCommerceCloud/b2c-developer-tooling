/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../../i18n/index.js';

export default class JobExecutionDelete extends JobCommand<typeof JobExecutionDelete> {
  static args = {
    jobId: Args.string({
      description: 'Job ID',
      required: true,
    }),
    executionId: Args.string({
      description: 'Execution ID to delete',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.job.execution.delete.description', 'Delete a job execution record (requires SCAPI)'),
    '/cli/jobs.html#b2c-job-execution-delete',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> my-job abc123-def456',
    '<%= config.bin %> <%= command.id %> my-job abc123-def456 --api-backend scapi',
  ];

  static flags = {
    ...JobCommand.baseFlags,
  };

  async run(): Promise<void> {
    this.requireOAuthCredentials();

    const {jobId, executionId} = this.args;

    const backend = this.createJobsBackend();
    this.logger.debug(`Using ${backend.name} backend for execution delete`);

    this.log(
      t('commands.job.execution.delete.deleting', 'Deleting execution {{executionId}} for job {{jobId}}...', {
        jobId,
        executionId,
      }),
    );

    await backend.deleteJobExecution(jobId, executionId);

    this.log(t('commands.job.execution.delete.deleted', 'Execution {{executionId}} deleted.', {executionId}));
  }
}
