/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../../i18n/index.js';

type PageShieldNotificationWebhookResponse = CdnZonesComponents['schemas']['PageShieldNotificationWebhookResponse'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  webhooks: PageShieldNotificationWebhookResponse[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<PageShieldNotificationWebhookResponse>> = {
  id: {
    header: 'Webhook ID',
    get: (r) => r.id || '-',
  },
  name: {
    header: 'Name',
    get: (r) => r.name || '-',
  },
  webhookUrl: {
    header: 'URL',
    get: (r) => r.webhookUrl || '-',
  },
  type: {
    header: 'Type',
    get: (r) => r.type || '-',
  },
  createdAt: {
    header: 'Created',
    get: (r) => r.createdAt || '-',
    extended: true,
  },
  zones: {
    header: 'Zones',
    get: (r) => r.zones?.join(', ') || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'name', 'webhookUrl', 'type'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Page Shield notification webhooks.
 */
export default class EcdnPageShieldNotificationsList extends EcdnCommand<typeof EcdnPageShieldNotificationsList> {
  static description = withDocs(
    t('commands.ecdn.page-shield.notifications.list.description', 'List Page Shield notification webhooks'),
    '/cli/ecdn.html#b2c-ecdn-page-shield-notifications-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --json',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: t('flags.extended.description', 'Show all columns including extended fields'),
      default: false,
    }),
  };

  async run(): Promise<ListOutput> {
    this.requireOAuthCredentials();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.page-shield.notifications.list.fetching', 'Fetching Page Shield webhooks...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/page-shield/notifications', {
      params: {
        path: {organizationId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.notifications.list.error', 'Failed to fetch Page Shield webhooks: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const webhooks = data?.data ?? [];
    const output: ListOutput = {
      webhooks,
      total: webhooks.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (webhooks.length === 0) {
      this.log(t('commands.ecdn.page-shield.notifications.list.noWebhooks', 'No Page Shield webhooks found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.page-shield.notifications.list.count', 'Found {{count}} Page Shield webhook(s):', {
        count: webhooks.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(webhooks, columns);

    return output;
  }

  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      const requested = columnsFlag.split(',').map((c) => c.trim());
      const valid = tableRenderer.validateColumnKeys(requested);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${tableRenderer.getColumnKeys().join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      return tableRenderer.getColumnKeys();
    }

    return DEFAULT_COLUMNS;
  }
}
