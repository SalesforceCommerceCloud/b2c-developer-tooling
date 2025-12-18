/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {deleteCodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
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

export default class CodeDelete extends InstanceCommand<typeof CodeDelete> {
  static args = {
    codeVersion: Args.string({
      description: 'Code version ID to delete',
      required: true,
    }),
  };

  static description = t('commands.code.delete.description', 'Delete a code version');

  static examples = [
    '<%= config.bin %> <%= command.id %> old-version',
    '<%= config.bin %> <%= command.id %> old-version --force',
    '<%= config.bin %> <%= command.id %> old-version --server my-sandbox.demandware.net',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<void> {
    this.requireOAuthCredentials();

    const codeVersion = this.args.codeVersion;
    const hostname = this.resolvedConfig.hostname!;

    // Confirm deletion unless --force is used
    if (!this.flags.force) {
      const confirmed = await confirm(
        t(
          'commands.code.delete.confirm',
          'Are you sure you want to delete code version "{{codeVersion}}" on {{hostname}}? (y/n)',
          {codeVersion, hostname},
        ),
      );

      if (!confirmed) {
        this.log(t('commands.code.delete.cancelled', 'Deletion cancelled'));
        return;
      }
    }

    this.log(
      t('commands.code.delete.deleting', 'Deleting code version {{codeVersion}} from {{hostname}}...', {
        hostname,
        codeVersion,
      }),
    );

    await deleteCodeVersion(this.instance, codeVersion);
    this.log(t('commands.code.delete.deleted', 'Code version {{codeVersion}} deleted successfully', {codeVersion}));
  }
}
