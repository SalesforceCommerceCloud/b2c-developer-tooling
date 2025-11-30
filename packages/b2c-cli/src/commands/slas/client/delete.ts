import {Args} from '@oclif/core';
import {SlasClientCommand, formatApiError} from '../../../utils/slas/client.js';
import {t} from '../../../i18n/index.js';

interface DeleteOutput {
  clientId: string;
  deleted: boolean;
}

export default class SlasClientDelete extends SlasClientCommand<typeof SlasClientDelete> {
  static args = {
    clientId: Args.string({
      description: 'SLAS client ID to delete',
      required: true,
    }),
  };

  static description = t('commands.slas.client.delete.description', 'Delete a SLAS client');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123',
    '<%= config.bin %> <%= command.id %> my-client-id --tenant-id abcd_123 --json',
  ];

  static flags = {
    ...SlasClientCommand.baseFlags,
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const {'tenant-id': tenantId} = this.flags;
    const {clientId} = this.args;

    if (!this.jsonEnabled()) {
      this.log(t('commands.slas.client.delete.deleting', 'Deleting SLAS client {{clientId}}...', {clientId}));
    }

    const slasClient = this.getSlasClient();

    // eslint-disable-next-line new-cap
    const {error} = await slasClient.DELETE('/tenants/{tenantId}/clients/{clientId}', {
      params: {
        path: {tenantId, clientId},
      },
    });

    if (error) {
      this.error(
        t('commands.slas.client.delete.error', 'Failed to delete SLAS client: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {
      clientId,
      deleted: true,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    this.log(t('commands.slas.client.delete.success', 'SLAS client {{clientId}} deleted successfully.', {clientId}));

    return output;
  }
}
