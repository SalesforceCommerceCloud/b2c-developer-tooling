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
type MRTRulesPostRequest = CdnZonesComponents['schemas']['MRTRulesPostRequest'];

/**
 * Response type for the create command.
 */
interface CreateOutput {
  ruleset: MRTRulesResponse['ruleset'];
}

/**
 * Command to create MRT rules for a zone.
 */
export default class EcdnMrtRulesCreate extends EcdnZoneCommand<typeof EcdnMrtRulesCreate> {
  static description = withDocs(
    t(
      'commands.ecdn.mrt-rules.create.description',
      'Create MRT rules to route requests to a Managed Runtime environment',
    ),
    '/cli/ecdn.html#b2c-ecdn-mrt-rules-create',
  );

  static enableJsonFlag = true;

  static examples = [
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --mrt-hostname customer-pwa.mobify-storefront.com --expressions '(http.host eq "example.com")'`,
    `<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --mrt-hostname customer-pwa.mobify-storefront.com --expressions '(http.host eq "example.com")' --descriptions "Route to PWA"`,
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'mrt-hostname': Flags.string({
      description: t('flags.mrtHostname.description', 'Managed Runtime instance hostname'),
      required: true,
    }),
    expressions: Flags.string({
      description: t('flags.expressions.description', 'Comma-separated list of rule expressions'),
      required: true,
    }),
    descriptions: Flags.string({
      description: t(
        'flags.descriptions.description',
        'Comma-separated list of rule descriptions (must match expressions count)',
      ),
    }),
  };

  async run(): Promise<CreateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.mrt-rules.create.creating', 'Creating MRT rules...'));
    }

    const expressions = this.flags.expressions.split(',').map((e) => e.trim());
    const body: MRTRulesPostRequest = {
      mrtHostname: this.flags['mrt-hostname'],
      expressions,
    };

    if (this.flags.descriptions) {
      body.descriptions = this.flags.descriptions.split(',').map((d) => d.trim());
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.POST('/organizations/{organizationId}/zones/{zoneId}/mrtrules', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.mrt-rules.create.error', 'Failed to create MRT rules: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const ruleset = data?.data?.ruleset;
    if (!ruleset) {
      this.error(t('commands.ecdn.mrt-rules.create.noData', 'No MRT ruleset data returned from API'));
    }

    const output: CreateOutput = {ruleset};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 16;

    ui.div('');
    ui.div({text: t('commands.ecdn.mrt-rules.create.success', 'MRT rules created successfully!')});
    ui.div('');
    ui.div({text: 'Ruleset ID:', width: labelWidth}, {text: ruleset.id});
    ui.div({text: 'Name:', width: labelWidth}, {text: ruleset.name});
    ui.div({text: 'Rules Count:', width: labelWidth}, {text: String(ruleset.rules.length)});

    ux.stdout(ui.toString());

    return output;
  }
}
