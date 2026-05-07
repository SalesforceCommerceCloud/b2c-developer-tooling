/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateBmUser, type BmUser, type UpdateBmUserChanges} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {t} from '../../../i18n/index.js';

export default class BmUsersUpdate extends InstanceCommand<typeof BmUsersUpdate> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t(
    'commands.bm.users.update.description',
    'Update a Business Manager user attribute. Identity (password, lock state) is managed by Account Manager and cannot be modified here.',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --disabled',
    '<%= config.bin %> <%= command.id %> user@example.com --no-disabled',
    '<%= config.bin %> <%= command.id %> user@example.com --preferred-ui-locale en_US',
    '<%= config.bin %> <%= command.id %> user@example.com --external-id ext-123',
    '<%= config.bin %> <%= command.id %> user@example.com --first-name Jane --last-name Doe',
  ];

  static flags = {
    disabled: Flags.boolean({
      description: 'Disable / enable the user (use --no-disabled to enable)',
      allowNo: true,
    }),
    'first-name': Flags.string({
      description: 'Set the user first name',
    }),
    'last-name': Flags.string({
      description: 'Set the user last name',
    }),
    email: Flags.string({
      description: 'Set the user email',
    }),
    'external-id': Flags.string({
      description: 'Set the external id (for centrally-authenticated users)',
    }),
    'preferred-ui-locale': Flags.string({
      description: 'Set the preferred UI locale (e.g. en_US)',
    }),
    'preferred-data-locale': Flags.string({
      description: 'Set the preferred data locale (e.g. en_US)',
    }),
  };

  async run(): Promise<BmUser> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const flags = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    const changes: UpdateBmUserChanges = {};
    if (flags.disabled !== undefined) changes.disabled = flags.disabled;
    if (flags['first-name'] !== undefined) changes.first_name = flags['first-name'];
    if (flags['last-name'] !== undefined) changes.last_name = flags['last-name'];
    if (flags.email !== undefined) changes.email = flags.email;
    if (flags['external-id'] !== undefined) changes.external_id = flags['external-id'];
    if (flags['preferred-ui-locale'] !== undefined) changes.preferred_ui_locale = flags['preferred-ui-locale'];
    if (flags['preferred-data-locale'] !== undefined) changes.preferred_data_locale = flags['preferred-data-locale'];

    if (Object.keys(changes).length === 0) {
      this.error(
        t(
          'commands.bm.users.update.noChanges',
          'No fields specified. Provide at least one of --disabled, --first-name, --last-name, --email, --external-id, --preferred-ui-locale, --preferred-data-locale.',
        ),
      );
    }

    this.log(t('commands.bm.users.update.updating', 'Updating user {{login}} on {{hostname}}...', {login, hostname}));

    const user = await updateBmUser(this.instance, login, changes);

    if (this.jsonEnabled()) {
      return user;
    }

    this.log(t('commands.bm.users.update.success', 'User {{login}} updated on {{hostname}}.', {login, hostname}));

    return user;
  }
}
