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

type CustomRule = CdnZonesComponents['schemas']['CustomRule'];

interface GetOutput {
  rule: CustomRule;
}

export default class EcdnFirewallGet extends EcdnZoneCommand<typeof EcdnFirewallGet> {
  static description = withDocs(
    t('commands.ecdn.firewall.get.description', 'Get a custom firewall rule for a zone'),
    '/cli/ecdn.html#b2c-ecdn-firewall-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'Custom firewall rule ID'),
      required: true,
    }),
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.firewall.get.fetching', 'Fetching custom firewall rule {{id}}...', {id: ruleId}));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/zones/{zoneId}/firewall-custom/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, ruleId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.firewall.get.error', 'Failed to fetch custom firewall rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.firewall.get.noData', 'No custom firewall rule data returned from API'));
    }

    const output: GetOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    printFieldsBlock(
      t('commands.ecdn.firewall.get.success', 'Custom firewall rule details:'),
      [
        ['Rule ID', rule.ruleId],
        ['Description', rule.description],
        ['Expression', rule.expression],
        ['Actions', rule.actions?.join(', ') ?? '-'],
        ['Enabled', rule.enabled ? 'yes' : 'no'],
        ['Last Updated', rule.lastUpdated],
      ],
      {labelWidth: 18},
    );

    return output;
  }
}
