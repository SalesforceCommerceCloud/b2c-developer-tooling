/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createBmRole, type BmRole} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../i18n/index.js';

export default class BmRolesCreate extends InstanceCommand<typeof BmRolesCreate> {
  static args = {
    role: Args.string({
      description: 'Role ID to create',
      required: true,
    }),
  };

  static description = t('commands.bm.roles.create.description', 'Create a Business Manager access role');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MyCustomRole',
    '<%= config.bin %> <%= command.id %> MyCustomRole --description "Custom role for content editors"',
    '<%= config.bin %> <%= command.id %> MyCustomRole --json',
  ];

  static flags = {
    description: Flags.string({
      char: 'd',
      description: 'Description for the role',
    }),
  };

  async run(): Promise<BmRole> {
    this.requireOAuthCredentials();

    const {role: roleId} = this.args;
    const {description} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.bm.roles.create.creating', 'Creating role {{roleId}} on {{hostname}}...', {roleId, hostname}));

    const role = await createBmRole(this.instance, roleId, {description});

    if (this.jsonEnabled()) {
      return role;
    }

    this.log(t('commands.bm.roles.create.success', 'Role {{roleId}} created on {{hostname}}.', {roleId, hostname}));

    return role;
  }
}
