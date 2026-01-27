/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../../i18n/index.js';

type WafRule = CdnZonesComponents['schemas']['WafRule'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  rule: WafRule;
}

/**
 * Command to get a WAF rule for a zone.
 * Note: This is for WAF v1. For zones created after 24.5, use waf managed-rules commands.
 */
export default class EcdnWafRulesGet extends EcdnZoneCommand<typeof EcdnWafRulesGet> {
  static description = withDocs(
    t('commands.ecdn.waf.rules.get.description', 'Get a WAF v1 rule for a zone (not applicable for WAFv2 zones)'),
    '/cli/ecdn.html#b2c-ecdn-waf-rules-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id abc123',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id abc123 --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'WAF rule ID to get'),
      required: true,
    }),
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.rules.get.fetching', 'Fetching WAF rule...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/waf/rules/{ruleId}', {
      params: {
        path: {organizationId, zoneId, ruleId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.waf.rules.get.error', 'Failed to fetch WAF rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.waf.rules.get.noData', 'No WAF rule data returned from API'));
    }

    const output: GetOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: 'WAF Rule:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Rule ID:', width: labelWidth}, {text: rule.ruleId || '-'});
    ui.div({text: 'Group ID:', width: labelWidth}, {text: rule.groupId || '-'});
    ui.div({text: 'Description:', width: labelWidth}, {text: rule.description || '-'});
    ui.div({text: 'Action:', width: labelWidth}, {text: rule.action || '-'});
    ui.div({text: 'Default Action:', width: labelWidth}, {text: rule.defaultAction || '-'});

    ux.stdout(ui.toString());

    return output;
  }
}
