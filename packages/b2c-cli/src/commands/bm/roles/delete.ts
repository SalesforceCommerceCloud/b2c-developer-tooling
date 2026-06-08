/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {BmCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../../i18n/index.js';

interface DeleteResult {
  success: boolean;
  role: string;
  hostname: string;
}

export default class BmRolesDelete extends BmCommand<typeof BmRolesDelete> {
  static args = {
    role: Args.string({
      description: 'Role ID to delete',
      required: true,
    }),
  };

  static description = t('commands.bm.roles.delete.description', 'Delete a Business Manager access role');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MyCustomRole',
    '<%= config.bin %> <%= command.id %> MyCustomRole --json',
  ];

  async run(): Promise<DeleteResult> {
    this.requireOAuthCredentials();

    const {role: roleId} = this.args;
    const hostname = this.resolvedConfig.values.hostname!;

    const backend = this.createRolesBackend();
    this.logger.debug(`Using ${backend.name} backend for roles delete`);

    this.log(
      t('commands.bm.roles.delete.deleting', 'Deleting role {{roleId}} from {{hostname}}...', {roleId, hostname}),
    );

    await backend.deleteRole(roleId);

    const result = {success: true, role: roleId, hostname};

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(t('commands.bm.roles.delete.success', 'Role {{roleId}} deleted from {{hostname}}.', {roleId, hostname}));

    return result;
  }
}
