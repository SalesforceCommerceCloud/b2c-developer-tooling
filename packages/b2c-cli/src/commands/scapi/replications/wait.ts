/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {GranularReplicationsCommand} from '../granular-replications-command.js';
import {getApiErrorMessage, type PublishProcessResponse} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

export default class ReplicationsWait extends GranularReplicationsCommand<typeof ReplicationsWait> {
  static args = {
    'process-id': Args.string({
      description: 'Publish process ID',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.replications.wait.description', 'Wait for a granular replication process to complete'),
    '/cli/replications.html#wait',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <process-id>',
    '<%= config.bin %> <%= command.id %> xmRhi7394HymoeRkfwAAAZeg3WiM --timeout 600',
    '<%= config.bin %> <%= command.id %> xmRhi7394HymoeRkfwAAAZeg3WiM --interval 10',
  ];

  static flags = {
    timeout: Flags.integer({
      char: 't',
      description: 'Timeout in seconds (default: 300)',
      default: 300,
    }),
    interval: Flags.integer({
      char: 'i',
      description: 'Poll interval in seconds (default: 5)',
      default: 5,
    }),
  };

  async run(): Promise<PublishProcessResponse> {
    this.requireOAuthCredentials();

    const processId = this.args['process-id'];
    const {timeout, interval} = this.flags;
    const organizationId = this.getOrganizationId();

    const startTime = Date.now();
    const timeoutMs = timeout * 1000;
    const intervalMs = interval * 1000;

    while (Date.now() - startTime < timeoutMs) {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.granularReplicationsClient.GET(
        '/organizations/{organizationId}/granular-processes/{id}',
        {
          params: {path: {organizationId, id: processId}},
        },
      );

      if (!result.data) {
        const message = getApiErrorMessage(result.error, result.response);
        this.error(t('commands.replications.wait.error', 'Failed to get process status: {{message}}', {message}));
      }

      const status = result.data.status;

      if (!this.jsonEnabled()) {
        this.log(t('commands.replications.wait.checking', 'Status: {{status}}', {status}));
      }

      if (status === 'completed') {
        if (!this.jsonEnabled()) {
          this.log(t('commands.replications.wait.completed', 'Process completed successfully'));
        }
        return result.data;
      }

      if (status === 'failed') {
        if (!this.jsonEnabled()) {
          this.log(t('commands.replications.wait.failed', 'Process failed'));
        }
        return result.data;
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, intervalMs);
      });
    }

    this.error(t('commands.replications.wait.timeout', 'Timeout waiting for process to complete'));
  }
}
