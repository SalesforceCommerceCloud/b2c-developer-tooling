/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type MRTRulesResponse = CdnZonesComponents['schemas']['MRTRulesResponse'];
type MRTRulesetPatchRequest = CdnZonesComponents['schemas']['MRTRulesetPatchRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  ruleset: MRTRulesResponse['ruleset'];
}

/**
 * Command to update an MRT ruleset for a zone.
 */
export default class EcdnMrtRulesUpdate extends EcdnZoneCommand<typeof EcdnMrtRulesUpdate> {
  static description = withDocs(
    t('commands.ecdn.mrt-rules.update.description', 'Update MRT ruleset hostname or add new rules'),
    '/cli/ecdn.html#b2c-ecdn-mrt-rules-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --mrt-hostname new-customer-pwa.mobify-storefront.com',
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --mrt-hostname customer-pwa.mobify-storefront.com --expressions '(http.host eq "new.example.com")'`,
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'mrt-hostname': Flags.string({
      description: t('flags.mrtHostname.description', 'New Managed Runtime instance hostname'),
      required: true,
    }),
    'old-mrt-hostname': Flags.string({
      description: t('flags.oldMrtHostname.description', 'Current MRT hostname (required when changing hostname)'),
    }),
    expressions: Flags.string({
      description: t('flags.expressions.description', 'Comma-separated list of new rule expressions to add'),
    }),
    descriptions: Flags.string({
      description: t(
        'flags.descriptions.description',
        'Comma-separated list of descriptions for new rules (must match expressions count)',
      ),
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mrt-rules.update.updating', 'Updating MRT ruleset...'));
    }

    const body: MRTRulesetPatchRequest = {
      mrtHostname: this.flags['mrt-hostname'],
    };

    if (this.flags['old-mrt-hostname']) {
      body.oldMrtHostname = this.flags['old-mrt-hostname'];
    }
    if (this.flags.expressions) {
      body.expressions = this.flags.expressions.split(',').map((e) => e.trim());
    }
    if (this.flags.descriptions) {
      body.descriptions = this.flags.descriptions.split(',').map((d) => d.trim());
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH('/organizations/{organizationId}/zones/{zoneId}/mrtrules', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.mrt-rules.update.error', 'Failed to update MRT ruleset: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const ruleset = data?.data?.ruleset;
    if (!ruleset) {
      this.error(t('commands.ecdn.mrt-rules.update.noData', 'No MRT ruleset data returned from API'));
    }

    const output: UpdateOutput = {ruleset};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: t('commands.ecdn.mrt-rules.update.success', 'MRT ruleset updated successfully!')});
    ui.div('');
    ui.div({text: 'Ruleset ID:', width: labelWidth}, {text: ruleset.id});
    ui.div({text: 'Name:', width: labelWidth}, {text: ruleset.name});
    ui.div({text: 'Rules Count:', width: labelWidth}, {text: String(ruleset.rules.length)});

    ux.stdout(ui.toString());

    return output;
  }
}
