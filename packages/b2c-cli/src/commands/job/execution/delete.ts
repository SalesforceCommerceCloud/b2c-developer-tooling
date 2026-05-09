/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {JobCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {scapiDeleteJobExecution} from '@salesforce/b2c-tooling-sdk/operations/jobs';
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

  // SCAPI-only: there is no OCAPI endpoint for deleting a job execution.
  // The command requires SCAPI configuration regardless of `apiBackend`.
  static description = withDocs(
    t(
      'commands.job.execution.delete.description',
      'Delete a job execution record (SCAPI only — requires shortCode, tenantId, and OAuth credentials)',
    ),
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
    const tenantId = this.resolvedConfig.values.tenantId;

    if (this.apiBackendPreference === 'ocapi') {
      this.error(
        t(
          'commands.job.execution.delete.ocapiNotSupported',
          'Deleting job executions is only available via SCAPI. Remove --api-backend ocapi or set apiBackend to auto/scapi.',
        ),
      );
    }

    const client = this.buildScapiJobsClient();
    if (!client || !tenantId) {
      this.error(
        t(
          'commands.job.execution.delete.scapiNotConfigured',
          'Deleting job executions requires SCAPI. Configure shortCode, tenantId, and OAuth credentials.',
        ),
      );
    }

    this.log(
      t('commands.job.execution.delete.deleting', 'Deleting execution {{executionId}} for job {{jobId}}...', {
        jobId,
        executionId,
      }),
    );

    await scapiDeleteJobExecution(client, jobId, executionId, tenantId);

    this.log(t('commands.job.execution.delete.deleted', 'Execution {{executionId}} deleted.', {executionId}));
  }
}
