/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {
  InstanceCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {listBmUsers, type BmUser, type BmUsers} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<BmUser>> = {
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
    get: (u) => [u.first_name, u.last_name].filter(Boolean).join(' ') || '-',
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
    get: (u) => u.last_login_date || '-',
    extended: true,
  },
  externalId: {
    header: 'External ID',
    get: (u) => u.external_id || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['login', 'name', 'disabled', 'locked'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class BmUsersList extends InstanceCommand<typeof BmUsersList> {
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

  async run(): Promise<BmUsers> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const {count, start} = this.flags;

    this.log(t('commands.bm.users.list.fetching', 'Fetching users from {{hostname}}...', {hostname}));

    const users = await listBmUsers(this.instance, {count, start});

    if (this.jsonEnabled()) {
      return users;
    }

    const items = users.data ?? [];
    if (items.length === 0) {
      this.log(t('commands.bm.users.list.noUsers', 'No users found.'));
      return users;
    }

    tableRenderer.render(items, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    if (users.total && users.total > items.length) {
      this.log(
        t('commands.bm.users.list.moreUsers', '{{count}} of {{total}} users shown.', {
          count: items.length,
          total: users.total,
        }),
      );
    }

    return users;
  }
}
