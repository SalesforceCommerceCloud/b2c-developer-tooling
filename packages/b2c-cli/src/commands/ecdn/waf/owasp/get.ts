/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../../i18n/index.js';

type WAFRulePackage = CdnZonesComponents['schemas']['WAFRulePackage'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  package: WAFRulePackage;
}

/**
 * Command to get OWASP ModSecurity package settings for a zone.
 * Note: This is for WAF v1. For zones created after 24.5, use waf rulesets commands.
 */
export default class EcdnWafOwaspGet extends EcdnZoneCommand<typeof EcdnWafOwaspGet> {
  static description = withDocs(
    t(
      'commands.ecdn.waf.owasp.get.description',
      'Get OWASP ModSecurity package settings for a zone (not applicable for WAFv2 zones)',
    ),
    '/cli/ecdn.html#b2c-ecdn-waf-owasp-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
  };

  async run(): Promise<GetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.waf.owasp.get.fetching', 'Fetching OWASP package settings...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/zones/{zoneId}/firewall/waf/packages/owasp',
      {
        params: {
          path: {organizationId, zoneId},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.waf.owasp.get.error', 'Failed to fetch OWASP package settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const pkg = data?.data;
    if (!pkg) {
      this.error(t('commands.ecdn.waf.owasp.get.noData', 'No OWASP package data returned from API'));
    }

    const output: GetOutput = {package: pkg};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: 'OWASP Package:', padding: [0, 0, 1, 0]});
    ui.div({text: 'ID:', width: labelWidth}, {text: pkg.id});
    ui.div({text: 'Name:', width: labelWidth}, {text: pkg.name});
    ui.div({text: 'Description:', width: labelWidth}, {text: pkg.description});
    ui.div({text: 'Detection Mode:', width: labelWidth}, {text: pkg.detection_mode});
    ui.div({text: 'Sensitivity:', width: labelWidth}, {text: pkg.sensitivity});
    ui.div({text: 'Action Mode:', width: labelWidth}, {text: pkg.action_mode});

    ux.stdout(ui.toString());

    return output;
  }
}
