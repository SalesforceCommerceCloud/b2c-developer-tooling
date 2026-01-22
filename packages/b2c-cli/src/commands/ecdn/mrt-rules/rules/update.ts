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

type MRTRulesResponse = CdnZonesComponents['schemas']['MRTRulesResponse'];
type MRTRulePatchRequest = CdnZonesComponents['schemas']['MRTRulePatchRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  ruleset: MRTRulesResponse['ruleset'];
}

/**
 * Command to update an individual MRT rule.
 */
export default class EcdnMrtRulesRulesUpdate extends EcdnZoneCommand<typeof EcdnMrtRulesRulesUpdate> {
  static description = t('commands.ecdn.mrt-rules.rules.update.description', 'Update an individual MRT rule');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --rule-id def456 --enabled',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --rule-id def456 --no-enabled',
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --rule-id def456 --expression '(http.host eq "new.example.com")'`,
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'ruleset-id': Flags.string({
      description: t('flags.rulesetId.description', 'MRT ruleset ID'),
      required: true,
    }),
    'rule-id': Flags.string({
      description: t('flags.ruleId.description', 'MRT rule ID to update'),
      required: true,
    }),
    enabled: Flags.boolean({
      description: t('flags.enabled.description', 'Enable or disable the rule'),
      allowNo: true,
    }),
    expression: Flags.string({
      description: t('flags.expression.description', 'Rule expression'),
    }),
    description: Flags.string({
      description: t('flags.description.description', 'Rule description'),
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();
    const rulesetId = this.flags['ruleset-id'];
    const ruleId = this.flags['rule-id'];

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mrt-rules.rules.update.updating', 'Updating MRT rule {{id}}...', {id: ruleId}));
    }

    const body: MRTRulePatchRequest = {};

    if (this.flags.enabled !== undefined) {
      body.enabled = this.flags.enabled;
    }
    if (this.flags.expression) {
      body.expression = this.flags.expression;
    }
    if (this.flags.description !== undefined) {
      body.description = this.flags.description;
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH(
      '/organizations/{organizationId}/zones/{zoneId}/mrtrules/{rulesetId}/rules/{ruleId}',
      {
        params: {
          path: {organizationId, zoneId, rulesetId, ruleId},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.mrt-rules.rules.update.error', 'Failed to update MRT rule: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const ruleset = data?.data?.ruleset;
    if (!ruleset) {
      this.error(t('commands.ecdn.mrt-rules.rules.update.noData', 'No MRT ruleset data returned from API'));
    }

    const output: UpdateOutput = {ruleset};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});

    ui.div('');
    ui.div({text: t('commands.ecdn.mrt-rules.rules.update.success', 'MRT rule updated successfully!')});

    ux.stdout(ui.toString());

    return output;
  }
}
