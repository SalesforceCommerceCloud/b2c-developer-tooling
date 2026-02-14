/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, Errors} from '@oclif/core';
import {AmCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerApiClient, APIClientCollection} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

/** Format date as MM/DD/YYYY HH:MM:SS with zero-padding for equal column width. */
function formatDateEqualLength(value: Date | number | string): string {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${h}:${m}:${s}`;
}

const COLUMNS: Record<string, ColumnDef<AccountManagerApiClient>> = {
  id: {
    header: 'ID',
    get: (c) => c.id || '-',
  },
  name: {
    header: 'Name',
    get: (c) => c.name || '-',
  },
  description: {
    header: 'Description',
    get: (c) => c.description || '-',
  },
  active: {
    header: 'Active',
    get: (c) => (c.active ? 'Yes' : 'No'),
  },
  tokenEndpointAuthMethod: {
    header: 'Auth Method',
    get: (c) => c.tokenEndpointAuthMethod || '-',
  },
  createdAt: {
    header: 'Created',
    get: (c) => (c.createdAt ? formatDateEqualLength(c.createdAt) : '-'),
  },
  lastAuthenticatedDate: {
    header: 'Last Auth',
    get: (c) => c.lastAuthenticatedDate || '-',
  },
  disabledTimestamp: {
    header: 'Disabled',
    get: (c) => (c.disabledTimestamp ? formatDateEqualLength(c.disabledTimestamp) : '-'),
  },
};

const DEFAULT_COLUMNS = ['id', 'name', 'description', 'active', 'tokenEndpointAuthMethod', 'createdAt'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Account Manager API clients.
 */
export default class ClientList extends AmCommand<typeof ClientList> {
  static description = t('commands.client.list.description', 'List Account Manager API clients');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --size 50',
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

  async run(): Promise<APIClientCollection> {
    const {size, page} = this.flags;

    const pageSize = size === undefined ? 20 : Number(size);
    const pageNumber = page === undefined ? 0 : Number(page);

    if (pageSize < 1 || pageSize > 4000) {
      throw new Errors.CLIError(
        t('commands.client.list.invalidSize', 'Page size must be between 1 and 4000 (inclusive). Received: {{size}}', {
          size: pageSize,
        }),
      );
    }

    if (pageNumber < 0 || !Number.isFinite(pageNumber)) {
      throw new Errors.CLIError(
        t(
          'commands.client.list.invalidPage',
          'Page number must be a non-negative integer (zero-based index). Received: {{page}}',
          {page: pageNumber},
        ),
      );
    }

    try {
      this.log(t('commands.client.list.fetching', 'Fetching API clients...'));

      const result = await this.accountManagerClient.listApiClients({
        size: pageSize,
        page: pageNumber,
      });

      if (this.jsonEnabled()) {
        return result;
      }

      const clients = result.content || [];
      if (clients.length === 0) {
        this.log(t('commands.client.list.noClients', 'No API clients found.'));
        return result;
      }

      const columns = this.getSelectedColumns();
      tableRenderer.render(clients, columns);

      if (clients.length === pageSize) {
        const nextPage = pageNumber + 1;
        this.log(
          t(
            'commands.client.list.moreClients',
            'More API clients available. Use --page {{nextPage}} to view the next page.',
            {
              nextPage,
            },
          ),
        );
      }

      return result;
    } catch (err) {
      const tenantId = this.requireTenantId();
      try {
        await this.accountManagerClient.getOrg(tenantId);
      } catch (orgErr) {
        // Check if the error from getOrg indicates that the organization was not found.
        // This check might need to be more robust depending on the specific error thrown by getOrg.
        // Assuming getOrg throws an error with a status code or a specific message for 'not found'.
        // For now, we'll assume a generic error implies the tenant might not exist if listApiClients also failed.
        // A more specific check would be to inspect orgErr for a 404 status or a "not found" message.
        if (orgErr instanceof Error && orgErr.message.includes('404')) {
           throw new Errors.CLIError(t('commands.client.list.tenantNotFound', 'The specified tenant (organization) does not exist. Please ensure your tenant ID is correct.'));
        } else {
          // If getOrg threw a different error, re-throw the original error from listApiClients
          throw err;
        }
      }
      // If getOrg succeeded, it means the tenant exists, so re-throw the original error from listApiClients.
      throw err;
    }
  }

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
