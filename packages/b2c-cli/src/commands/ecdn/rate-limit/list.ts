/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type RateLimitingRule = CdnZonesComponents['schemas']['RateLimitingRule'];

interface ListOutput {
  rules: RateLimitingRule[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<RateLimitingRule>> = {
  ruleId: {
    header: 'Rule ID',
    get: (r) => r.ruleId || '-',
    extended: true,
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
  },
  action: {
    header: 'Action',
    get: (r) => r.action || '-',
  },
  period: {
    header: 'Period',
    get: (r) => String(r.period),
  },
  requestsPerPeriod: {
    header: 'Requests',
    get: (r) => String(r.requestsPerPeriod),
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  mitigationTimeout: {
    header: 'Mitigation Timeout',
    get: (r) => String(r.mitigationTimeout),
    extended: true,
  },
  characteristics: {
    header: 'Characteristics',
    get: (r) => r.characteristics?.join(', ') || '-',
    extended: true,
  },
  countingExpression: {
    header: 'Counting Expression',
    get: (r) => r.countingExpression || '-',
    extended: true,
  },
  lastUpdated: {
    header: 'Last Updated',
    get: (r) => r.lastUpdated || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['description', 'action', 'period', 'requestsPerPeriod', 'enabled'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class EcdnRateLimitList extends EcdnZoneCommand<typeof EcdnRateLimitList> {
  static description = withDocs(
    t('commands.ecdn.rate-limit.list.description', 'List rate limiting rules for a zone'),
    '/cli/ecdn.html#b2c-ecdn-rate-limit-list',
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
      this.log(t('commands.ecdn.rate-limit.list.fetching', 'Fetching rate limiting rules...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/rate-limiting/rules', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.rate-limit.list.error', 'Failed to fetch rate limiting rules: {{message}}', {
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
      this.log(t('commands.ecdn.rate-limit.list.noRules', 'No rate limiting rules found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.rate-limit.list.count', 'Found {{count}} rate limiting rule(s):', {
        count: rules.length,
      }),
    );
    this.log('');

    tableRenderer.render(rules, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return output;
  }
}
