/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {WebDavCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../i18n/index.js';

const ZIP_BODY = new URLSearchParams({method: 'ZIP'}).toString();

interface ZipResult {
  sourcePath: string;
  archivePath: string;
}

export default class WebDavZip extends WebDavCommand<typeof WebDavZip> {
  static args = {
    path: Args.string({
      description: 'Remote path to zip (relative to root)',
      required: true,
    }),
  };

  static description = t('commands.webdav.zip.description', 'Create a zip archive of a remote file or directory');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> src/instance/data',
    '<%= config.bin %> <%= command.id %> --root=cartridges my-cartridge',
  ];

  async run(): Promise<ZipResult> {
    this.ensureWebDavAuth();

    const fullPath = this.buildPath(this.args.path);
    const archivePath = `${fullPath}.zip`;

    this.log(t('commands.webdav.zip.zipping', 'Zipping {{path}}...', {path: fullPath}));

    const response = await this.instance.webdav.request(fullPath, {
      method: 'POST',
      body: ZIP_BODY,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      this.error(t('commands.webdav.zip.failed', 'ZIP failed: {{status}} - {{text}}', {status: response.status, text}));
    }

    const result: ZipResult = {
      sourcePath: fullPath,
      archivePath,
    };

    this.log(t('commands.webdav.zip.success', 'Created archive: {{path}}', {path: archivePath}));

    return result;
  }
}
