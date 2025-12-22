/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs';
import {basename, resolve} from 'node:path';
import {Args} from '@oclif/core';
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
    local: Args.string({
      description: 'Local destination path (defaults to filename in current directory)',
    }),
  };

  static description = t('commands.webdav.get.description', 'Download a file from WebDAV');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> src/instance/export.zip',
    '<%= config.bin %> <%= command.id %> src/instance/export.zip ./downloads/export.zip',
    '<%= config.bin %> <%= command.id %> --root=logs customerror.log',
  ];

  async run(): Promise<GetResult> {
    this.ensureWebDavAuth();

    const fullPath = this.buildPath(this.args.remote);

    // Determine local path - default to filename in current directory
    const localPath = this.args.local || basename(this.args.remote);

    this.log(t('commands.webdav.get.downloading', 'Downloading {{path}}...', {path: fullPath}));

    const content = await this.instance.webdav.get(fullPath);

    // Write to local file
    const buffer = Buffer.from(content);
    fs.writeFileSync(localPath, buffer);

    const result: GetResult = {
      remotePath: fullPath,
      localPath: resolve(localPath),
      size: buffer.length,
    };

    this.log(
      t('commands.webdav.get.success', 'Downloaded {{size}} bytes to {{path}}', {
        size: result.size,
        path: result.localPath,
      }),
    );

    return result;
  }
}
