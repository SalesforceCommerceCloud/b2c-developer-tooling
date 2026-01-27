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
 * Response type for the update command.
 */
interface UpdateOutput {
  rule: WafRule;
}

/**
 * Command to update a WAF rule for a zone.
 * Note: This is for WAF v1. For zones created after 24.5, use waf managed-rules commands.
 */
export default class EcdnWafRulesUpdate extends EcdnZoneCommand<typeof EcdnWafRulesUpdate> {
  static description = withDocs(
    t('commands.ecdn.waf.rules.update.description', 'Update a WAF v1 rule for a zone (not applicable for WAFv2 zones)'),
    '/cli/ecdn.html#b2c-ecdn-waf-rules-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id abc123 --action block',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --rule-id abc123 --action monitor',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'WAF rule ID to update'),
      required: true,
    }),
    action: Flags.string({
      description: t('flags.action.description', 'Action for the WAF rule'),
      options: ['block', 'challenge', 'monitor', 'disable', 'default'],
      required: true,
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const ruleId = this.flags['rule-id'];
    const action = this.flags.action as WafRule['action'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.rules.update.updating', 'Updating WAF rule {{id}}...', {id: ruleId}));
    }

    const body: WafRule = {action};

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PUT('/organizations/{organizationId}/zones/{zoneId}/waf/rules/{ruleId}', {
      params: {
        path: {organizationId, zoneId, ruleId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.waf.rules.update.error', 'Failed to update WAF rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.waf.rules.update.noData', 'No WAF rule data returned from API'));
    }

    const output: UpdateOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: t('commands.ecdn.waf.rules.update.success', 'WAF rule updated successfully!')});
    ui.div('');
    ui.div({text: 'Rule ID:', width: labelWidth}, {text: rule.ruleId || '-'});
    ui.div({text: 'Group ID:', width: labelWidth}, {text: rule.groupId || '-'});
    ui.div({text: 'Description:', width: labelWidth}, {text: rule.description || '-'});
    ui.div({text: 'Action:', width: labelWidth}, {text: rule.action || '-'});
    ui.div({text: 'Default Action:', width: labelWidth}, {text: rule.defaultAction || '-'});

    ux.stdout(ui.toString());

    return output;
  }
}
