/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

type OriginHeaderModification = CdnZonesComponents['schemas']['OriginHeaderModification'];
type OriginHeaderModificationPutRequest = CdnZonesComponents['schemas']['OriginHeaderModificationPutRequest'];

/**
 * Response type for the set command.
 */
interface SetOutput {
  header: OriginHeaderModification;
}

/**
 * Command to set (create/update) origin header modification for a zone.
 */
export default class EcdnOriginHeadersSet extends EcdnZoneCommand<typeof EcdnOriginHeadersSet> {
  static description = t(
    'commands.ecdn.origin-headers.set.description',
    'Set origin header modification for a zone (MRT type)',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --header-value my-secret-value',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --header-value my-secret-value --header-name x-custom-header',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    'header-value': Flags.string({
      description: t('flags.headerValue.description', 'Value of the header to forward to origin'),
      required: true,
    }),
    'header-name': Flags.string({
      description: t('flags.headerName.description', 'Name of the header (cannot be changed for MRT origin)'),
    }),
  };

  async run(): Promise<SetOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.origin-headers.set.setting', 'Setting origin header modification...'));
    }

    const body: OriginHeaderModificationPutRequest = {
      headerValue: this.flags['header-value'],
    };

    if (this.flags['header-name']) {
      body.headerName = this.flags['header-name'];
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();
    const type = 'mrt'; // Only mrt type is supported

    const {data, error} = await client.PUT(
      '/organizations/{organizationId}/zones/{zoneId}/origin-header-modification/{type}',
      {
        params: {
          path: {organizationId, zoneId, type},
        },
        body,
      },
    );

    if (error) {
      this.error(
        t('commands.ecdn.origin-headers.set.error', 'Failed to set origin header modification: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const header = data?.data;
    if (!header) {
      this.error(t('commands.ecdn.origin-headers.set.noData', 'No origin header data returned from API'));
    }

    const output: SetOutput = {header};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 18;

    ui.div('');
    ui.div({text: t('commands.ecdn.origin-headers.set.success', 'Origin header modification set successfully!')});
    ui.div('');
    ui.div({text: 'Header Name:', width: labelWidth}, {text: header.headerName});
    ui.div({text: 'Header Value:', width: labelWidth}, {text: header.headerValue});
    ui.div({text: 'Last Updated:', width: labelWidth}, {text: header.lastUpdated});

    ux.stdout(ui.toString());

    return output;
  }
}
