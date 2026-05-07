/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {grantBmRole} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import type {OcapiComponents} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

type OcapiUser = OcapiComponents['schemas']['user'];

export default class BmRolesGrant extends InstanceCommand<typeof BmRolesGrant> {
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

  async run(): Promise<OcapiUser> {
    this.requireOAuthCredentials();

    const {login} = this.args;
    const {role} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(
      t('commands.bm.roles.grant.granting', 'Granting role {{role}} to {{login}} on {{hostname}}...', {
        role,
        login,
        hostname,
      }),
    );

    const user = await grantBmRole(this.instance, role, login);

    if (this.jsonEnabled()) {
      return user;
    }

    this.log(
      t('commands.bm.roles.grant.success', 'User {{login}} granted role {{role}} on {{hostname}}.', {
        login,
        role,
        hostname,
      }),
    );

    return user;
  }
}
