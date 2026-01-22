/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

type SpeedSetting = CdnZonesComponents['schemas']['SpeedSetting'];

/**
 * Response type for the get command.
 */
interface GetOutput {
  settings: SpeedSetting;
}

/**
 * Command to get speed settings for a zone.
 */
export default class EcdnSpeedGet extends EcdnZoneCommand<typeof EcdnSpeedGet> {
  static description = t('commands.ecdn.speed.get.description', 'Get speed/performance settings for a zone');

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
      this.log(t('commands.ecdn.speed.get.fetching', 'Fetching speed settings...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/speed-settings', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.speed.get.error', 'Failed to fetch speed settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const settings = data?.data;
    if (!settings) {
      this.error(t('commands.ecdn.speed.get.noData', 'No speed settings returned from API'));
    }

    const output: GetOutput = {settings};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 22;

    ui.div('');
    ui.div({text: 'Speed Settings:', padding: [0, 0, 1, 0]});
    ui.div({text: 'Brotli Compression:', width: labelWidth}, {text: settings.brotliCompression});
    ui.div({text: 'HTTP/2 Prioritization:', width: labelWidth}, {text: settings.http2Prioritization});
    ui.div({text: 'HTTP/2 to Origin:', width: labelWidth}, {text: settings.http2ToOrigin});
    ui.div({text: 'HTTP/3:', width: labelWidth}, {text: settings.http3});
    ui.div({text: 'Early Hints:', width: labelWidth}, {text: settings.earlyHints});
    ui.div({text: 'WebP:', width: labelWidth}, {text: settings.webp});
    ui.div({text: 'Polish:', width: labelWidth}, {text: settings.polish});

    ux.stdout(ui.toString());

    return output;
  }
}
