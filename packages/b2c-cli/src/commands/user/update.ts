/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {UserCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getUserByLogin, updateUser} from '@salesforce/b2c-tooling-sdk/operations/users';
import type {AccountManagerUser, UserUpdate as UserUpdateType} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

/**
 * Command to update an Account Manager user.
 */
export default class UserUpdate extends UserCommand<typeof UserUpdate> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t('commands.user.update.description', 'Update an Account Manager user');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --first-name Jane',
    '<%= config.bin %> <%= command.id %> user@example.com --last-name Smith --json',
  ];

  static flags = {
    'first-name': Flags.string({
      description: 'First name',
    }),
    'last-name': Flags.string({
      description: 'Last name',
    }),
  };

  async run(): Promise<AccountManagerUser> {
    const {login} = this.args;
    const {'first-name': firstName, 'last-name': lastName} = this.flags;

    this.log(t('commands.user.update.fetching', 'Fetching user {{login}}...', {login}));

    const user = await getUserByLogin(this.accountManagerUsersClient, login);

    if (!user.id) {
      this.error(t('commands.user.update.noId', 'User does not have an ID'));
    }

    const changes: Partial<UserUpdateType> = {};
    if (firstName !== undefined) {
      changes.firstName = firstName;
    }
    if (lastName !== undefined) {
      changes.lastName = lastName;
    }

    if (Object.keys(changes).length === 0) {
      this.error(t('commands.user.update.noChanges', 'No changes specified. Provide at least one field to update.'));
    }

    this.log(t('commands.user.update.updating', 'Updating user {{login}}...', {login}));

    const updatedUser = await updateUser(this.accountManagerUsersClient, {
      userId: user.id,
      changes: changes as UserUpdateType,
    });

    if (this.jsonEnabled()) {
      return updatedUser;
    }

    this.log(t('commands.user.update.success', 'User {{login}} updated successfully.', {login}));

    return updatedUser;
  }
}
