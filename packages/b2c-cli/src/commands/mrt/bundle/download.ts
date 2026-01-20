/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {downloadBundle, type DownloadBundleResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Get a presigned download URL for a bundle.
 */
export default class MrtBundleDownload extends MrtCommand<typeof MrtBundleDownload> {
  static args = {
    bundleId: Args.integer({
      description: 'Bundle ID to download',
      required: true,
    }),
  };

  static description = t(
    'commands.mrt.bundle.download.description',
    'Get a presigned download URL for a Managed Runtime bundle',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> 12345 --project my-storefront',
    '<%= config.bin %> <%= command.id %> 12345 -p my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<DownloadBundleResult> {
    this.requireMrtCredentials();

    const {bundleId} = this.args;
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    this.log(t('commands.mrt.bundle.download.fetching', 'Getting download URL for bundle {{bundleId}}...', {bundleId}));

    try {
      const result = await downloadBundle(
        {
          projectSlug: project,
          bundleId,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.bundle.download.success', 'Download URL (valid for 1 hour):\n{{downloadUrl}}', {
            downloadUrl: result.downloadUrl,
          }),
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.bundle.download.failed', 'Failed to get download URL: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
