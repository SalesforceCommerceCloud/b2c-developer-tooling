/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {basename, resolve} from 'node:path';
import {Args, Flags} from '@oclif/core';
import {WebDavCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../i18n/index.js';

interface GetResult {
  remotePath: string;
  localPath: string;
  size: number;
}

export default class WebDavGet extends WebDavCommand<typeof WebDavGet> {
  static args = {
    remote: Args.string({
      description: 'Remote file path relative to root',
      required: true,
    }),
  };

  static description = t('commands.webdav.get.description', 'Download a file from WebDAV');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> src/instance/export.zip',
    '<%= config.bin %> <%= command.id %> src/instance/export.zip -o ./downloads/export.zip',
    '<%= config.bin %> <%= command.id %> --root=logs customerror.log',
    '<%= config.bin %> <%= command.id %> --root=logs customerror.log -o -',
  ];

  static flags = {
    ...WebDavCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      description: 'Output file path (use - for stdout, defaults to filename in current directory)',
    }),
  };

  async run(): Promise<GetResult> {
    this.ensureWebDavAuth();

    const fullPath = this.buildPath(this.args.remote);

    // Determine output path - default to filename in current directory
    const outputPath = this.flags.output ?? basename(this.args.remote);
    const isStdout = outputPath === '-';

    if (!isStdout) {
      this.log(t('commands.webdav.get.downloading', 'Downloading {{path}}...', {path: fullPath}));
    }

    const content = await this.instance.webdav.get(fullPath);
    const buffer = Buffer.from(content);

    if (isStdout) {
      process.stdout.write(buffer);
    } else {
      fs.writeFileSync(outputPath, buffer);
      this.log(
        t('commands.webdav.get.success', 'Downloaded {{size}} bytes to {{path}}', {
          size: buffer.length,
          path: resolve(outputPath),
        }),
      );
    }

    return {
      remotePath: fullPath,
      localPath: isStdout ? '-' : resolve(outputPath),
      size: buffer.length,
    };
  }
}
