/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

type MRTRulesResponse = CdnZonesComponents['schemas']['MRTRulesResponse'];
type MRTRules = CdnZonesComponents['schemas']['MRTRules'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  ruleset: MRTRulesResponse['ruleset'];
}

const COLUMNS: Record<string, ColumnDef<MRTRules>> = {
  id: {
    header: 'Rule ID',
    get: (r) => r.id || '-',
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  mrtHostname: {
    header: 'MRT Hostname',
    get: (r) => r.mrtHostname || '-',
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
  },
  expression: {
    header: 'Expression',
    get: (r) => (r.expression.length > 50 ? r.expression.slice(0, 47) + '...' : r.expression),
  },
};

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to get MRT ruleset for a zone.
 */
export default class EcdnMrtRulesGet extends EcdnZoneCommand<typeof EcdnMrtRulesGet> {
  static description = t('commands.ecdn.mrt-rules.get.description', 'Get MRT ruleset for a zone');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mrt-rules.get.fetching', 'Fetching MRT ruleset...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/mrtrules', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.mrt-rules.get.error', 'Failed to fetch MRT ruleset: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const ruleset = data?.data?.ruleset;
    if (!ruleset) {
      this.error(t('commands.ecdn.mrt-rules.get.noData', 'No MRT ruleset data returned from API'));
    }

    const output: GetOutput = {ruleset};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log('');
    ux.stdout(`Ruleset ID: ${ruleset.id}`);
    ux.stdout(`Name: ${ruleset.name}`);
    ux.stdout(`Last Updated: ${ruleset.lastUpdated}`);
    this.log('');

    if (ruleset.rules.length === 0) {
      this.log(t('commands.ecdn.mrt-rules.get.noRules', 'No MRT rules defined in ruleset.'));
      return output;
    }

    this.log(
      t('commands.ecdn.mrt-rules.get.count', 'Found {{count}} MRT rule(s):', {
        count: ruleset.rules.length,
      }),
    );
    this.log('');

    tableRenderer.render(ruleset.rules, Object.keys(COLUMNS));

    return output;
  }
}
