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
import {searchBmUsers, type BmUser, type BmUserSearchResult} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<BmUser>> = {
  login: {header: 'Login', get: (u) => u.login || '-'},
  email: {header: 'Email', get: (u) => u.email || '-'},
  name: {
    header: 'Name',
    get: (u) => [u.first_name, u.last_name].filter(Boolean).join(' ') || '-',
  },
  disabled: {header: 'Disabled', get: (u) => (u.disabled ? 'Yes' : 'No')},
  locked: {header: 'Locked', get: (u) => (u.locked ? 'Yes' : 'No')},
  lastLogin: {header: 'Last Login', get: (u) => u.last_login_date || '-'},
  externalId: {header: 'External ID', get: (u) => u.external_id || '-', extended: true},
};

const DEFAULT_COLUMNS = ['login', 'name', 'disabled', 'locked', 'lastLogin'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class BmUsersSearch extends InstanceCommand<typeof BmUsersSearch> {
  static description = t(
    'commands.bm.users.search.description',
    'Search Business Manager users by login, email, name, lock state, or disabled state',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --search-phrase smith',
    '<%= config.bin %> <%= command.id %> --login user@example.com',
    '<%= config.bin %> <%= command.id %> --email user@example.com',
    '<%= config.bin %> <%= command.id %> --locked',
    '<%= config.bin %> <%= command.id %> --disabled',
    '<%= config.bin %> <%= command.id %> --sort-by last_login_date --sort-order desc',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --columns login,email,lastLogin',
    '<%= config.bin %> <%= command.id %> --query \'{"text_query":{"fields":["login"],"search_phrase":"foo"}}\'',
  ];

  static flags = {
    'search-phrase': Flags.string({
      description: 'Free-text phrase searched across login, email, first_name, last_name',
    }),
    login: Flags.string({
      description: 'Match users with a specific login',
    }),
    email: Flags.string({
      description: 'Match users with a specific email',
    }),
    locked: Flags.boolean({
      description: 'Match locked users (use --no-locked for unlocked)',
      allowNo: true,
    }),
    disabled: Flags.boolean({
      description: 'Match disabled users (use --no-disabled for enabled)',
      allowNo: true,
    }),
    'sort-by': Flags.string({
      description: 'Sort field (login, email, first_name, last_name, external_id, last_login_date)',
    }),
    'sort-order': Flags.string({
      description: 'Sort order',
      options: ['asc', 'desc'],
    }),
    query: Flags.string({
      description: 'Raw OCAPI query JSON (overrides convenience flags)',
    }),
    count: Flags.integer({
      char: 'n',
      description: 'Number of users to return (default 25)',
    }),
    start: Flags.integer({
      description: 'Start index for pagination (default 0)',
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<BmUserSearchResult> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const flags = this.flags;

    let parsedQuery: unknown;
    if (flags.query) {
      try {
        parsedQuery = JSON.parse(flags.query);
      } catch (error) {
        this.error(
          t('commands.bm.users.search.invalidQuery', 'Invalid --query JSON: {{message}}', {
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    }

    this.log(t('commands.bm.users.search.searching', 'Searching users on {{hostname}}...', {hostname}));

    const result = await searchBmUsers(this.instance, {
      query: parsedQuery,
      searchPhrase: flags['search-phrase'],
      login: flags.login,
      email: flags.email,
      locked: flags.locked,
      disabled: flags.disabled,
      sortBy: flags['sort-by'],
      sortOrder: flags['sort-order'] as 'asc' | 'desc' | undefined,
      start: flags.start,
      count: flags.count,
    });

    if (this.jsonEnabled()) {
      return result;
    }

    const hits = result.hits ?? [];
    if (hits.length === 0) {
      this.log(t('commands.bm.users.search.noMatches', 'No users matched.'));
      return result;
    }

    tableRenderer.render(hits, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    if (result.total && result.total > hits.length) {
      this.log(
        t('commands.bm.users.search.moreUsers', '{{count}} of {{total}} users shown.', {
          count: hits.length,
          total: result.total,
        }),
      );
    }

    return result;
  }
}
