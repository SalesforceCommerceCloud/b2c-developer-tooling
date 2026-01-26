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

type CipherSuitesResponse = CdnZonesComponents['schemas']['CipherSuitesResponse'];
type CipherSuitesRequest = CdnZonesComponents['schemas']['CipherSuitesRequest'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  cipherSuites: CipherSuitesResponse;
}

/**
 * Command to update cipher suites settings for a zone.
 */
export default class EcdnCipherSuitesUpdate extends EcdnZoneCommand<typeof EcdnCipherSuitesUpdate> {
  static description = withDocs(
    t('commands.ecdn.cipher-suites.update.description', 'Update cipher suites settings for a zone'),
    '/cli/ecdn.html#b2c-ecdn-cipher-suites-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --suite-type Modern',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --suite-type Custom --ciphers "ECDHE-ECDSA-AES128-GCM-SHA256,ECDHE-RSA-AES128-GCM-SHA256"',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'suite-type': Flags.string({
      description: t('flags.suiteType.description', 'Cipher suite type'),
      options: ['Compatible', 'Modern', 'Custom', 'Legacy'],
      required: true,
    }),
    ciphers: Flags.string({
      description: t('flags.ciphers.description', 'Comma-separated list of ciphers (required for Custom suite type)'),
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.cipher-suites.update.updating', 'Updating cipher suites settings...'));
    }

    const body: CipherSuitesRequest = {
      cipherSuiteType: this.flags['suite-type'] as CipherSuitesRequest['cipherSuiteType'],
    };

    if (this.flags.ciphers) {
      body.ciphers = this.flags.ciphers.split(',').map((c) => c.trim());
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH('/organizations/{organizationId}/zones/{zoneId}/settings/ciphers', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.cipher-suites.update.error', 'Failed to update cipher suites settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const cipherSuites = data?.data;
    if (!cipherSuites) {
      this.error(t('commands.ecdn.cipher-suites.update.noData', 'No cipher suites data returned from API'));
    }

    const output: UpdateOutput = {cipherSuites};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: t('commands.ecdn.cipher-suites.update.success', 'Cipher suites updated successfully!')});
    ui.div('');
    ui.div({text: 'Suite Type:', width: labelWidth}, {text: cipherSuites.cipherSuiteType});

    if (cipherSuites.ciphers.length > 0) {
      ui.div('');
      ui.div({text: 'Ciphers:', padding: [0, 0, 0, 0]});
      for (const cipher of cipherSuites.ciphers) {
        ui.div({text: `  ${cipher}`});
      }
    }

    ux.stdout(ui.toString());

    return output;
  }
}
