/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {WebDavCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../i18n/index.js';

const UNZIP_BODY = new URLSearchParams({method: 'UNZIP'}).toString();

interface UnzipResult {
  archivePath: string;
  extractPath: string;
}

export default class WebDavUnzip extends WebDavCommand<typeof WebDavUnzip> {
  static args = {
    path: Args.string({
      description: 'Remote zip file path (relative to root)',
      required: true,
    }),
  };

  static description = t('commands.webdav.unzip.description', 'Extract a remote zip archive');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> src/instance/export.zip',
    '<%= config.bin %> <%= command.id %> --root=cartridges my-cartridge.zip',
  ];

  async run(): Promise<UnzipResult> {
    this.ensureWebDavAuth();

    const fullPath = this.buildPath(this.args.path);

    // Determine the extract directory (same location without .zip extension)
    const extractPath = fullPath.endsWith('.zip') ? fullPath.slice(0, -4) : fullPath;

    this.log(t('commands.webdav.unzip.extracting', 'Extracting {{path}}...', {path: fullPath}));

    const response = await this.instance.webdav.request(fullPath, {
      method: 'POST',
      body: UNZIP_BODY,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      this.error(
        t('commands.webdav.unzip.failed', 'UNZIP failed: {{status}} - {{text}}', {status: response.status, text}),
      );
    }

    const result: UnzipResult = {
      archivePath: fullPath,
      extractPath,
    };

    this.log(t('commands.webdav.unzip.success', 'Extracted to: {{path}}', {path: extractPath}));

    return result;
  }
}
