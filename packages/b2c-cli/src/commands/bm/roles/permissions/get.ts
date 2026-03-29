/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getBmRolePermissions, type BmRolePermissions} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../../i18n/index.js';

export default class BmRolesPermissionsGet extends InstanceCommand<typeof BmRolesPermissionsGet> {
  static args = {
    role: Args.string({
      description: 'Role ID (e.g. "Administrator")',
      required: true,
    }),
  };

  static description = t(
    'commands.bm.roles.permissions.get.description',
    'Get permissions for a Business Manager access role',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Administrator',
    '<%= config.bin %> <%= command.id %> Administrator --output admin-perms.json',
    '<%= config.bin %> <%= command.id %> Administrator --json',
  ];

  static flags = {
    output: Flags.string({
      char: 'o',
      description: 'Write full permissions JSON to file',
    }),
  };

  async run(): Promise<BmRolePermissions> {
    this.requireOAuthCredentials();

    const {role: roleId} = this.args;
    const {output} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(
      t('commands.bm.roles.permissions.get.fetching', 'Fetching permissions for role {{roleId}} on {{hostname}}...', {
        roleId,
        hostname,
      }),
    );

    const permissions = await getBmRolePermissions(this.instance, roleId);

    if (output) {
      fs.writeFileSync(output, JSON.stringify(permissions, null, 2) + '\n', 'utf8');
      this.log(t('commands.bm.roles.permissions.get.written', 'Permissions written to {{output}}.', {output}));
      return permissions;
    }

    if (this.jsonEnabled()) {
      return permissions;
    }

    this.printPermissionsSummary(roleId, permissions);

    return permissions;
  }

  private printPermissionsSummary(roleId: string, permissions: BmRolePermissions): void {
    const ui = cliui({width: process.stdout.columns || 80});

    ui.div({text: `Permissions for ${roleId}`, padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

    const functionalOrg = permissions.functional?.organization ?? [];
    const functionalSite = permissions.functional?.site ?? [];
    const moduleOrg = permissions.module?.organization ?? [];
    const moduleSite = permissions.module?.site ?? [];
    const localeUnscoped = permissions.locale?.unscoped ?? [];
    const webdavUnscoped = permissions.webdav?.unscoped ?? [];

    const sections: [string, number, string[]][] = [
      ['Functional (organization)', functionalOrg.length, functionalOrg.map((p) => p.name)],
      ['Functional (site)', functionalSite.length, functionalSite.map((p) => p.name)],
      ['Module (organization)', moduleOrg.length, moduleOrg.map((p) => `${p.application}:${p.name}`)],
      ['Module (site)', moduleSite.length, moduleSite.map((p) => `${p.application}:${p.name}`)],
      ['Locale', localeUnscoped.length, localeUnscoped.map((p) => p.locale_id)],
      ['WebDAV', webdavUnscoped.length, webdavUnscoped.map((p) => p.folder)],
    ];

    for (const [label, count, names] of sections) {
      if (count > 0) {
        ui.div(
          {text: `${label}:`, width: 30, padding: [0, 2, 0, 0]},
          {text: `${count} permission(s)`, padding: [0, 0, 0, 0]},
        );
        for (const name of names.slice(0, 10)) {
          ui.div({text: '', width: 30}, {text: `  ${name}`, padding: [0, 0, 0, 0]});
        }
        if (names.length > 10) {
          ui.div({text: '', width: 30}, {text: `  ... and ${names.length - 10} more`, padding: [0, 0, 0, 0]});
        }
      }
    }

    const totalCount =
      functionalOrg.length +
      functionalSite.length +
      moduleOrg.length +
      moduleSite.length +
      localeUnscoped.length +
      webdavUnscoped.length;

    if (totalCount === 0) {
      ui.div({text: 'No permissions assigned.', padding: [0, 0, 0, 0]});
    }

    ui.div({text: '', padding: [1, 0, 0, 0]});
    ui.div({
      text: 'Use --output <file> to export the full permissions JSON for editing.',
      padding: [0, 0, 0, 0],
    });

    ux.stdout(ui.toString());
  }
}
