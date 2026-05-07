/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {setBmRolePermissions, type BmRolePermissions} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../../i18n/index.js';

export default class BmRolesPermissionsSet extends InstanceCommand<typeof BmRolesPermissionsSet> {
  static args = {
    role: Args.string({
      description: 'Role ID (e.g. "Administrator")',
      required: true,
    }),
  };

  static description = t(
    'commands.bm.roles.permissions.set.description',
    'Set permissions for a Business Manager access role (replaces all existing permissions)',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> MyRole --file perms.json'];

  static flags = {
    file: Flags.string({
      char: 'f',
      description: 'JSON file containing permissions (role_permissions schema)',
      required: true,
    }),
  };

  async run(): Promise<BmRolePermissions> {
    this.requireOAuthCredentials();

    const {role: roleId} = this.args;
    const {file} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    if (!fs.existsSync(file)) {
      this.error(t('commands.bm.roles.permissions.set.fileNotFound', 'File not found: {{file}}', {file}));
    }

    let permissions: BmRolePermissions;
    try {
      const content = fs.readFileSync(file, 'utf8');
      permissions = JSON.parse(content) as BmRolePermissions;
    } catch {
      this.error(t('commands.bm.roles.permissions.set.parseError', 'Failed to parse JSON from {{file}}', {file}));
    }

    this.log(
      t(
        'commands.bm.roles.permissions.set.setting',
        'Setting permissions for role {{roleId}} on {{hostname}} (this replaces all existing permissions)...',
        {roleId, hostname},
      ),
    );

    const result = await setBmRolePermissions(this.instance, roleId, permissions);

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(
      t('commands.bm.roles.permissions.set.success', 'Permissions updated for role {{roleId}} on {{hostname}}.', {
        roleId,
        hostname,
      }),
    );

    return result;
  }
}
