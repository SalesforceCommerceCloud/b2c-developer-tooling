/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {AmCommand, printFieldsBlock, type DetailSection} from '@salesforce/b2c-tooling-sdk/cli';
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

    const sections: DetailSection[] = [];
    if (role.permissions && role.permissions.length > 0) {
      sections.push({
        title: 'Permissions',
        fields: [['Permissions', role.permissions.join(', ')]],
      });
    }

    printFieldsBlock(
      'Role Details',
      [
        ['ID', role.id],
        ['Description', role.description],
        ['Role Enum Name', role.roleEnumName],
        ['Scope', role.scope],
        ['Target Type', role.targetType || undefined],
        ['2FA Enabled', role.twoFAEnabled?.toString()],
        ['Internal Role', (role as {internalRole?: boolean}).internalRole?.toString()],
      ],
      {sections},
    );

    return role;
  }
}
