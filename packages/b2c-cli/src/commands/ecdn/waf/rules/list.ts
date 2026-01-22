/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

type WafRule = CdnZonesComponents['schemas']['WafRule'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  rules: WafRule[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<WafRule>> = {
  ruleId: {
    header: 'Rule ID',
    get: (r) => r.ruleId || '-',
  },
  groupId: {
    header: 'Group ID',
    get: (r) => r.groupId || '-',
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
  },
  action: {
    header: 'Action',
    get: (r) => r.action || '-',
  },
  defaultAction: {
    header: 'Default Action',
    get: (r) => r.defaultAction || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['ruleId', 'description', 'action'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list WAF rules for a zone.
 * Note: This is for WAF v1. For zones created after 24.5, use waf managed-rules commands.
 */
export default class EcdnWafRulesList extends EcdnZoneCommand<typeof EcdnWafRulesList> {
  static description = t(
    'commands.ecdn.waf.rules.list.description',
    'List WAF v1 rules for a zone (not applicable for WAFv2 zones)',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --group-id abc123',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --group-id abc123 --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'group-id': Flags.string({
      description: t('flags.groupId.description', 'WAF group ID to list rules for'),
      required: true,
    }),
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

    const zoneId = await this.resolveZoneId();
    const groupId = this.flags['group-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.rules.list.fetching', 'Fetching WAF rules...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/waf/rules', {
      params: {
        path: {organizationId, zoneId},
        query: {groupId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.waf.rules.list.error', 'Failed to fetch WAF rules: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rules = data?.data ?? [];
    const output: ListOutput = {
      rules,
      total: rules.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (rules.length === 0) {
      this.log(t('commands.ecdn.waf.rules.list.noRules', 'No WAF rules found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.waf.rules.list.count', 'Found {{count}} WAF rule(s):', {
        count: rules.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(rules, columns);

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
