/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type CustomRule = CdnZonesComponents['schemas']['CustomRule'];

interface ListOutput {
  rules: CustomRule[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<CustomRule>> = {
  ruleId: {
    header: 'Rule ID',
    get: (r) => r.ruleId || '-',
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
  },
  actions: {
    header: 'Actions',
    get: (r) => r.actions?.join(', ') || '-',
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  expression: {
    header: 'Expression',
    get: (r) => r.expression || '-',
    extended: true,
  },
  lastUpdated: {
    header: 'Last Updated',
    get: (r) => r.lastUpdated || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['ruleId', 'description', 'actions', 'enabled'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class EcdnFirewallList extends EcdnZoneCommand<typeof EcdnFirewallList> {
  static description = withDocs(
    t('commands.ecdn.firewall.list.description', 'List custom firewall rules for a zone'),
    '/cli/ecdn.html#b2c-ecdn-firewall-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --limit 50',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    limit: Flags.integer({
      description: t('flags.limit.description', 'Maximum records to retrieve per request, not to exceed 50'),
      min: 1,
      max: 50,
    }),
    offset: Flags.integer({
      description: t('flags.offset.description', 'Result offset for pagination'),
      min: 0,
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ListOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const limit = this.flags.limit as number | undefined;
    const offset = this.flags.offset as number | undefined;

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.firewall.list.fetching', 'Fetching custom firewall rules...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const query: {limit?: number; offset?: number} = {};
    if (limit !== undefined) query.limit = limit;
    if (offset !== undefined) query.offset = offset;

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/firewall-custom/rules', {
      params: {
        path: {organizationId, zoneId},
        query,
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.firewall.list.error', 'Failed to fetch custom firewall rules: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rules = data?.data ?? [];
    const output: ListOutput = {rules, total: rules.length};

    if (this.jsonEnabled()) {
      return output;
    }

    if (rules.length === 0) {
      this.log(t('commands.ecdn.firewall.list.noRules', 'No custom firewall rules found.'));
      return output;
    }

    this.log(t('commands.ecdn.firewall.list.count', 'Found {{count}} custom firewall rule(s):', {count: rules.length}));
    this.log('');

    tableRenderer.render(rules, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return output;
  }
}
