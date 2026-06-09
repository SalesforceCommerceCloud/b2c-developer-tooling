/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import cliui from 'cliui';
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

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 22;

    ui.div('');
    ui.div({text: t('commands.ecdn.rate-limit.get.success', 'Rate limiting rule details:')});
    ui.div('');
    ui.div({text: 'Rule ID:', width: labelWidth}, {text: rule.ruleId});
    ui.div({text: 'Description:', width: labelWidth}, {text: rule.description});
    ui.div({text: 'Expression:', width: labelWidth}, {text: rule.expression});
    ui.div({text: 'Action:', width: labelWidth}, {text: rule.action});
    ui.div({text: 'Period (seconds):', width: labelWidth}, {text: String(rule.period)});
    ui.div({text: 'Requests Per Period:', width: labelWidth}, {text: String(rule.requestsPerPeriod)});
    ui.div({text: 'Mitigation Timeout:', width: labelWidth}, {text: String(rule.mitigationTimeout)});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: rule.enabled ? 'yes' : 'no'});
    ui.div({text: 'Characteristics:', width: labelWidth}, {text: rule.characteristics.join(', ')});

    if (rule.countingExpression) {
      ui.div({text: 'Counting Expression:', width: labelWidth}, {text: rule.countingExpression});
    }

    ui.div({text: 'Last Updated:', width: labelWidth}, {text: rule.lastUpdated});

    this.log(ui.toString());

    return output;
  }
}
