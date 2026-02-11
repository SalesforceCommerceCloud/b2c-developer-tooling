/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../../i18n/index.js';

/**
 * Command to delete an Account Manager API client.
 * The API client must have been disabled for at least 7 days before it can be deleted.
 */
export default class ClientDelete extends AmCommand<typeof ClientDelete> {
  static args = {
    'api-client-id': Args.string({
      description: 'API client ID (UUID)',
      required: true,
    }),
  };

  static description = t(
    'commands.client.delete.description',
    'Delete an Account Manager API client (must be disabled 7+ days)',
  );

  static examples = ['<%= config.bin %> <%= command.id %> <api-client-id>'];

  async run(): Promise<void> {
    const apiClientId = this.args['api-client-id'];

    this.log(t('commands.client.delete.deleting', 'Deleting API client {{id}}...', {id: apiClientId}));

    await this.accountManagerClient.deleteApiClient(apiClientId);

    this.log(t('commands.client.delete.success', 'API client {{id}} deleted successfully.', {id: apiClientId}));
  }
}
