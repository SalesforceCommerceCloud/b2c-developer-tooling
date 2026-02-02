/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import cliui from 'cliui';
import {AmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerRole} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

/**
 * Command to get details of a single Account Manager role.
 */
export default class RoleGet extends AmCommand<typeof RoleGet> {
  static args = {
    roleId: Args.string({
      description: 'Role ID',
      required: true,
    }),
  };

  static description = t('commands.role.get.description', 'Get details of an Account Manager role');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> bm-admin',
    '<%= config.bin %> <%= command.id %> bm-user --json',
  ];

  async run(): Promise<AccountManagerRole> {
    const {roleId} = this.args;

    this.log(t('commands.role.get.fetching', 'Fetching role {{roleId}}...', {roleId}));

    const role = await this.accountManagerClient.getRole(roleId);

    if (this.jsonEnabled()) {
      return role;
    }

    this.printRoleDetails(role);

    return role;
  }

  private printRoleDetails(role: AccountManagerRole): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: 'Role Details', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const fields: [string, string | undefined][] = [
      ['ID', role.id],
      ['Description', role.description],
      ['Role Enum Name', role.roleEnumName],
      ['Scope', role.scope],
      ['Target Type', role.targetType || undefined],
      ['2FA Enabled', role.twoFAEnabled?.toString()],
      ['Internal Role', (role as {internalRole?: boolean}).internalRole?.toString()],
    ];

    for (const [label, value] of fields) {
      if (value !== undefined) {
        ui.div({text: `${label}:`, width: 25, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
      }
    }

    // Permissions
    if (role.permissions && role.permissions.length > 0) {
      ui.div({text: 'Permissions', padding: [2, 0, 0, 0]});
      ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

      ui.div(
        {text: 'Permissions:', width: 25, padding: [0, 2, 0, 0]},
        {text: role.permissions.join(', '), padding: [0, 0, 0, 0]},
      );
    }

    ux.stdout(ui.toString());
  }
}
