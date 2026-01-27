/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../../i18n/index.js';

type WafGroup = CdnZonesComponents['schemas']['WafGroup'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  groups: WafGroup[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<WafGroup>> = {
  groupId: {
    header: 'Group ID',
    get: (g) => g.groupId || '-',
  },
  description: {
    header: 'Description',
    get: (g) => g.description || '-',
  },
  mode: {
    header: 'Mode',
    get: (g) => g.mode || '-',
  },
  action: {
    header: 'Action',
    get: (g) => g.action || '-',
  },
};

const DEFAULT_COLUMNS = ['groupId', 'description', 'mode', 'action'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list WAF groups for a zone.
 * Note: This is for WAF v1. For zones created after 24.5, use waf rulesets commands.
 */
export default class EcdnWafGroupsList extends EcdnZoneCommand<typeof EcdnWafGroupsList> {
  static description = withDocs(
    t('commands.ecdn.waf.groups.list.description', 'List WAF v1 groups for a zone (not applicable for WAFv2 zones)'),
    '/cli/ecdn.html#b2c-ecdn-waf-groups-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
  };

  async run(): Promise<ListOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.groups.list.fetching', 'Fetching WAF groups...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/waf/groups', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.waf.groups.list.error', 'Failed to fetch WAF groups: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const groups = data?.data ?? [];
    const output: ListOutput = {
      groups,
      total: groups.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (groups.length === 0) {
      this.log(t('commands.ecdn.waf.groups.list.noGroups', 'No WAF groups found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.waf.groups.list.count', 'Found {{count}} WAF group(s):', {
        count: groups.length,
      }),
    );
    this.log('');

    const columns = this.flags.columns
      ? tableRenderer.validateColumnKeys(this.flags.columns.split(',').map((c) => c.trim()))
      : DEFAULT_COLUMNS;
    tableRenderer.render(groups, columns.length > 0 ? columns : DEFAULT_COLUMNS);

    return output;
  }
}
