/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../../utils/ecdn/index.js';
import {t} from '../../../../i18n/index.js';

type PageShieldPolicyResponse = CdnZonesComponents['schemas']['PageShieldPolicyResponse'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  policies: PageShieldPolicyResponse[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<PageShieldPolicyResponse>> = {
  id: {
    header: 'Policy ID',
    get: (r) => r.id || '-',
  },
  action: {
    header: 'Action',
    get: (r) => r.action || '-',
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  description: {
    header: 'Description',
    get: (r) => r.description || '-',
  },
  value: {
    header: 'Value',
    get: (r) => r.value || '-',
    extended: true,
  },
  expression: {
    header: 'Expression',
    get: (r) => r.expression || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'action', 'enabled', 'description'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Page Shield policies for a zone.
 */
export default class EcdnPageShieldPoliciesList extends EcdnZoneCommand<typeof EcdnPageShieldPoliciesList> {
  static description = t('commands.ecdn.page-shield.policies.list.description', 'List Page Shield policies for a zone');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --extended',
    '<%= config.bin %> <%= command.id %> --tenant-id zzxy_prd --zone my-zone --json',
  ];

  static flags = {
    ...EcdnZoneCommand.baseFlags,
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

    const zoneId = await this.resolveZoneId();

    if (!this.jsonEnabled()) {
      this.log(t('commands.ecdn.page-shield.policies.list.fetching', 'Fetching Page Shield policies...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/page-shield/policies', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.page-shield.policies.list.error', 'Failed to fetch Page Shield policies: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const policies = data?.data ?? [];
    const output: ListOutput = {
      policies,
      total: policies.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (policies.length === 0) {
      this.log(t('commands.ecdn.page-shield.policies.list.noPolicies', 'No Page Shield policies found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.page-shield.policies.list.count', 'Found {{count}} Page Shield policy(ies):', {
        count: policies.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(policies, columns);

    return output;
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
