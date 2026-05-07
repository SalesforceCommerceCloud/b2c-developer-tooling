/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {InstanceCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listBmRoles, type BmRole, type BmRoles} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<BmRole>> = {
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
    get: (r) => r.user_count?.toString() ?? '-',
  },
  userManager: {
    header: 'User Manager',
    get: (r) => (r.user_manager ? 'Yes' : 'No'),
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'userCount'];

export default class BmRolesList extends InstanceCommand<typeof BmRolesList> {
  static description = t('commands.bm.roles.list.description', 'List Business Manager access roles on an instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --count 50',
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
  };

  async run(): Promise<BmRoles> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const {count, start} = this.flags;

    this.log(t('commands.bm.roles.list.fetching', 'Fetching roles from {{hostname}}...', {hostname}));

    const roles = await listBmRoles(this.instance, {count, start});

    if (this.jsonEnabled()) {
      return roles;
    }

    const items = roles.data ?? [];
    if (items.length === 0) {
      this.log(t('commands.bm.roles.list.noRoles', 'No roles found.'));
      return roles;
    }

    createTable(COLUMNS).render(items, DEFAULT_COLUMNS);

    if (roles.total && roles.total > items.length) {
      this.log(
        t('commands.bm.roles.list.moreRoles', '{{count}} of {{total}} roles shown.', {
          count: items.length,
          total: roles.total,
        }),
      );
    }

    return roles;
  }
}
