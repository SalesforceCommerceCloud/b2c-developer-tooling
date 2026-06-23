/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {BmCommand, TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {type RoleInfo, type ListRolesResult} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<RoleInfo>> = {
  id: {
    header: 'ID',
    get: (r) => r.id || '-',
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
    extended: true,
  },
  userCount: {
    header: 'Users',
    get: (r) => r.userCount?.toString() ?? '-',
  },
  userManager: {
    header: 'User Manager',
    get: (r) => (r.userManager ? 'Yes' : 'No'),
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'userCount'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class BmRolesList extends BmCommand<typeof BmRolesList> {
  static description = t('commands.bm.roles.list.description', 'List Business Manager access roles on an instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --count 50',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --columns id,description,userCount',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    count: Flags.integer({
      char: 'n',
      description: 'Number of roles to return (default 25)',
    }),
    start: Flags.integer({
      description: 'Start index for pagination (default 0)',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ListRolesResult> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const {count, start} = this.flags;

    const backend = this.createRolesBackend();
    this.logger.debug(`Using ${backend.name} backend for roles list`);

    this.log(t('commands.bm.roles.list.fetching', 'Fetching roles from {{hostname}}...', {hostname}));

    const result = await backend.listRoles({count, start});

    if (this.jsonEnabled()) {
      return result;
    }

    const items = result.hits;
    if (items.length === 0) {
      this.log(t('commands.bm.roles.list.noRoles', 'No roles found.'));
      return result;
    }

    tableRenderer.render(items, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    if (result.total && result.total > items.length) {
      this.log(
        t('commands.bm.roles.list.moreRoles', '{{count}} of {{total}} roles shown.', {
          count: items.length,
          total: result.total,
        }),
      );
    }

    return result;
  }
}
