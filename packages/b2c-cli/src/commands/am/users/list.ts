/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, Errors} from '@oclif/core';
import {AmCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerUser, UserCollection} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<AccountManagerUser>> = {
  mail: {
    header: 'Email',
    get: (u) => u.mail || '-',
  },
  firstName: {
    header: 'First Name',
    get: (u) => u.firstName || '-',
  },
  lastName: {
    header: 'Last Name',
    get: (u) => u.lastName || '-',
  },
  userState: {
    header: 'State',
    get: (u) => u.userState || '-',
  },
  passwordExpired: {
    header: 'Password Expired',
    get: (u) => (u.passwordExpirationTimestamp ? 'Yes' : 'No'),
  },
  twoFAEnabled: {
    header: '2FA Enabled',
    get: (u) => (u.verifiers && u.verifiers.length > 0 ? 'Yes' : 'No'),
  },
  linkedToSfIdentity: {
    header: 'Linked to SF',
    get: (u) => (u.linkedToSfIdentity ? 'Yes' : 'No'),
  },
  lastLoginDate: {
    header: 'Last Login',
    get: (u) => u.lastLoginDate || '-',
  },
  roles: {
    header: 'Roles',
    get(u) {
      if (!u.roles || u.roles.length === 0) return '-';
      return u.roles.map((r) => (typeof r === 'string' ? r : r.roleEnumName || '')).join(', ');
    },
    extended: true,
  },
  organizations: {
    header: 'Organizations',
    get(u) {
      if (!u.organizations || u.organizations.length === 0) return '-';
      return u.organizations.map((o) => (typeof o === 'string' ? o : o.id || '')).join(', ');
    },
    extended: true,
  },
};

const DEFAULT_COLUMNS = [
  'mail',
  'firstName',
  'lastName',
  'userState',
  'passwordExpired',
  'twoFAEnabled',
  'linkedToSfIdentity',
  'lastLoginDate',
];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Account Manager users.
 */
export default class UserList extends AmCommand<typeof UserList> {
  static description = t('commands.user.list.description', 'List Account Manager users');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --size 50',
    '<%= config.bin %> <%= command.id %> --size 100',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    size: Flags.integer({
      char: 's',
      description: 'Page size (default: 20, min: 1, max: 4000)',
    }),
    page: Flags.integer({
      description: 'Page number (zero-based index, default: 0, min: 0)',
    }),
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Show all columns including extended fields',
      default: false,
    }),
  };

  async run(): Promise<UserCollection> {
    const {size, page} = this.flags;

    // Ensure size and page are numbers (oclif might return undefined or string)
    const pageSize = size === undefined ? 20 : Number(size);
    const pageNumber = page === undefined ? 0 : Number(page);

    // Validate size parameter
    if (pageSize < 1 || pageSize > 4000) {
      throw new Errors.CLIError(
        t('commands.user.list.invalidSize', 'Page size must be between 1 and 4000 (inclusive). Received: {{size}}', {
          size: pageSize,
        }),
      );
    }

    // Validate page parameter (must be zero-based index, non-negative)
    if (pageNumber < 0 || !Number.isFinite(pageNumber)) {
      throw new Errors.CLIError(
        t(
          'commands.user.list.invalidPage',
          'Page number must be a non-negative integer (zero-based index). Received: {{page}}',
          {page: pageNumber},
        ),
      );
    }

    this.log(t('commands.user.list.fetching', 'Fetching users...'));

    const result = await this.accountManagerClient.listUsers({
      size: pageSize,
      page: pageNumber,
    });

    if (this.jsonEnabled()) {
      return result;
    }

    const users = result.content || [];
    if (users.length === 0) {
      this.log(t('commands.user.list.noUsers', 'No users found.'));
      return result;
    }

    tableRenderer.render(users, this.getSelectedColumns());

    // Check if there are more pages (if we got a full page of results, there might be more)
    if (users.length === pageSize) {
      const nextPage = pageNumber + 1;
      this.log(
        t('commands.user.list.moreUsers', 'More users available. Use --page {{nextPage}} to view the next page.', {
          nextPage,
        }),
      );
    }

    return result;
  }

  /**
   * Determines which columns to display based on flags.
   */
  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      const requested = columnsFlag.split(',').map((c) => c.trim());
      const valid = tableRenderer.validateColumnKeys(requested);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${tableRenderer.getColumnKeys().join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      return tableRenderer.getColumnKeys();
    }

    return DEFAULT_COLUMNS;
  }
}
