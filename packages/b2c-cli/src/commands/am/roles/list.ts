/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, Errors} from '@oclif/core';
import {AmCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerRole, RoleCollection} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<AccountManagerRole>> = {
  id: {
    header: 'ID',
    get: (r) => r.id || '-',
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
  },
  roleEnumName: {
    header: 'Role Enum Name',
    get: (r) => r.roleEnumName || '-',
  },
  scope: {
    header: 'Scope',
    get: (r) => r.scope || '-',
  },
  targetType: {
    header: 'Target Type',
    get: (r) => r.targetType || '-',
  },
  twoFAEnabled: {
    header: '2FA Enabled',
    get: (r) => (r.twoFAEnabled ? 'Yes' : 'No'),
  },
  permissions: {
    header: 'Permissions',
    get(r) {
      if (!r.permissions || r.permissions.length === 0) return '-';
      return r.permissions.join(', ');
    },
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'description', 'roleEnumName'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Account Manager roles.
 */
export default class RoleList extends AmCommand<typeof RoleList> {
  static description = t('commands.role.list.description', 'List Account Manager roles');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --size 50',
    '<%= config.bin %> <%= command.id %> --target-type User',
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
    'target-type': Flags.string({
      char: 't',
      description: 'Filter by target type (User or ApiClient)',
      options: ['User', 'ApiClient'],
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

  async run(): Promise<RoleCollection> {
    const {size, page, 'target-type': targetType} = this.flags;

    // Ensure size and page are numbers (oclif might return undefined or string)
    const pageSize = size === undefined ? 20 : Number(size);
    const pageNumber = page === undefined ? 0 : Number(page);

    // Validate size parameter
    if (pageSize < 1 || pageSize > 4000) {
      throw new Errors.CLIError(
        t('commands.role.list.invalidSize', 'Page size must be between 1 and 4000 (inclusive). Received: {{size}}', {
          size: pageSize,
        }),
      );
    }

    // Validate page parameter (must be zero-based index, non-negative)
    if (pageNumber < 0 || !Number.isFinite(pageNumber)) {
      throw new Errors.CLIError(
        t(
          'commands.role.list.invalidPage',
          'Page number must be a non-negative integer (zero-based index). Received: {{page}}',
          {page: pageNumber},
        ),
      );
    }

    this.log(t('commands.role.list.fetching', 'Fetching roles...'));

    const result = await this.accountManagerClient.listRoles({
      size: pageSize,
      page: pageNumber,
      roleTargetType: targetType as 'ApiClient' | 'User' | undefined,
    });

    if (this.jsonEnabled()) {
      return result;
    }

    const roles = result.content || [];
    if (roles.length === 0) {
      this.log(t('commands.role.list.noRoles', 'No roles found.'));
      return result;
    }

    tableRenderer.render(roles, this.getSelectedColumns());

    // Check if there are more pages (if we got a full page of results, there might be more)
    if (roles.length === pageSize) {
      const nextPage = pageNumber + 1;
      this.log(
        t('commands.role.list.moreRoles', 'More roles available. Use --page {{nextPage}} to view the next page.', {
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
