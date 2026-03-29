/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {revokeBmRole} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../i18n/index.js';

interface RevokeResult {
  success: boolean;
  role: string;
  login: string;
  hostname: string;
}

export default class BmRolesRevoke extends InstanceCommand<typeof BmRolesRevoke> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t(
    'commands.bm.roles.revoke.description',
    'Revoke a Business Manager role from a user on an instance',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --role Administrator',
    '<%= config.bin %> <%= command.id %> user@example.com --role Administrator --json',
  ];

  static flags = {
    role: Flags.string({
      char: 'r',
      description: 'Role ID to revoke',
      required: true,
    }),
  };

  async run(): Promise<RevokeResult> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const {role} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(
      t('commands.bm.roles.revoke.revoking', 'Revoking role {{role}} from {{login}} on {{hostname}}...', {
        role,
        login,
        hostname,
      }),
    );

    await revokeBmRole(this.instance, role, login);

    const result = {success: true, role, login, hostname};

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(
      t('commands.bm.roles.revoke.success', 'User {{login}} revoked from role {{role}} on {{hostname}}.', {
        login,
        role,
        hostname,
      }),
    );

    return result;
  }
}
