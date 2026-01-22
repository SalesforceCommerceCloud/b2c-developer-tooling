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

type LogpushResponse = CdnZonesComponents['schemas']['LogpushResponse'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  jobs: LogpushResponse[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<LogpushResponse>> = {
  jobId: {
    header: 'Job ID',
    get: (r) => (r.jobId === undefined ? '-' : String(r.jobId)),
  },
  name: {
    header: 'Name',
    get: (r) => r.name || '-',
  },
  logType: {
    header: 'Log Type',
    get: (r) => r.logType || '-',
  },
  enabled: {
    header: 'Enabled',
    get: (r) => (r.enabled ? 'yes' : 'no'),
  },
  destinationPath: {
    header: 'Destination',
    get: (r) => r.destinationPath || '-',
    extended: true,
  },
  lastComplete: {
    header: 'Last Complete',
    get: (r) => r.lastComplete || '-',
    extended: true,
  },
  errorMessage: {
    header: 'Error',
    get: (r) => r.errorMessage || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['jobId', 'name', 'logType', 'enabled'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Logpush jobs for a zone.
 */
export default class EcdnLogpushJobsList extends EcdnZoneCommand<typeof EcdnLogpushJobsList> {
  static description = t('commands.ecdn.logpush.jobs.list.description', 'List Logpush jobs for a zone');

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
      this.log(t('commands.ecdn.logpush.jobs.list.fetching', 'Fetching Logpush jobs...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/logpush/jobs', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.logpush.jobs.list.error', 'Failed to fetch Logpush jobs: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const jobs = data?.data ?? [];
    const output: ListOutput = {
      jobs,
      total: jobs.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (jobs.length === 0) {
      this.log(t('commands.ecdn.logpush.jobs.list.noJobs', 'No Logpush jobs found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.logpush.jobs.list.count', 'Found {{count}} Logpush job(s):', {
        count: jobs.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(jobs, columns);

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
