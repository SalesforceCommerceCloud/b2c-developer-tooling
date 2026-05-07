/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {InstanceCommand, printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import {getBmUser, type BmUser} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {t} from '../../../i18n/index.js';

export default class BmUsersGet extends InstanceCommand<typeof BmUsersGet> {
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

  async run(): Promise<BmUser> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.bm.users.get.fetching', 'Fetching user {{login}} from {{hostname}}...', {login, hostname}));

    const user = await getBmUser(this.instance, login);

    if (this.jsonEnabled()) {
      return user;
    }

    printFieldsBlock(
      'User Details',
      [
        ['Login', user.login],
        ['Email', user.email],
        ['First Name', user.first_name],
        ['Last Name', user.last_name],
        ['External ID', user.external_id],
        ['Disabled', user.disabled?.toString()],
        ['Locked', user.locked?.toString()],
        ['Preferred UI Locale', user.preferred_ui_locale],
        ['Preferred Data Locale', user.preferred_data_locale],
        ['Last Login', user.last_login_date],
        ['Password Modified', user.password_modification_date],
        ['Password Expires', user.password_expiration_date],
        ['Created', user.creation_date],
        ['Last Modified', user.last_modified],
      ],
      {
        sections: user.roles && user.roles.length > 0 ? [{title: 'Roles', lines: user.roles}] : [],
      },
    );

    return user;
  }
}
