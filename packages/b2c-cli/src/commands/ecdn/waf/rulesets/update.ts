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

type WAFManagedRuleset = CdnZonesComponents['schemas']['WAFManagedRuleset'];
type WAFManagedRulesetRequest = CdnZonesComponents['schemas']['WAFManagedRulesetRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  ruleset: WAFManagedRuleset;
}

/**
 * Command to update a WAF v2 managed ruleset for a zone.
 */
export default class EcdnWafRulesetsUpdate extends EcdnZoneCommand<typeof EcdnWafRulesetsUpdate> {
  static description = withDocs(
    t('commands.ecdn.waf.rulesets.update.description', 'Update a WAF v2 managed ruleset for a zone'),
    '/cli/ecdn.html#b2c-ecdn-waf-rulesets-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --enabled',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --action block',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --paranoia-level 2',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'ruleset-id': Flags.string({
      description: t('flags.rulesetId.description', 'WAF ruleset ID to update'),
      required: true,
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Enable the ruleset'),
      allowNo: true,
    }),
    action: Flags.string({
      description: t('flags.action.description', 'Action for the ruleset (e.g., default, block, challenge)'),
    }),
    'anomaly-score': Flags.string({
      description: t('flags.anomalyScore.description', 'Anomaly score threshold (for OWASP ruleset)'),
    }),
    'paranoia-level': Flags.integer({
      description: t('flags.paranoiaLevel.description', 'Paranoia level 1-4 (for OWASP ruleset)'),
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const rulesetId = this.flags['ruleset-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.rulesets.update.updating', 'Updating WAF ruleset {{id}}...', {id: rulesetId}));
    }

    const body: WAFManagedRulesetRequest = {};

    if (this.flags.enabled !== undefined) {
      body.enabled = this.flags.enabled;
    }
    if (this.flags.action) {
      body.action = this.flags.action;
    }
    if (this.flags['anomaly-score']) {
      body.anomalyScore = this.flags['anomaly-score'];
    }
    if (this.flags['paranoia-level'] !== undefined) {
      body.paranoiaLevel = this.flags['paranoia-level'];
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/firewall-managed/rulesets/{rulesetId}',
      {
        params: {
          path: {organizationId, zoneId, rulesetId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.waf.rulesets.update.error', 'Failed to update WAF ruleset: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const ruleset = data?.data;
    if (!ruleset) {
      this.error(t('commands.ecdn.waf.rulesets.update.noData', 'No WAF ruleset data returned from API'));
    }

    const output: UpdateOutput = {ruleset};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: t('commands.ecdn.waf.rulesets.update.success', 'WAF ruleset updated successfully!')});
    ui.div('');
    ui.div({text: 'Ruleset ID:', width: labelWidth}, {text: ruleset.rulesetId});
    ui.div({text: 'Name:', width: labelWidth}, {text: ruleset.name});
    ui.div({text: 'Enabled:', width: labelWidth}, {text: ruleset.enabled ? 'yes' : 'no'});
    ui.div({text: 'Action:', width: labelWidth}, {text: ruleset.action});

    if (ruleset.paranoiaLevel !== undefined) {
      ui.div({text: 'Paranoia Level:', width: labelWidth}, {text: String(ruleset.paranoiaLevel)});
    }
    if (ruleset.anomalyScore) {
      ui.div({text: 'Anomaly Score:', width: labelWidth}, {text: ruleset.anomalyScore});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
