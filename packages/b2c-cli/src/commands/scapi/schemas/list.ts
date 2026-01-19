/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {SchemaListItem} from '@salesforce/b2c-tooling-sdk/clients';
import {ScapiSchemasCommand, formatApiError} from '../../../utils/scapi/schemas.js';
import {t} from '../../../i18n/index.js';

/**
 * Response type for the list command.
 */
interface ListOutput {
  schemas: SchemaListItem[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<SchemaListItem>> = {
  apiFamily: {
    header: 'API Family',
    get: (s) => s.apiFamily || '-',
  },
  apiName: {
    header: 'API Name',
    get: (s) => s.apiName || '-',
  },
  apiVersion: {
    header: 'Version',
    get: (s) => s.apiVersion || '-',
  },
  status: {
    header: 'Status',
    get: (s) => s.status || '-',
  },
  schemaVersion: {
    header: 'Schema Ver',
    get: (s) => s.schemaVersion || '-',
    extended: true,
  },
  link: {
    header: 'Link',
    get: (s) => s.link || '-',
    extended: true,
  },
};

/** Default columns shown without --extended */
const DEFAULT_COLUMNS = ['apiFamily', 'apiName', 'apiVersion', 'status'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list available SCAPI schemas.
 */
export default class ScapiSchemasList extends ScapiSchemasCommand<typeof ScapiSchemasList> {
  static description = t('commands.scapi.schemas.list.description', 'List available SCAPI schemas');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --api-family shopper',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --api-name products',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --status current',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --json',
  ];

  static flags = {
    ...ScapiSchemasCommand.baseFlags,
    'api-family': Flags.string({
      description: t('flags.apiFamily.description', 'Filter by API family (e.g., shopper, admin)'),
    }),
    'api-name': Flags.string({
      description: t('flags.apiName.description', 'Filter by API name (e.g., products, orders)'),
    }),
    'api-version': Flags.string({
      description: t('flags.apiVersion.description', 'Filter by API version (e.g., v1)'),
    }),
    status: Flags.string({
      char: 's',
      description: t('flags.status.description', 'Filter by schema status'),
      options: ['current', 'deprecated'],
    }),
    columns: Flags.string({
      char: 'c',
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: t('flags.extended.description', 'Show all columns including extended fields'),
      default: false,
    }),
  };

  async run(): Promise<ListOutput> {
    this.requireOAuthCredentials();

    const {'api-family': apiFamily, 'api-name': apiName, 'api-version': apiVersion, status} = this.flags;

    if (!this.jsonEnabled()) {
      this.log(t('commands.scapi.schemas.list.fetching', 'Fetching SCAPI schemas...'));
    }

    const client = this.getSchemasClient();

    const {data, error} = await client.GET('/organizations/{organizationId}/schemas', {
      params: {
        path: {organizationId: this.getOrganizationId()},
        query: {
          apiFamily: apiFamily || undefined,
          apiName: apiName || undefined,
          apiVersion: apiVersion || undefined,
          status: status as 'current' | 'deprecated' | undefined,
        },
      },
    });

    if (error) {
      this.error(
        t('commands.scapi.schemas.list.error', 'Failed to fetch SCAPI schemas: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const schemas = data?.data ?? [];
    const output: ListOutput = {
      schemas,
      total: data?.total ?? schemas.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (schemas.length === 0) {
      this.log(t('commands.scapi.schemas.list.noSchemas', 'No schemas found.'));
      return output;
    }

    this.log(
      t('commands.scapi.schemas.list.count', 'Found {{count}} schema(s):', {
        count: schemas.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(schemas, columns);

    return output;
  }

  /**
   * Determines which columns to display based on flags.
   */
  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      // User specified explicit columns
      const requested = columnsFlag.split(',').map((c) => c.trim());
      const valid = tableRenderer.validateColumnKeys(requested);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${tableRenderer.getColumnKeys().join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      // Show all columns
      return tableRenderer.getColumnKeys();
    }

    // Default columns (non-extended)
    return DEFAULT_COLUMNS;
  }
}
