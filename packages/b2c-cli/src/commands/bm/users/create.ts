/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {type UserInfo, type CreateUserInput} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {t} from '../../../i18n/index.js';

export default class BmUsersCreate extends BmCommand<typeof BmUsersCreate> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t(
    'commands.bm.users.create.description',
    'Create a Business Manager user (create-or-replace). Note: most instances use SSO with Account Manager and reject creating *local* BM users with "LocalUserCreationException" — this succeeds only when the instance is configured to allow local user creation.',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --email user@example.com',
    '<%= config.bin %> <%= command.id %> user@example.com --email user@example.com --first-name Jane --last-name Doe',
    '<%= config.bin %> <%= command.id %> user@example.com --email user@example.com --role Administrator --role bm-admin',
    '<%= config.bin %> <%= command.id %> user@example.com --email user@example.com --external-id ext-123',
  ];

  static flags = {
    email: Flags.string({
      description: 'User email address',
      required: true,
    }),
    'first-name': Flags.string({
      description: 'User first name',
    }),
    'last-name': Flags.string({
      description: 'User last name',
    }),
    'external-id': Flags.string({
      description: 'External id (for centrally-authenticated / SSO users)',
    }),
    password: Flags.string({
      description: 'Initial password (local users only; ignored for SSO/AM-managed users)',
    }),
    role: Flags.string({
      description: 'Role to assign (repeatable)',
      multiple: true,
    }),
    disabled: Flags.boolean({
      description: 'Create the user in a disabled state',
      allowNo: true,
    }),
    'preferred-ui-locale': Flags.string({
      description: 'Preferred UI locale (e.g. en_US)',
    }),
    'preferred-data-locale': Flags.string({
      description: 'Preferred data locale (e.g. en_US)',
    }),
  };

  async run(): Promise<UserInfo> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const flags = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    const input: CreateUserInput = {
      login,
      email: flags.email,
    };
    if (flags['first-name'] !== undefined) input.firstName = flags['first-name'];
    if (flags['last-name'] !== undefined) input.lastName = flags['last-name'];
    if (flags['external-id'] !== undefined) input.externalId = flags['external-id'];
    if (flags.password !== undefined) input.password = flags.password;
    if (flags.disabled !== undefined) input.disabled = flags.disabled;
    if (flags.role !== undefined) input.roles = flags.role;
    if (flags['preferred-ui-locale'] !== undefined) input.preferredUiLocale = flags['preferred-ui-locale'];
    if (flags['preferred-data-locale'] !== undefined) input.preferredDataLocale = flags['preferred-data-locale'];

    const backend = this.createUsersBackend();
    this.logger.debug(`Using ${backend.name} backend for users create`);

    this.log(t('commands.bm.users.create.creating', 'Creating user {{login}} on {{hostname}}...', {login, hostname}));

    const user = await backend.createOrReplaceUser(login, input);

    if (this.jsonEnabled()) {
      return user;
    }

    this.log(t('commands.bm.users.create.success', 'User {{login}} created on {{hostname}}.', {login, hostname}));

    return user;
  }
}
