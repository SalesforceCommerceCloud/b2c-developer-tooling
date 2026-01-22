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
type PageShieldPolicyRequest = CdnZonesComponents['schemas']['PageShieldPolicyRequest'];

/**
 * Response type for the create command.
 */
interface CreateOutput {
  policy: PageShieldPolicyResponse;
}

/**
 * Command to create a Page Shield policy for a zone.
 */
export default class EcdnPageShieldPoliciesCreate extends EcdnZoneCommand<typeof EcdnPageShieldPoliciesCreate> {
  static description = t(
    'commands.ecdn.page-shield.policies.create.description',
    'Create a Page Shield policy for a zone',
  );

  static enableJsonFlag = true;

  static examples = [
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --action allow --value script-src --expression 'http.request.uri.path contains "/trusted/"'`,
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --action log --value script-src --description "Log untrusted scripts"',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    action: Flags.string({
      description: t('flags.action.description', 'Action for the policy'),
      options: ['allow', 'log'],
      required: true,
    }),
    value: Flags.string({
      description: t('flags.value.description', 'Policy value (e.g., script-src)'),
      required: true,
    }),
    expression: Flags.string({
      description: t('flags.expression.description', 'Policy expression'),
    }),
    description: Flags.string({
      description: t('flags.description.description', 'Policy description'),
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Enable the policy'),
      default: true,
      allowNo: true,
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.page-shield.policies.create.creating', 'Creating Page Shield policy...'));
    }

    const body: PageShieldPolicyRequest = {
      action: this.flags.action as PageShieldPolicyRequest['action'],
      value: this.flags.value,
      enabled: this.flags.enabled,
    };

    if (this.flags.expression) {
      body.expression = this.flags.expression;
    }
    if (this.flags.description) {
      body.description = this.flags.description;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/page-shield/policies', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.policies.create.error', 'Failed to create Page Shield policy: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const policy = data?.data;
    if (!policy) {
      this.error(t('commands.ecdn.page-shield.policies.create.noData', 'No policy data returned from API'));
    }

    const output: CreateOutput = {policy};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: t('commands.ecdn.page-shield.policies.create.success', 'Page Shield policy created!')});
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
