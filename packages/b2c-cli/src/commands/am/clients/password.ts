/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../../i18n/index.js';

/**
 * Command to change an Account Manager API client password.
 */
export default class ClientPassword extends AmCommand<typeof ClientPassword> {
  static args = {
    'api-client-id': Args.string({
      description: 'API client ID (UUID)',
      required: true,
    }),
  };

  static description = t('commands.client.password.description', 'Change an Account Manager API client password');

  static examples = ['<%= config.bin %> <%= command.id %> <api-client-id> --current "OldP@ss" --new "NewP@ss123"'];

  static flags = {
    current: Flags.string({
      char: 'c',
      description: 'Current password',
      required: true,
    }),
    new: Flags.string({
      char: 'n',
      description: 'New password (12–128 characters)',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const apiClientId = this.args['api-client-id'];
    const {current, new: newPassword} = this.flags;

    if (newPassword.length < 12) {
      this.error(
        t(
          'commands.client.password.newMinLength',
          'New password must be at least 12 characters (received {{length}})',
          {
            length: newPassword.length,
          },
        ),
      );
    }
    if (newPassword.length > 128) {
      this.error(
        t(
          'commands.client.password.newMaxLength',
          'New password must be at most 128 characters (received {{length}})',
          {
            length: newPassword.length,
          },
        ),
      );
    }

    this.log(t('commands.client.password.changing', 'Changing password for API client {{id}}...', {id: apiClientId}));

    await this.accountManagerClient.changeApiClientPassword(apiClientId, current, newPassword);

    this.log(
      t('commands.client.password.success', 'Password for API client {{id}} changed successfully.', {id: apiClientId}),
    );
  }
}
