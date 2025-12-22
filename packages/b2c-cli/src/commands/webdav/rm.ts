/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {WebDavCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../i18n/index.js';

/**
 * Simple confirmation prompt.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

interface RmResult {
  path: string;
  deleted: boolean;
}

export default class WebDavRm extends WebDavCommand<typeof WebDavRm> {
  static args = {
    path: Args.string({
      description: 'Path to delete relative to root',
      required: true,
    }),
  };

  static description = t('commands.webdav.rm.description', 'Delete a file or directory from WebDAV');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> src/instance/old-export.zip',
    '<%= config.bin %> <%= command.id %> src/instance/old-export.zip --force',
    '<%= config.bin %> <%= command.id %> --root=temp my-temp-dir --force',
  ];

  static flags = {
    ...WebDavCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<RmResult> {
    this.ensureWebDavAuth();

    const fullPath = this.buildPath(this.args.path);

    // Confirm deletion unless --force is used
    if (!this.flags.force) {
      const confirmed = await confirm(
        t('commands.webdav.rm.confirm', 'Are you sure you want to delete "{{path}}"? (y/n)', {path: fullPath}),
      );

      if (!confirmed) {
        this.log(t('commands.webdav.rm.cancelled', 'Deletion cancelled'));
        return {path: fullPath, deleted: false};
      }
    }

    await this.instance.webdav.delete(fullPath);

    const result: RmResult = {
      path: fullPath,
      deleted: true,
    };

    this.log(t('commands.webdav.rm.success', 'Deleted: {{path}}', {path: fullPath}));

    return result;
  }
}
