/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createWriteStream, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {downloadBundle, type DownloadBundleResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

type BundleDownloadResult = DownloadBundleResult & {filePath?: string};

/**
 * Download a bundle artifact from Managed Runtime.
 */
export default class MrtBundleDownload extends MrtCommand<typeof MrtBundleDownload> {
  static args = {
    bundleId: Args.integer({
      description: 'Bundle ID to download',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.bundle.download.description', 'Download a Managed Runtime bundle artifact'),
    '/cli/mrt.html#b2c-mrt-bundle-download',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> 12345 --project my-storefront',
    '<%= config.bin %> <%= command.id %> 12345 -p my-storefront -o ./artifacts/my-bundle.tgz',
    '<%= config.bin %> <%= command.id %> 12345 -p my-storefront --url-only',
    '<%= config.bin %> <%= command.id %> 12345 -p my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      description: 'Output file path (default: bundle-{bundleId}.tgz)',
    }),
    'url-only': Flags.boolean({
      description: 'Only output the download URL without downloading',
      default: false,
    }),
  };

  async run(): Promise<BundleDownloadResult> {
    this.requireMrtCredentials();

    const {bundleId} = this.args;
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const urlOnly = this.flags['url-only'];

    this.log(
      t('commands.mrt.bundle.download.fetching', 'Fetching download URL for bundle {{bundleId}} from {{project}}...', {
        bundleId,
        project,
      }),
    );

    try {
      const result = await downloadBundle(
        {
          projectSlug: project,
          bundleId,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      // If url-only flag or JSON mode, just return the URL
      if (urlOnly) {
        if (!this.jsonEnabled()) {
          this.log(
            t('commands.mrt.bundle.download.urlOnly', 'Download URL (valid for 1 hour):\n{{downloadUrl}}', {
              downloadUrl: result.downloadUrl,
            }),
          );
        }
        return result;
      }

      // Download the file
      const outputPath = this.flags.output ?? `bundle-${bundleId}.tgz`;
      const absolutePath = resolve(outputPath);

      this.log(
        t('commands.mrt.bundle.download.downloading', 'Downloading bundle {{bundleId}} to {{filePath}}...', {
          bundleId,
          filePath: outputPath,
        }),
      );

      const response = await fetch(result.downloadUrl);
      if (!response.ok) {
        this.error(
          t('commands.mrt.bundle.download.httpError', 'Failed to download bundle: HTTP {{status}}', {
            status: response.status,
          }),
        );
      }

      if (!response.body) {
        this.error(t('commands.mrt.bundle.download.noBody', 'Failed to download bundle: empty response'));
      }

      // Ensure directory exists
      const dir = dirname(absolutePath);
      if (dir !== '.') {
        mkdirSync(dir, {recursive: true});
      }

      // Stream the response to file
      const fileStream = createWriteStream(absolutePath);
      await pipeline(response.body, fileStream);

      if (!this.jsonEnabled()) {
        this.log(
          t('commands.mrt.bundle.download.success', 'Bundle {{bundleId}} downloaded to {{filePath}}', {
            bundleId,
            filePath: outputPath,
          }),
        );
      }

      return {...result, filePath: absolutePath};
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.bundle.download.failed', 'Failed to download bundle: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
