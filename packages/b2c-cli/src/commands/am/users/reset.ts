/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../../i18n/index.js';

/**
 * Command to reset an Account Manager user password.
 */
export default class UserReset extends AmCommand<typeof UserReset> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t('commands.user.reset.description', 'Reset an Account Manager user password');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com',
    '<%= config.bin %> <%= command.id %> user@example.com --json',
  ];

  async run(): Promise<void> {
    const {login} = this.args;

    this.log(t('commands.user.reset.fetching', 'Fetching user {{login}}...', {login}));

    const user = await this.accountManagerClient.findUserByLogin(login);

    if (!user) {
      this.error(t('commands.user.reset.notFound', 'User {{login}} not found', {login}));
    }

    if (!user.id) {
      this.error(t('commands.user.reset.noId', 'User does not have an ID'));
    }

    this.log(t('commands.user.reset.resetting', 'Resetting password for user {{login}}...', {login}));

    await this.accountManagerClient.resetUser(user.id);

    if (this.jsonEnabled()) {
      return;
    }

    this.log(t('commands.user.reset.success', 'Password reset for user {{login}} completed successfully.', {login}));
  }
}
