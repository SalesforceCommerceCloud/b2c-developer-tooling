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

type PageShieldPolicyResponse = CdnZonesComponents['schemas']['PageShieldPolicyResponse'];
type PageShieldPolicyRequest = CdnZonesComponents['schemas']['PageShieldPolicyRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  policy: PageShieldPolicyResponse;
}

/**
 * Command to update a Page Shield policy for a zone.
 */
export default class EcdnPageShieldPoliciesUpdate extends EcdnZoneCommand<typeof EcdnPageShieldPoliciesUpdate> {
  static description = withDocs(
    t('commands.ecdn.page-shield.policies.update.description', 'Update a Page Shield policy'),
    '/cli/ecdn.html#b2c-ecdn-page-shield-policies-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --policy-id policy_123 --enabled',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --policy-id policy_123 --action log',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --policy-id policy_123 --no-enabled',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'policy-id': Flags.string({
      description: t('flags.policyId.description', 'Page Shield policy ID to update'),
      required: true,
    }),
    action: Flags.string({
      description: t('flags.action.description', 'Action for the policy'),
      options: ['allow', 'log'],
    }),
    value: Flags.string({
      description: t('flags.value.description', 'Policy value (e.g., script-src)'),
    }),
    expression: Flags.string({
      description: t('flags.expression.description', 'Policy expression'),
    }),
    description: Flags.string({
      description: t('flags.description.description', 'Policy description'),
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Enable or disable the policy'),
      allowNo: true,
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const policyId = this.flags['policy-id'];

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.page-shield.policies.update.updating', 'Updating Page Shield policy {{id}}...', {
          id: policyId,
        }),
      );
    }

    const body: PageShieldPolicyRequest = {};

    if (this.flags.action) {
      body.action = this.flags.action as PageShieldPolicyRequest['action'];
    }
    if (this.flags.value) {
      body.value = this.flags.value;
    }
    if (this.flags.expression !== undefined) {
      body.expression = this.flags.expression;
    }
    if (this.flags.description !== undefined) {
      body.description = this.flags.description;
    }
    if (this.flags.enabled !== undefined) {
      body.enabled = this.flags.enabled;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PUT(
      '/organizations/{organizationId}/zones/{zoneId}/page-shield/policies/{policyId}',
      {
        params: {
          path: {organizationId, zoneId, policyId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.policies.update.error', 'Failed to update Page Shield policy: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const policy = data?.data;
    if (!policy) {
      this.error(t('commands.ecdn.page-shield.policies.update.noData', 'No policy data returned from API'));
    }

    const output: UpdateOutput = {policy};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: t('commands.ecdn.page-shield.policies.update.success', 'Page Shield policy updated!')});
    ui.div('');
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
