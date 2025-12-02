import {ux} from '@oclif/core';
import cliui from 'cliui';
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

    this.printClientsTable(clients);

    return output;
  }

  private printClientsTable(clients: ClientOutput[]): void {
    const ui = cliui({width: process.stdout.columns || 80});

    // Header
    ui.div(
      {text: 'Client ID', width: 40, padding: [0, 2, 0, 0]},
      {text: 'Name', width: 30, padding: [0, 2, 0, 0]},
      {text: 'Private', padding: [0, 0, 0, 0]},
    );

    // Separator
    ui.div({text: '─'.repeat(80), padding: [0, 0, 0, 0]});

    // Rows
    for (const client of clients) {
      ui.div(
        {text: client.clientId, width: 40, padding: [0, 2, 0, 0]},
        {text: client.name, width: 30, padding: [0, 2, 0, 0]},
        {text: String(client.isPrivateClient), padding: [0, 0, 0, 0]},
      );
    }

    ux.stdout(ui.toString());
  }
}
