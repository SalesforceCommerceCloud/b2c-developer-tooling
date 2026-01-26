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

type SecuritySetting = CdnZonesComponents['schemas']['SecuritySetting'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  settings: SecuritySetting;
}

/**
 * Command to update security settings for a zone.
 */
export default class EcdnSecurityUpdate extends EcdnZoneCommand<typeof EcdnSecurityUpdate> {
  static description = withDocs(
    t('commands.ecdn.security.update.description', 'Update security settings for a zone'),
    '/cli/ecdn.html#b2c-ecdn-security-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --security-level medium',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --always-use-https',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --tls13 --waf',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'security-level': Flags.string({
      description: t('flags.securityLevel.description', 'Security level for the zone'),
      options: ['off', 'essentially_off', 'low', 'medium', 'high', 'under_attack'],
    }),
    'always-use-https': Flags.boolean({
      description: t('flags.alwaysUseHttps.description', 'Redirect all HTTP requests to HTTPS'),
      allowNo: true,
    }),
    tls13: Flags.boolean({
      description: t('flags.tls13.description', 'Enable TLS 1.3'),
      allowNo: true,
    }),
    waf: Flags.boolean({
      description: t('flags.waf.description', 'Enable WAF (OWASP) protection'),
      allowNo: true,
    }),
    'hsts-enabled': Flags.boolean({
      description: t('flags.hstsEnabled.description', 'Enable HSTS'),
      allowNo: true,
    }),
    'hsts-include-subdomains': Flags.boolean({
      description: t('flags.hstsIncludeSubdomains.description', 'Include subdomains in HSTS'),
      allowNo: true,
    }),
    'hsts-max-age': Flags.integer({
      description: t('flags.hstsMaxAge.description', 'HSTS max age in seconds'),
    }),
    'hsts-preload': Flags.boolean({
      description: t('flags.hstsPreload.description', 'Enable HSTS preload'),
      allowNo: true,
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    // Build the request body from flags
    const body: SecuritySetting = {
      alwaysUseHttps: this.flags['always-use-https'] ?? false,
    };

    if (this.flags['security-level']) {
      body.securityLevel = this.flags['security-level'] as SecuritySetting['securityLevel'];
    }

    if (this.flags.tls13 !== undefined) {
      body.tls13Enabled = this.flags.tls13;
    }

    if (this.flags.waf !== undefined) {
      body.wafEnabled = this.flags.waf;
    }

    // Build HSTS settings if any HSTS flags are provided
    const hasHstsFlags =
      this.flags['hsts-enabled'] !== undefined ||
      this.flags['hsts-include-subdomains'] !== undefined ||
      this.flags['hsts-max-age'] !== undefined ||
      this.flags['hsts-preload'] !== undefined;

    if (hasHstsFlags) {
      body.hsts = {};
      if (this.flags['hsts-enabled'] !== undefined) {
        body.hsts.enabled = this.flags['hsts-enabled'];
      }
      if (this.flags['hsts-include-subdomains'] !== undefined) {
        body.hsts.includeSubdomains = this.flags['hsts-include-subdomains'];
      }
      if (this.flags['hsts-max-age'] !== undefined) {
        body.hsts.maxAge = this.flags['hsts-max-age'];
      }
      if (this.flags['hsts-preload'] !== undefined) {
        body.hsts.preload = this.flags['hsts-preload'];
      }
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.security.update.updating', 'Updating security settings...'));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH('/organizations/{organizationId}/zones/{zoneId}/security-settings', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.security.update.error', 'Failed to update security settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const settings = data?.data;
    if (!settings) {
      this.error(t('commands.ecdn.security.update.noData', 'No security settings returned from API'));
    }

    const output: UpdateOutput = {settings};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 20;

    ui.div('');
    ui.div({text: t('commands.ecdn.security.update.success', 'Security settings updated successfully!')});
    ui.div('');
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
