/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {BmCommand, printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import {type UserInfo} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {t} from '../../../i18n/index.js';

export default class BmUsersGet extends BmCommand<typeof BmUsersGet> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t('commands.bm.users.get.description', 'Get details of a Business Manager user');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com',
    '<%= config.bin %> <%= command.id %> user@example.com --json',
  ];

  async run(): Promise<UserInfo> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const hostname = this.resolvedConfig.values.hostname!;

    const backend = this.createUsersBackend();
    this.logger.debug(`Using ${backend.name} backend for users get`);

    this.log(t('commands.bm.users.get.fetching', 'Fetching user {{login}} from {{hostname}}...', {login, hostname}));

    const user = await backend.getUser(login);

    if (this.jsonEnabled()) {
      return user;
    }

    printFieldsBlock(
      'User Details',
      [
        ['Login', user.login],
        ['Email', user.email],
        ['First Name', user.firstName],
        ['Last Name', user.lastName],
        ['External ID', user.externalId],
        ['Disabled', user.disabled?.toString()],
        ['Locked', user.locked?.toString()],
        ['Preferred UI Locale', user.preferredUiLocale],
        ['Preferred Data Locale', user.preferredDataLocale],
        ['Last Login', user.lastLoginDate],
        ['Password Modified', user.passwordModificationDate],
        ['Password Expires', user.passwordExpirationDate],
      ],
      {
        sections: user.roles && user.roles.length > 0 ? [{title: 'Roles', lines: user.roles}] : [],
      },
    );

    return user;
  }
}
