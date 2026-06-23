/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {
  SlasClientCommand,
  type Client,
  type ClientOutput,
  normalizeClientResponse,
} from '../../../utils/slas/client.js';
import {t, withDocs} from '../../../i18n/index.js';

interface ClientListOutput {
  clients: ClientOutput[];
}

const COLUMNS: Record<string, ColumnDef<ClientOutput>> = {
  clientId: {
    header: 'Client ID',
    get: (c) => c.clientId,
  },
  name: {
    header: 'Name',
    get: (c) => c.name,
  },
  isPrivate: {
    header: 'Private',
    get: (c) => String(c.isPrivateClient),
  },
};

const DEFAULT_COLUMNS = ['clientId', 'name', 'isPrivate'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class SlasClientList extends SlasClientCommand<typeof SlasClientList> {
  static description = withDocs(
    t('commands.slas.client.list.description', 'List SLAS clients for a tenant'),
    '/cli/slas.html#b2c-slas-client-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ClientListOutput> {
    this.requireOAuthCredentials();

    const tenantId = this.requireTenantId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.list.fetching', 'Fetching SLAS clients for tenant {{tenantId}}...', {tenantId}));
    }

    const slasClient = this.getSlasClient();

    const {data, error, response} = await slasClient.GET('/tenants/{tenantId}/clients', {
      params: {
        path: {tenantId},
      },
    });

    if (error) {
      const tenantExists = await this.checkTenantExists(slasClient, tenantId);
      if (tenantExists) {
        this.error(
          t('commands.slas.client.list.error', 'Failed to list SLAS clients: {{message}}', {
            message: getApiErrorMessage(error, response),
          }),
        );
      }
      // Tenant doesn't exist — no clients to list, fall through to empty handling
      this.logger.debug({tenantId}, 'Tenant does not exist yet, returning empty client list');
    }

    const clients = ((data as {data?: Client[]})?.data ?? []).map((client) => normalizeClientResponse(client));
    const output: ClientListOutput = {clients};

    if (this.jsonEnabled()) {
      return output;
    }

    if (clients.length === 0) {
      this.log(t('commands.slas.client.list.noClients', 'No SLAS clients found.'));
      return output;
    }

    tableRenderer.render(clients, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return output;
  }
}
