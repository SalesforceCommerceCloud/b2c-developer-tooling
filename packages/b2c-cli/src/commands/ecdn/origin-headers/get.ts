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

type OriginHeaderModification = CdnZonesComponents['schemas']['OriginHeaderModification'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  header: OriginHeaderModification;
}

/**
 * Command to get origin header modification for a zone.
 */
export default class EcdnOriginHeadersGet extends EcdnZoneCommand<typeof EcdnOriginHeadersGet> {
  static description = withDocs(
    t('commands.ecdn.origin-headers.get.description', 'Get origin header modification settings for a zone (MRT type)'),
    '/cli/ecdn.html#b2c-ecdn-origin-headers-get',
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
      this.log(t('commands.ecdn.origin-headers.get.fetching', 'Fetching origin header modification...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();
    const type = 'mrt'; // Only mrt type is supported

    const {data, error} = await client.GET(
      '/organizations/{organizationId}/zones/{zoneId}/origin-header-modification/{type}',
      {
        params: {
          path: {organizationId, zoneId, type},
        },
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.origin-headers.get.error', 'Failed to fetch origin header modification: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const header = data?.data;
    if (!header) {
      this.error(t('commands.ecdn.origin-headers.get.noData', 'No origin header data returned from API'));
    }

    const output: GetOutput = {header};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: 'Origin Header Modification:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Header Name:', width: labelWidth}, {text: header.headerName});
    ui.div({text: 'Header Value:', width: labelWidth}, {text: header.headerValue});
    ui.div({text: 'Last Updated:', width: labelWidth}, {text: header.lastUpdated});

    ux.stdout(ui.toString());

    return output;
  }
}
