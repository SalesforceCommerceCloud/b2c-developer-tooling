/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import {whoamiBmUser, type BmUser} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {BmUserAuthCommand} from '../../utils/bm/user-auth-command.js';
import {t} from '../../i18n/index.js';

export default class BmWhoami extends BmUserAuthCommand<typeof BmWhoami> {
  static description = t(
    'commands.bm.whoami.description',
    'Show details of the Business Manager user the current OAuth token resolves to',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  async run(): Promise<BmUser> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.bm.whoami.fetching', 'Resolving current user on {{hostname}}...', {hostname}));

    const user = await whoamiBmUser(this.instance);

    if (this.jsonEnabled()) {
      return user;
    }

    printFieldsBlock('Current User', [
      ['Login', user.login],
      ['Email', user.email],
      ['First Name', user.first_name],
      ['Last Name', user.last_name],
      ['External ID', user.external_id],
      ['Last Login', user.last_login_date],
      ['Password Expires', user.password_expiration_date],
    ]);

    return user;
  }
}
