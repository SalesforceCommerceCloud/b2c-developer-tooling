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

type WAFManagedRule = CdnZonesComponents['schemas']['WAFManagedRule'];
type WAFManagedRuleRequest = CdnZonesComponents['schemas']['WAFManagedRuleRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  rule: WAFManagedRule;
}

/**
 * Command to update a WAF v2 managed rule within a ruleset.
 */
export default class EcdnWafManagedRulesUpdate extends EcdnZoneCommand<typeof EcdnWafManagedRulesUpdate> {
  static description = t(
    'commands.ecdn.waf.managed-rules.update.description',
    'Update a WAF v2 managed rule in a ruleset',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --rule-id def456 --enabled',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --rule-id def456 --action block',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --rule-id def456 --no-enabled',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'ruleset-id': Flags.string({
      description: t('flags.rulesetId.description', 'WAF ruleset ID containing the rule'),
      required: true,
    }),
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'WAF managed rule ID to update'),
      required: true,
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Enable the rule'),
      allowNo: true,
    }),
    action: Flags.string({
      description: t('flags.action.description', 'Action for the rule (e.g., default, block, challenge)'),
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const rulesetId = this.flags['ruleset-id'];
    const ruleId = this.flags['rule-id'];

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.ecdn.waf.managed-rules.update.updating', 'Updating WAF managed rule {{id}}...', {id: ruleId}),
      );
    }

    const body: WAFManagedRuleRequest = {};

    if (this.flags.enabled !== undefined) {
      body.enabled = this.flags.enabled;
    }
    if (this.flags.action) {
      body.action = this.flags.action;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/firewall-managed/rulesets/{rulesetId}/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, rulesetId, ruleId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.waf.managed-rules.update.error', 'Failed to update WAF managed rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const rule = data?.data;
    if (!rule) {
      this.error(t('commands.ecdn.waf.managed-rules.update.noData', 'No WAF managed rule data returned from API'));
    }

    const output: UpdateOutput = {rule};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: t('commands.ecdn.waf.managed-rules.update.success', 'WAF managed rule updated successfully!')});
    ui.div('');
    ui.div({text: 'Rule ID:', width: labelWidth}, {text: rule.ruleId || '-'});
    ui.div({text: 'Description:', width: labelWidth}, {text: rule.description || '-'});
    ui.div({text: 'Action:', width: labelWidth}, {text: rule.action || '-'});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: rule.enabled ? 'yes' : 'no'});

    if (rule.score !== undefined) {
      ui.div({text: 'Score:', width: labelWidth}, {text: String(rule.score)});
    }
    if (rule.categories && rule.categories.length > 0) {
      ui.div({text: 'Categories:', width: labelWidth}, {text: rule.categories.join(', ')});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
