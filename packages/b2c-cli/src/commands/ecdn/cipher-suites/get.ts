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

type CipherSuitesResponse = CdnZonesComponents['schemas']['CipherSuitesResponse'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  cipherSuites: CipherSuitesResponse;
}

/**
 * Command to get cipher suites settings for a zone.
 */
export default class EcdnCipherSuitesGet extends EcdnZoneCommand<typeof EcdnCipherSuitesGet> {
  static description = withDocs(
    t('commands.ecdn.cipher-suites.get.description', 'Get cipher suites settings for a zone'),
    '/cli/ecdn.html#b2c-ecdn-cipher-suites-get',
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
      this.log(t('commands.ecdn.cipher-suites.get.fetching', 'Fetching cipher suites settings...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/settings/ciphers', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.cipher-suites.get.error', 'Failed to fetch cipher suites settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const cipherSuites = data?.data;
    if (!cipherSuites) {
      this.error(t('commands.ecdn.cipher-suites.get.noData', 'No cipher suites data returned from API'));
    }

    const output: GetOutput = {cipherSuites};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: 'Cipher Suites:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Suite Type:', width: labelWidth}, {text: cipherSuites.cipherSuiteType});
    ui.div('');
    ui.div({text: 'Ciphers:', padding: [0, 0, 0, 0]});

    for (const cipher of cipherSuites.ciphers) {
      ui.div({text: `  ${cipher}`});
    }

    ux.stdout(ui.toString());

    return output;
  }
}
