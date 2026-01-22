/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {EcdnCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

/**
 * Response type for the delete command.
 */
interface DeleteOutput {
  deleted: boolean;
  webhookId: string;
}

/**
 * Command to delete a Page Shield notification webhook.
 */
export default class EcdnPageShieldNotificationsDelete extends EcdnCommand<typeof EcdnPageShieldNotificationsDelete> {
  static description = t(
    'commands.ecdn.page-shield.notifications.delete.description',
    'Delete a Page Shield notification webhook',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --webhook-id webhook_1234567890abcdef'];

  static flags = {
    ...EcdnCommand.baseFlags,
    'webhook-id': Flags.string({
      description: t('flags.webhookId.description', 'Webhook ID to delete'),
      required: true,
    }),
  };

  async run(): Promise<DeleteOutput> {
    this.requireOAuthCredentials();

    const webhookId = this.flags['webhook-id'];

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.page-shield.notifications.delete.deleting', 'Deleting Page Shield webhook {{id}}...', {
          id: webhookId,
        }),
      );
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {error} = await client.DELETE('/organizations/{organizationId}/page-shield/notifications/{webhookId}', {
      params: {
        path: {organizationId, webhookId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.notifications.delete.error', 'Failed to delete Page Shield webhook: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const output: DeleteOutput = {deleted: true, webhookId};

    if (this.jsonEnabled()) {
      return output;
    }

    ux.stdout(
      t('commands.ecdn.page-shield.notifications.delete.success', 'Page Shield webhook {{id}} deleted successfully.', {
        id: webhookId,
      }),
    );

    return output;
  }
}
