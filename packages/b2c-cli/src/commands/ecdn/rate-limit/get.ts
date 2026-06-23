/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type RateLimitingRule = CdnZonesComponents['schemas']['RateLimitingRule'];

interface GetOutput {
  rule: RateLimitingRule;
}

export default class EcdnRateLimitGet extends EcdnZoneCommand<typeof EcdnRateLimitGet> {
  static description = withDocs(
    t('commands.ecdn.rate-limit.get.description', 'Get a rate limiting rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-rate-limit-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'Rate limiting rule ID'),
      required: true,
    }),
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.rate-limit.get.fetching', 'Fetching rate limiting rule {{id}}...', {id: ruleId}));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/zones/{zoneId}/rate-limiting/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, ruleId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.rate-limit.get.error', 'Failed to fetch rate limiting rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.rate-limit.get.noData', 'No rate limiting rule data returned from API'));
    }

    const output: GetOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    printFieldsBlock(
      t('commands.ecdn.rate-limit.get.success', 'Rate limiting rule details:'),
      [
        ['Rule ID', rule.ruleId],
        ['Description', rule.description],
        ['Expression', rule.expression],
        ['Action', rule.action],
        ['Period (seconds)', String(rule.period)],
        ['Requests Per Period', String(rule.requestsPerPeriod)],
        ['Mitigation Timeout', String(rule.mitigationTimeout)],
        ['Enabled', rule.enabled ? 'yes' : 'no'],
        ['Characteristics', rule.characteristics.join(', ')],
        ['Counting Expression', rule.countingExpression ?? null],
        ['Last Updated', rule.lastUpdated],
      ],
      {labelWidth: 22},
    );

    return output;
  }
}
