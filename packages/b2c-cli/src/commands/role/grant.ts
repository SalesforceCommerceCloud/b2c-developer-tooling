/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {UserCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getUserByLogin, grantRole} from '@salesforce/b2c-tooling-sdk/operations/users';
import type {AccountManagerUser} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

/**
 * Command to grant a role to an Account Manager user.
 */
export default class RoleGrant extends UserCommand<typeof RoleGrant> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t('commands.role.grant.description', 'Grant a role to an Account Manager user');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --role bm-admin',
    '<%= config.bin %> <%= command.id %> user@example.com --role bm-admin --scope tenant1,tenant2',
  ];

  static flags = {
    role: Flags.string({
      char: 'r',
      description: 'Role to grant',
      required: true,
    }),
    scope: Flags.string({
      char: 's',
      description: 'Scope for the role (tenant IDs, comma-separated)',
    }),
  };

  async run(): Promise<AccountManagerUser> {
    const {login} = this.args;
    const {role, scope} = this.flags;

    this.log(t('commands.role.grant.fetching', 'Fetching user {{login}}...', {login}));

    const user = await getUserByLogin(this.accountManagerUsersClient, login);

    if (!user.id) {
      this.error(t('commands.role.grant.noId', 'User does not have an ID'));
    }

    this.log(
      t('commands.role.grant.granting', 'Granting role {{role}} to user {{login}}...', {
        role,
        login,
      }),
    );

    const updatedUser = await grantRole(this.accountManagerUsersClient, {
      userId: user.id,
      role,
      scope,
    });

    if (this.jsonEnabled()) {
      return updatedUser;
    }

    const message = scope
      ? t('commands.role.grant.successWithScope', 'User {{login}} granted role {{role}} with scope {{scope}}.', {
          login,
          role,
          scope,
        })
      : t('commands.role.grant.success', 'User {{login}} granted role {{role}}.', {login, role});

    this.log(message);

    return updatedUser;
  }
}
