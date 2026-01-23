/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {UserCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getUserByLogin, deleteUser, purgeUser} from '@salesforce/b2c-tooling-sdk/operations/users';
import {t} from '../../i18n/index.js';

/**
 * Command to delete an Account Manager user.
 */
export default class UserDelete extends UserCommand<typeof UserDelete> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t('commands.user.delete.description', 'Delete an Account Manager user');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com',
    '<%= config.bin %> <%= command.id %> user@example.com --purge',
  ];

  static flags = {
    purge: Flags.boolean({
      description: 'Purge the user completely (hard delete). User must be in DELETED state first.',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const {login} = this.args;
    const {purge} = this.flags;

    this.log(t('commands.user.delete.fetching', 'Fetching user {{login}}...', {login}));

    const user = await getUserByLogin(this.accountManagerUsersClient, login);

    if (!user.id) {
      this.error(t('commands.user.delete.noId', 'User does not have an ID'));
    }

    if (purge) {
      this.log(
        t('commands.user.delete.purging', 'Purging user {{login}}...', {
          login,
        }),
      );
      await purgeUser(this.accountManagerUsersClient, user.id);
    } else {
      this.log(
        t('commands.user.delete.deleting', 'Deleting user {{login}}...', {
          login,
        }),
      );
      await deleteUser(this.accountManagerUsersClient, user.id);
    }

    if (this.jsonEnabled()) {
      return;
    }

    this.log(
      t('commands.user.delete.success', 'User {{login}} {{action}} successfully.', {
        login,
        action: purge ? 'purged' : 'deleted',
      }),
    );
  }
}
