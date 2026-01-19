/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {Zone} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t} from '../../../i18n/index.js';

/**
 * Response type for the list command.
 */
interface ListOutput {
  zones: Zone[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<Zone>> = {
  zoneId: {
    header: 'Zone ID',
    get: (z) => z.zoneId || '-',
    extended: true,
  },
  name: {
    header: 'Name',
    get: (z) => z.name || '-',
  },
  status: {
    header: 'Status',
    get: (z) => z.status || '-',
  },
};

/** Default columns shown without --extended */
const DEFAULT_COLUMNS = ['name', 'status'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list eCDN zones.
 */
export default class EcdnZonesList extends EcdnCommand<typeof EcdnZonesList> {
  static description = t('commands.ecdn.zones.list.description', 'List all eCDN zones for the organization');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --json',
  ];

  static flags = {
    ...EcdnCommand.baseFlags,
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

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.zones.list.fetching', 'Fetching eCDN zones...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/info', {
      params: {
        path: {organizationId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.zones.list.error', 'Failed to fetch eCDN zones: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const zones = data?.data ?? [];
    const output: ListOutput = {
      zones,
      total: zones.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (zones.length === 0) {
      this.log(t('commands.ecdn.zones.list.noZones', 'No eCDN zones found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.zones.list.count', 'Found {{count}} zone(s):', {
        count: zones.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(zones, columns);

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
