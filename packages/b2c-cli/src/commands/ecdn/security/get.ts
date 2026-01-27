/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type SecuritySetting = CdnZonesComponents['schemas']['SecuritySetting'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  settings: SecuritySetting;
}

/**
 * Command to get security settings for a zone.
 */
export default class EcdnSecurityGet extends EcdnZoneCommand<typeof EcdnSecurityGet> {
  static description = withDocs(
    t('commands.ecdn.security.get.description', 'Get security settings for a zone'),
    '/cli/ecdn.html#b2c-ecdn-security-get',
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
      this.log(t('commands.ecdn.security.get.fetching', 'Fetching security settings...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/security-settings', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.security.get.error', 'Failed to fetch security settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const settings = data?.data;
    if (!settings) {
      this.error(t('commands.ecdn.security.get.noData', 'No security settings returned from API'));
    }

    const output: GetOutput = {settings};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 20;

    ui.div('');
    ui.div({text: 'Security Settings:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Security Level:', width: labelWidth}, {text: settings.securityLevel ?? '-'});
    ui.div({text: 'Always Use HTTPS:', width: labelWidth}, {text: settings.alwaysUseHttps ? 'enabled' : 'disabled'});
    ui.div({text: 'TLS 1.3:', width: labelWidth}, {text: settings.tls13Enabled ? 'enabled' : 'disabled'});
    ui.div({text: 'WAF (OWASP):', width: labelWidth}, {text: settings.wafEnabled ? 'enabled' : 'disabled'});

    if (settings.hsts) {
      ui.div('');
      ui.div({text: 'HSTS Settings:', padding: [0, 0, 0, 2]});
      ui.div(
        {text: 'Enabled:', width: labelWidth, padding: [0, 0, 0, 2]},
        {text: settings.hsts.enabled ? 'yes' : 'no'},
      );
      ui.div(
        {text: 'Include Subdomains:', width: labelWidth, padding: [0, 0, 0, 2]},
        {text: settings.hsts.includeSubdomains ? 'yes' : 'no'},
      );
      ui.div(
        {text: 'Max Age:', width: labelWidth, padding: [0, 0, 0, 2]},
        {text: `${settings.hsts.maxAge ?? '-'} seconds`},
      );
      ui.div(
        {text: 'Preload:', width: labelWidth, padding: [0, 0, 0, 2]},
        {text: settings.hsts.preload ? 'yes' : 'no'},
      );
    }

    ux.stdout(ui.toString());

    return output;
  }
}
