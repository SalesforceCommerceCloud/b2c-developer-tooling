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

type WAFRulePackage = CdnZonesComponents['schemas']['WAFRulePackage'];
type WafPackagePatchRequest = CdnZonesComponents['schemas']['WafPackagePatchRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  package: WAFRulePackage;
}

/**
 * Command to update OWASP ModSecurity package settings for a zone.
 * Note: This is for WAF v1. For zones created after 24.5, use waf rulesets commands.
 */
export default class EcdnWafOwaspUpdate extends EcdnZoneCommand<typeof EcdnWafOwaspUpdate> {
  static description = withDocs(
    t(
      'commands.ecdn.waf.owasp.update.description',
      'Update OWASP ModSecurity package settings for a zone (not applicable for WAFv2 zones)',
    ),
    '/cli/ecdn.html#b2c-ecdn-waf-owasp-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --sensitivity medium --action-mode block',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --sensitivity high --action-mode challenge',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --sensitivity off',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    sensitivity: Flags.string({
      description: t('flags.sensitivity.description', 'Sensitivity level (low, medium, high, off)'),
      options: ['low', 'medium', 'high', 'off'],
      required: true,
    }),
    'action-mode': Flags.string({
      description: t('flags.actionMode.description', 'Action mode (simulate, challenge, block)'),
      options: ['simulate', 'challenge', 'block'],
      required: true,
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.owasp.update.updating', 'Updating OWASP package settings...'));
    }

    const body: WafPackagePatchRequest = {
      sensitivity: this.flags.sensitivity as WafPackagePatchRequest['sensitivity'],
      action_mode: this.flags['action-mode'] as WafPackagePatchRequest['action_mode'],
    };

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/firewall/waf/packages/owasp',
      {
        params: {
          path: {organizationId, zoneId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.waf.owasp.update.error', 'Failed to update OWASP package settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const pkg = data?.data;
    if (!pkg) {
      this.error(t('commands.ecdn.waf.owasp.update.noData', 'No OWASP package data returned from API'));
    }

    const output: UpdateOutput = {package: pkg};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: t('commands.ecdn.waf.owasp.update.success', 'OWASP package updated successfully!')});
    ui.div('');
    ui.div({text: 'ID:', width: labelWidth}, {text: pkg.id});
    ui.div({text: 'Name:', width: labelWidth}, {text: pkg.name});
    ui.div({text: 'Sensitivity:', width: labelWidth}, {text: pkg.sensitivity});
    ui.div({text: 'Action Mode:', width: labelWidth}, {text: pkg.action_mode});

    ux.stdout(ui.toString());

    return output;
  }
}
