/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {t} from '../../../i18n/index.js';

interface DeleteResult {
  success: boolean;
  login: string;
  hostname: string;
}

export default class BmUsersDelete extends BmCommand<typeof BmUsersDelete> {
  static args = {
    login: Args.string({
      description: 'User login (email) to delete',
      required: true,
    }),
  };

  static description = t('commands.bm.users.delete.description', 'Delete a Business Manager user from an instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com',
    '<%= config.bin %> <%= command.id %> user@example.com --force',
    '<%= config.bin %> <%= command.id %> user@example.com --json',
  ];

  static flags = {
    force: Flags.boolean({
      description: 'Skip the confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<DeleteResult> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const {force} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    if (!force && !this.jsonEnabled()) {
      const answer = await confirm(
        t('commands.bm.users.delete.confirm', 'Delete user {{login}} from {{hostname}}?', {login, hostname}),
      );
      if (!answer) {
        this.log(t('commands.bm.users.delete.cancelled', 'Cancelled.'));
        return {success: false, login, hostname};
      }
    }

    const backend = this.createUsersBackend();
    this.logger.debug(`Using ${backend.name} backend for users delete`);

    this.log(t('commands.bm.users.delete.deleting', 'Deleting user {{login}} from {{hostname}}...', {login, hostname}));

    await backend.deleteUser(login);

    const result = {success: true, login, hostname};

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(t('commands.bm.users.delete.success', 'User {{login}} deleted from {{hostname}}.', {login, hostname}));

    return result;
  }
}
