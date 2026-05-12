/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../../i18n/index.js';

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
  static description = withDocs(
    t('commands.ecdn.waf.rulesets.list.description', 'List WAF v2 managed rulesets for a zone'),
    '/cli/ecdn.html#b2c-ecdn-waf-rulesets-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    ...columnFlagsFor(COLUMNS),
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

    tableRenderer.render(rulesets, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return output;
  }
}
