/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

type PageShieldNotificationWebhookResponse = CdnZonesComponents['schemas']['PageShieldNotificationWebhookResponse'];
type PageShieldNotificationWebhookRequest = CdnZonesComponents['schemas']['PageShieldNotificationWebhookRequest'];

/**
 * Response type for the create command.
 */
interface CreateOutput {
  webhook: PageShieldNotificationWebhookResponse;
}

/**
 * Command to create a Page Shield notification webhook.
 */
export default class EcdnPageShieldNotificationsCreate extends EcdnCommand<typeof EcdnPageShieldNotificationsCreate> {
  static description = t(
    'commands.ecdn.page-shield.notifications.create.description',
    'Create a Page Shield notification webhook',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --webhook-url https://example.com/webhook',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --webhook-url https://example.com/webhook --secret my-secret --zones zone1,zone2',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
    'webhook-url': Flags.string({
      description: t('flags.webhookUrl.description', 'Webhook URL for notifications'),
      required: true,
    }),
    secret: Flags.string({
      description: t('flags.secret.description', 'Optional webhook secret'),
    }),
    zones: Flags.string({
      description: t('flags.zones.description', 'Comma-separated list of zone names to filter notifications'),
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.page-shield.notifications.create.creating', 'Creating Page Shield webhook...'));
    }

    const body: PageShieldNotificationWebhookRequest = {
      webhookUrl: this.flags['webhook-url'],
    };

    if (this.flags.secret) {
      body.secret = this.flags.secret;
    }
    if (this.flags.zones) {
      body.zones = this.flags.zones.split(',').map((z) => z.trim());
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/page-shield/notifications', {
      params: {
        path: {organizationId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.notifications.create.error', 'Failed to create Page Shield webhook: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const webhook = data?.data;
    if (!webhook) {
      this.error(t('commands.ecdn.page-shield.notifications.create.noData', 'No webhook data returned from API'));
    }

    const output: CreateOutput = {webhook};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: t('commands.ecdn.page-shield.notifications.create.success', 'Page Shield webhook created!')});
    ui.div('');
    ui.div({text: 'Webhook ID:', width: labelWidth}, {text: webhook.id});
    ui.div({text: 'Name:', width: labelWidth}, {text: webhook.name});
    ui.div({text: 'URL:', width: labelWidth}, {text: webhook.webhookUrl});
    ui.div({text: 'Type:', width: labelWidth}, {text: webhook.type});

    if (webhook.zones && webhook.zones.length > 0) {
      ui.div({text: 'Zones:', width: labelWidth}, {text: webhook.zones.join(', ')});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
