/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {
  ExistingSlasClientCommand,
  type Client,
  type ClientOutput,
  normalizeClientResponse,
  printClientDetails,
  formatApiError,
} from '../../../utils/slas/client.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class SlasClientGet extends ExistingSlasClientCommand<typeof SlasClientGet> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID to retrieve (defaults to configured slasClientId)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.slas.client.get.description', 'Get a SLAS client'),
    '/cli/slas.html#b2c-slas-client-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --json',
  ];

  static flags = {
    ...ExistingSlasClientCommand.baseFlags,
  };

  async run(): Promise<ClientOutput> {
    this.requireOAuthCredentials();

    const tenantId = this.requireTenantId();
    const clientId = this.requireSlasClientId(this.args.clientId);

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.get.fetching', 'Fetching SLAS client {{clientId}}...', {clientId}));
    }

    const slasClient = this.getSlasClient();

    const {data, error, response} = await slasClient.GET('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
    });

    if (error) {
      this.error(
        t('commands.slas.client.get.error', 'Failed to get SLAS client: {{message}}', {
          message: formatApiError(error, response),
        }),
      );
    }

    const output = normalizeClientResponse(data as Client);

    if (this.jsonEnabled()) {
      return output;
    }

    printClientDetails(output, false);

    return output;
  }
}
