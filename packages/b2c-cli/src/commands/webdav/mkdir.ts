/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {WebDavCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

interface MkdirResult {
  path: string;
  created: boolean;
}

export default class WebDavMkdir extends WebDavCommand<typeof WebDavMkdir> {
  static args = {
    path: Args.string({
      description: 'Directory path to create (relative to root)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.webdav.mkdir.description', 'Create a directory on WebDAV'),
    '/cli/webdav.html#b2c-webdav-mkdir',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> src/instance/my-folder',
    '<%= config.bin %> <%= command.id %> --root=temp my-temp-dir',
    '<%= config.bin %> <%= command.id %> --root=cartridges new-cartridge',
  ];

  async run(): Promise<MkdirResult> {
    this.ensureWebDavAuth();

    const fullPath = this.buildPath(this.args.path);

    // Create all parent directories and the target directory
    await this.createDirectoryPath(fullPath);

    const result: MkdirResult = {
      path: fullPath,
      created: true,
    };

    this.log(t('commands.webdav.mkdir.success', 'Created: {{path}}', {path: fullPath}));

    return result;
  }

  /**
   * Creates all directories in the path, similar to `mkdir -p`.
   * The WebDAV root itself is skipped: it always exists, and some roots
   * (e.g. Dynamic, Libraries, Catalogs) reject MKCOL with 403.
   */
  private async createDirectoryPath(fullPath: string): Promise<void> {
    const parts = fullPath.slice(this.rootPath.length).split('/').filter(Boolean);

    let currentPath = this.rootPath;
    for (const part of parts) {
      currentPath = `${currentPath}/${part}`;
      // eslint-disable-next-line no-await-in-loop
      await this.instance.webdav.mkcol(currentPath);
    }
  }
}
