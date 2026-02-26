/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {GranularReplicationsCommand} from '../granular-replications-command.js';
import {getApiErrorMessage, type PublishProcessResponse} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

export default class ReplicationsGet extends GranularReplicationsCommand<typeof ReplicationsGet> {
  static args = {
    'process-id': Args.string({
      description: 'Publish process ID',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.replications.get.description', 'Get granular replication process details'),
    '/cli/replications.html#get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <process-id>',
    '<%= config.bin %> <%= command.id %> xmRhi7394HymoeRkfwAAAZeg3WiM',
  ];

  async run(): Promise<PublishProcessResponse> {
    this.requireOAuthCredentials();

    const processId = this.args['process-id'];
    const organizationId = this.getOrganizationId();

    const result = await this.granularReplicationsClient.GET(
      '/organizations/{organizationId}/granular-processes/{id}',
      {
        params: {
          path: {organizationId, id: processId},
        },
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(t('commands.replications.get.error', 'Failed to get replication process: {{message}}', {message}));
    }

    if (this.jsonEnabled()) return result.data;

    this.printProcessDetails(result.data);
    return result.data;
  }

  private printProcessDetails(processData: PublishProcessResponse): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'Replication Process Details', padding: [1, 0, 0, 0]});
    ui.div('─'.repeat(process.stdout.columns || 80));
    ui.div({text: `ID: ${processData.id}`, padding: [1, 0, 0, 0]});
    ui.div({text: `Status: ${processData.status}`});
    ui.div({text: `Started: ${processData.startTime}`});
    if (processData.endTime) ui.div({text: `Completed: ${processData.endTime}`});
    ui.div({text: `Initiated By: ${processData.initiatedBy}`});

    if (processData.productItem) {
      ui.div({text: '\nEntity: Product', padding: [1, 0, 0, 0]});
      ui.div({text: `Product ID: ${processData.productItem.productId}`});
    } else if (processData.priceTableItem) {
      ui.div({text: '\nEntity: Price Table', padding: [1, 0, 0, 0]});
      ui.div({text: `Price Table ID: ${processData.priceTableItem.priceTableId}`});
    } else if (processData.contentAssetItem) {
      ui.div({text: '\nEntity: Content Asset', padding: [1, 0, 0, 0]});
      ui.div({text: `Content ID: ${processData.contentAssetItem.contentId}`});
      ui.div({text: `Type: ${processData.contentAssetItem.type}`});
      if (processData.contentAssetItem.type === 'private') {
        ui.div({text: `Site ID: ${processData.contentAssetItem.siteId}`});
      }
      if (processData.contentAssetItem.type === 'shared') {
        ui.div({text: `Library ID: ${processData.contentAssetItem.libraryId}`});
      }
    }

    ux.stdout(ui.toString());
  }
}
