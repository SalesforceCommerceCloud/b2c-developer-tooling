/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../../i18n/index.js';

interface GrantResult {
  success: boolean;
  role: string;
  login: string;
  hostname: string;
}

export default class BmRolesGrant extends BmCommand<typeof BmRolesGrant> {
  static args = {
    login: Args.string({
      description: 'User login (email)',
      required: true,
    }),
  };

  static description = t(
    'commands.bm.roles.grant.description',
    'Grant a Business Manager role to a user on an instance',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> user@example.com --role Administrator',
    '<%= config.bin %> <%= command.id %> user@example.com --role Administrator --json',
  ];

  static flags = {
    role: Flags.string({
      char: 'r',
      description: 'Role ID to grant',
      required: true,
    }),
  };

  async run(): Promise<GrantResult> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const {role} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    const backend = this.createRolesBackend();
    this.logger.debug(`Using ${backend.name} backend for roles grant`);

    this.log(
      t('commands.bm.roles.grant.granting', 'Granting role {{role}} to {{login}} on {{hostname}}...', {
        role,
        login,
        hostname,
      }),
    );

    await backend.grantRole(role, login);

    const result: GrantResult = {success: true, role, login, hostname};

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(
      t('commands.bm.roles.grant.success', 'User {{login}} granted role {{role}} on {{hostname}}.', {
        login,
        role,
        hostname,
      }),
    );

    return result;
  }
}
