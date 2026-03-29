/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getBmRole, type BmRole} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../i18n/index.js';

export default class BmRolesGet extends InstanceCommand<typeof BmRolesGet> {
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
      description: 'Expansions to apply (e.g. users, permissions)',
      multiple: true,
    }),
  };

  async run(): Promise<BmRole> {
    this.requireOAuthCredentials();

    const {role: roleId} = this.args;
    const {expand} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.bm.roles.get.fetching', 'Fetching role {{roleId}} from {{hostname}}...', {roleId, hostname}));

    const role = await getBmRole(this.instance, roleId, {expand});

    if (this.jsonEnabled()) {
      return role;
    }

    this.printRoleDetails(role);

    return role;
  }

  private printRoleDetails(role: BmRole): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'Role Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['ID', role.id],
      ['Description', role.description],
      ['User Count', role.user_count?.toString()],
      ['User Manager', role.user_manager?.toString()],
      ['Created', role.creation_date],
      ['Last Modified', role.last_modified],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 25, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    if (role.users && role.users.length > 0) {
      ui.div({text: '', padding: [1, 0, 0, 0]});
      ui.div({text: 'Assigned Users', padding: [0, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      for (const user of role.users) {
        ui.div(
          {text: user.login || '-', width: 40, padding: [0, 2, 0, 0]},
          {text: [user.first_name, user.last_name].filter(Boolean).join(' ') || '', padding: [0, 0, 0, 0]},
        );
      }
    }

    ux.stdout(ui.toString());
  }
}
