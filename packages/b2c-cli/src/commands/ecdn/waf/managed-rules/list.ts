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

type WAFManagedRule = CdnZonesComponents['schemas']['WAFManagedRule'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  rules: WAFManagedRule[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<WAFManagedRule>> = {
  ruleId: {
    header: 'Rule ID',
    get: (r) => r.ruleId || '-',
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
  },
  action: {
    header: 'Action',
    get: (r) => r.action || '-',
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  categories: {
    header: 'Categories',
    get: (r) => r.categories?.join(', ') || '-',
    extended: true,
  },
  score: {
    header: 'Score',
    get: (r) => (r.score === undefined ? '-' : String(r.score)),
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['ruleId', 'description', 'action', 'enabled'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list WAF v2 managed rules within a ruleset.
 */
export default class EcdnWafManagedRulesList extends EcdnZoneCommand<typeof EcdnWafManagedRulesList> {
  static description = t('commands.ecdn.waf.managed-rules.list.description', 'List WAF v2 managed rules in a ruleset');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'ruleset-id': Flags.string({
      description: t('flags.rulesetId.description', 'WAF ruleset ID to list rules for'),
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
    const rulesetId = this.flags['ruleset-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.managed-rules.list.fetching', 'Fetching WAF v2 managed rules...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/zones/{zoneId}/firewall-managed/rulesets/{rulesetId}/rules',
      {
        params: {
          path: {organizationId, zoneId, rulesetId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.waf.managed-rules.list.error', 'Failed to fetch WAF managed rules: {{message}}', {
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
      this.log(t('commands.ecdn.waf.managed-rules.list.noRules', 'No WAF managed rules found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.waf.managed-rules.list.count', 'Found {{count}} WAF managed rule(s):', {
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
