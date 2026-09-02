/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {BmCommand, TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {type UserInfo, type ListUsersResult} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<UserInfo>> = {
  login: {
    header: 'Login',
    get: (u) => u.login || '-',
  },
  email: {
    header: 'Email',
    get: (u) => u.email || '-',
  },
  name: {
    header: 'Name',
    get: (u) => [u.firstName, u.lastName].filter(Boolean).join(' ') || '-',
  },
  disabled: {
    header: 'Disabled',
    get: (u) => (u.disabled ? 'Yes' : 'No'),
  },
  locked: {
    header: 'Locked',
    get: (u) => (u.locked ? 'Yes' : 'No'),
  },
  lastLogin: {
    header: 'Last Login',
    get: (u) => u.lastLoginDate || '-',
    extended: true,
  },
  externalId: {
    header: 'External ID',
    get: (u) => u.externalId || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['login', 'name', 'disabled', 'locked'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class BmUsersList extends BmCommand<typeof BmUsersList> {
  static description = t('commands.bm.users.list.description', 'List Business Manager users on an instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count 50',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --columns login,email,lastLogin',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    count: Flags.integer({
      char: 'n',
      description: 'Number of users to return (default 25)',
    }),
    start: Flags.integer({
      description: 'Start index for pagination (default 0)',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ListUsersResult> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const {count, start} = this.flags;

    const backend = this.createUsersBackend();
    this.logger.debug(`Using ${backend.name} backend for users list`);

    this.log(t('commands.bm.users.list.fetching', 'Fetching users from {{hostname}}...', {hostname}));

    const result = await backend.listUsers({count, start});

    if (this.jsonEnabled()) {
      return result;
    }

    const items = result.hits;
    if (items.length === 0) {
      this.log(t('commands.bm.users.list.noUsers', 'No users found.'));
      return result;
    }

    tableRenderer.render(items, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    if (result.total && result.total > items.length) {
      this.log(
        t('commands.bm.users.list.moreUsers', '{{count}} of {{total}} users shown.', {
          count: items.length,
          total: result.total,
        }),
      );
    }

    return result;
  }
}
