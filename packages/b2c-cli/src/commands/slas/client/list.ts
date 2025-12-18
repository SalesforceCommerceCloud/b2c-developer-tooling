import {createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  SlasClientCommand,
  type Client,
  type ClientOutput,
  normalizeClientResponse,
  formatApiError,
} from '../../../utils/slas/client.js';
import {t} from '../../../i18n/index.js';

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

export default class SlasClientList extends SlasClientCommand<typeof SlasClientList> {
  static description = t('commands.slas.client.list.description', 'List SLAS clients for a tenant');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
  };

  async run(): Promise<ClientListOutput> {
    this.requireOAuthCredentials();

    const {'tenant-id': tenantId} = this.flags;

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.list.fetching', 'Fetching SLAS clients for tenant {{tenantId}}...', {tenantId}));
    }

    const slasClient = this.getSlasClient();

    const {data, error} = await slasClient.GET('/tenants/{tenantId}/clients', {
      params: {
        path: {tenantId},
      },
    });

    if (error) {
      this.error(
        t('commands.slas.client.list.error', 'Failed to list SLAS clients: {{message}}', {
          message: formatApiError(error),
        }),
      );
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

    createTable(COLUMNS).render(clients, DEFAULT_COLUMNS);

    return output;
  }
}
