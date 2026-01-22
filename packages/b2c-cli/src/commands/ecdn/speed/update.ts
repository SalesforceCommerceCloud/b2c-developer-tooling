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

type SpeedSetting = CdnZonesComponents['schemas']['SpeedSetting'];

/**
 * Response type for the update command.
 */
interface UpdateOutput {
  settings: SpeedSetting;
}

/**
 * Command to update speed settings for a zone.
 */
export default class EcdnSpeedUpdate extends EcdnZoneCommand<typeof EcdnSpeedUpdate> {
  static description = t('commands.ecdn.speed.update.description', 'Update speed/performance settings for a zone');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --brotli on',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --http3 on --early-hints on',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --polish lossy --webp on',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
    brotli: Flags.string({
      description: t('flags.brotli.description', 'Brotli compression (on/off)'),
      options: ['on', 'off'],
    }),
    'http2-prioritization': Flags.string({
      description: t('flags.http2Prioritization.description', 'HTTP/2 prioritization (on/off)'),
      options: ['on', 'off'],
    }),
    'http2-to-origin': Flags.string({
      description: t('flags.http2ToOrigin.description', 'HTTP/2 to origin (on/off)'),
      options: ['on', 'off'],
    }),
    http3: Flags.string({
      description: t('flags.http3.description', 'HTTP/3 (on/off)'),
      options: ['on', 'off'],
    }),
    'early-hints': Flags.string({
      description: t('flags.earlyHints.description', 'Early hints (on/off)'),
      options: ['on', 'off'],
    }),
    webp: Flags.string({
      description: t('flags.webp.description', 'WebP image format support (on/off)'),
      options: ['on', 'off'],
    }),
    polish: Flags.string({
      description: t('flags.polish.description', 'Image polish level (off/lossless/lossy)'),
      options: ['off', 'lossless', 'lossy'],
    }),
  };

  async run(): Promise<UpdateOutput> {
    this.requireOAuthCredentials();

    const zoneId = await this.resolveZoneId();

    // Build the request body from flags - all fields are required
    const body: SpeedSetting = {
      brotliCompression: (this.flags.brotli as 'off' | 'on') ?? 'off',
      http2Prioritization: (this.flags['http2-prioritization'] as 'off' | 'on') ?? 'off',
      http2ToOrigin: (this.flags['http2-to-origin'] as 'off' | 'on') ?? 'off',
      http3: (this.flags.http3 as 'off' | 'on') ?? 'off',
      earlyHints: (this.flags['early-hints'] as 'off' | 'on') ?? 'off',
      webp: (this.flags.webp as 'off' | 'on') ?? 'off',
      polish: (this.flags.polish as 'lossless' | 'lossy' | 'off') ?? 'off',
    };

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.speed.update.updating', 'Updating speed settings...'));
    }

    const client = this.getCdnZonesRwClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.PATCH('/organizations/{organizationId}/zones/{zoneId}/speed-settings', {
      params: {
        path: {organizationId, zoneId},
      },
      body,
    });

    if (error) {
      this.error(
        t('commands.ecdn.speed.update.error', 'Failed to update speed settings: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const settings = data?.data;
    if (!settings) {
      this.error(t('commands.ecdn.speed.update.noData', 'No speed settings returned from API'));
    }

    const output: UpdateOutput = {settings};

    if (this.jsonEnabled()) {
      return output;
    }

    const ui = cliui({width: process.stdout.columns || 80});
    const labelWidth = 22;

    ui.div('');
    ui.div({text: t('commands.ecdn.speed.update.success', 'Speed settings updated successfully!')});
    ui.div('');
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
