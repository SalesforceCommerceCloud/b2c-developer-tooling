/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerUser} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';
import {printUserDetails} from '../../../utils/am/user-display.js';

/**
 * Command to revoke a role from an Account Manager user.
 */
export default class RoleRevoke extends AmCommand<typeof RoleRevoke> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t('commands.role.revoke.description', 'Revoke a role from an Account Manager user');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --role bm-admin',
    '<%= config.bin %> <%= command.id %> user@example.com --role bm-admin --scope tenant1',
  ];

  static flags = {
    role: Flags.string({
      char: 'r',
      description: 'Role to revoke',
      required: true,
    }),
    scope: Flags.string({
      char: 's',
      description: 'Scope to remove (if not provided, removes entire role)',
    }),
  };

  async run(): Promise<AccountManagerUser> {
    const {login} = this.args;
    const {role, scope} = this.flags;

    this.log(t('commands.role.revoke.fetching', 'Fetching user {{login}}...', {login}));

    const user = await this.accountManagerClient.findUserByLogin(login);

    if (!user) {
      this.error(t('commands.role.revoke.notFound', 'User {{login}} not found', {login}));
    }

    if (!user.id) {
      this.error(t('commands.role.revoke.noId', 'User does not have an ID'));
    }

    this.log(
      t('commands.role.revoke.revoking', 'Revoking role {{role}} from user {{login}}...', {
        role,
        login,
      }),
    );

    const updatedUser = await this.accountManagerClient.revokeRole(user.id, role, scope);

    if (this.jsonEnabled()) {
      return updatedUser;
    }

    const message = scope
      ? t('commands.role.revoke.successWithScope', 'User {{login}} revoked role {{role}} with scope {{scope}}.', {
          login,
          role,
          scope,
        })
      : t('commands.role.revoke.success', 'User {{login}} revoked role {{role}}.', {login, role});

    this.log(message);

    const [roleMapping, orgMapping] = await Promise.all([
      this.accountManagerClient.getRoleMapping(),
      this.accountManagerClient.getOrgMapping(),
    ]);
    printUserDetails(updatedUser, roleMapping, orgMapping);

    return updatedUser;
  }
}
