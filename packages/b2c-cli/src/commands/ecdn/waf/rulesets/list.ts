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

type WAFManagedRuleset = CdnZonesComponents['schemas']['WAFManagedRuleset'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  rulesets: WAFManagedRuleset[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<WAFManagedRuleset>> = {
  rulesetId: {
    header: 'Ruleset ID',
    get: (r) => r.rulesetId || '-',
  },
  name: {
    header: 'Name',
    get: (r) => r.name || '-',
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  action: {
    header: 'Action',
    get: (r) => r.action || '-',
  },
  paranoiaLevel: {
    header: 'Paranoia',
    get: (r) => (r.paranoiaLevel === undefined ? '-' : String(r.paranoiaLevel)),
    extended: true,
  },
  anomalyScore: {
    header: 'Anomaly Score',
    get: (r) => r.anomalyScore || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['name', 'enabled', 'action'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list WAF v2 managed rulesets for a zone.
 */
export default class EcdnWafRulesetsList extends EcdnZoneCommand<typeof EcdnWafRulesetsList> {
  static description = t('commands.ecdn.waf.rulesets.list.description', 'List WAF v2 managed rulesets for a zone');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
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

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.rulesets.list.fetching', 'Fetching WAF v2 rulesets...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/firewall-managed/rulesets', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.waf.rulesets.list.error', 'Failed to fetch WAF rulesets: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rulesets = data?.data ?? [];
    const output: ListOutput = {
      rulesets,
      total: rulesets.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (rulesets.length === 0) {
      this.log(t('commands.ecdn.waf.rulesets.list.noRulesets', 'No WAF rulesets found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.waf.rulesets.list.count', 'Found {{count}} WAF ruleset(s):', {
        count: rulesets.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(rulesets, columns);

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
