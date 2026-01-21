/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {downloadDocs, type DownloadDocsResult} from '@salesforce/b2c-tooling-sdk/operations/docs';
import {t} from '../../i18n/index.js';

export default class DocsDownload extends InstanceCommand<typeof DocsDownload> {
  static args = {
    output: Args.string({
      description: 'Output directory for extracted documentation',
      required: true,
    }),
  };

  static description = t(
    'commands.docs.download.description',
    'Download Script API documentation from a B2C Commerce instance',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ./docs',
    '<%= config.bin %> <%= command.id %> ./docs --keep-archive',
    '<%= config.bin %> <%= command.id %> --server sandbox.demandware.net ./my-docs',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    'keep-archive': Flags.boolean({
      description: 'Keep the downloaded archive file',
      default: false,
    }),
  };

  protected operations = {
    downloadDocs,
  };

  async run(): Promise<DownloadDocsResult> {
    this.requireServer();
    this.requireWebDavCredentials();

    const outputDir = this.args.output;
    const keepArchive = this.flags['keep-archive'];

    this.log(
      t('commands.docs.download.downloading', 'Downloading documentation from {{hostname}}...', {
        hostname: this.resolvedConfig.values.hostname,
      }),
    );

    const result = await this.operations.downloadDocs(this.instance, {
      outputDir,
      keepArchive,
    });

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(
      t('commands.docs.download.success', 'Downloaded {{count}} documentation files to {{path}}', {
        count: result.fileCount,
        path: result.outputPath,
      }),
    );

    if (result.archivePath) {
      this.log(
        t('commands.docs.download.archiveKept', 'Archive saved to: {{path}}', {
          path: result.archivePath,
        }),
      );
    }

    return result;
  }
}
