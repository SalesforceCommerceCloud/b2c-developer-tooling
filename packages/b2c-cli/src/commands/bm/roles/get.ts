/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BmCommand, printFieldsBlock, type DetailSection} from '@salesforce/b2c-tooling-sdk/cli';
import {type RoleInfo} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../i18n/index.js';

interface ExpandedUser {
  login?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
}

export default class BmRolesGet extends BmCommand<typeof BmRolesGet> {
  static args = {
    role: Args.string({
      description: 'Role ID (e.g. "Administrator")',
      required: true,
    }),
  };

  static description = t('commands.bm.roles.get.description', 'Get details of a Business Manager access role');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Administrator',
    '<%= config.bin %> <%= command.id %> Administrator --expand users',
    '<%= config.bin %> <%= command.id %> Administrator --json',
  ];

  static flags = {
    expand: Flags.string({
      char: 'e',
      description: 'Expansions to apply (users, permissions)',
      multiple: true,
      options: ['users', 'permissions'],
    }),
  };

  async run(): Promise<RoleInfo> {
    this.requireOAuthCredentials();

    const {role: roleId} = this.args;
    const {expand} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    const backend = this.createRolesBackend();
    this.logger.debug(`Using ${backend.name} backend for roles get`);

    this.log(t('commands.bm.roles.get.fetching', 'Fetching role {{roleId}} from {{hostname}}...', {roleId, hostname}));

    const role = await backend.getRole(roleId, {expand: expand as ('permissions' | 'users')[] | undefined});

    if (this.jsonEnabled()) {
      return role;
    }

    const sections: DetailSection[] = [];
    // Users may be present on _raw (both OCAPI and SCAPI return them under role.users when --expand users).
    const raw = role._raw as undefined | {users?: ExpandedUser[]};
    const users = raw?.users;
    if (users && users.length > 0) {
      sections.push({
        title: 'Assigned Users',
        lines: users.map((user) => {
          const login = user.login || '-';
          const first = user.firstName ?? user.first_name;
          const last = user.lastName ?? user.last_name;
          const name = [first, last].filter(Boolean).join(' ');
          return name ? `${login}  ${name}` : login;
        }),
      });
    }

    printFieldsBlock(
      'Role Details',
      [
        ['ID', role.id],
        ['Description', role.description],
        ['User Count', role.userCount?.toString()],
        ['User Manager', role.userManager?.toString()],
      ],
      {sections},
    );

    return role;
  }
}
