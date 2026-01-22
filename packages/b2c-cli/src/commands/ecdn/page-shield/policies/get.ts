/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

type PageShieldPolicyResponse = CdnZonesComponents['schemas']['PageShieldPolicyResponse'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  policy: PageShieldPolicyResponse;
}

/**
 * Command to get a Page Shield policy for a zone.
 */
export default class EcdnPageShieldPoliciesGet extends EcdnZoneCommand<typeof EcdnPageShieldPoliciesGet> {
  static description = t('commands.ecdn.page-shield.policies.get.description', 'Get a Page Shield policy');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --policy-id policy_1234567890abcdef',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --policy-id policy_1234567890abcdef --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'policy-id': Flags.string({
      description: t('flags.policyId.description', 'Page Shield policy ID'),
      required: true,
    }),
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const policyId = this.flags['policy-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.page-shield.policies.get.fetching', 'Fetching Page Shield policy...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/zones/{zoneId}/page-shield/policies/{policyId}',
      {
        params: {
          path: {organizationId, zoneId, policyId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.policies.get.error', 'Failed to fetch Page Shield policy: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const policy = data?.data;
    if (!policy) {
      this.error(t('commands.ecdn.page-shield.policies.get.noData', 'No policy data returned from API'));
    }

    const output: GetOutput = {policy};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: 'Page Shield Policy:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Policy ID:', width: labelWidth}, {text: policy.id || '-'});
    ui.div({text: 'Action:', width: labelWidth}, {text: policy.action || '-'});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: policy.enabled ? 'yes' : 'no'});
    ui.div({text: 'Value:', width: labelWidth}, {text: policy.value || '-'});

    if (policy.description) {
      ui.div({text: 'Description:', width: labelWidth}, {text: policy.description});
    }
    if (policy.expression) {
      ui.div({text: 'Expression:', width: labelWidth}, {text: policy.expression});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
