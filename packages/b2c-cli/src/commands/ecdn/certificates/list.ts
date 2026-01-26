/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnZoneCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type Certificate = CdnZonesComponents['schemas']['Certificate'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  certificates: Certificate[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<Certificate>> = {
  certificateId: {
    header: 'Certificate ID',
    get: (c) => c.certificateId || '-',
    extended: true,
  },
  hosts: {
    header: 'Hosts',
    get: (c) => c.hosts?.join(', ') || '-',
  },
  status: {
    header: 'Status',
    get: (c) => c.status || '-',
  },
  certificateType: {
    header: 'Type',
    get: (c) => c.certificateType || '-',
  },
  expiresOn: {
    header: 'Expires',
    get: (c) => (c.expiresOn ? new Date(c.expiresOn).toLocaleDateString() : '-'),
    extended: true,
  },
  issuer: {
    header: 'Issuer',
    get: (c) => c.issuer || '-',
    extended: true,
  },
};

/** Default columns shown without --extended */
const DEFAULT_COLUMNS = ['hosts', 'status', 'certificateType'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list certificates for a zone.
 */
export default class EcdnCertificatesList extends EcdnZoneCommand<typeof EcdnCertificatesList> {
  static description = withDocs(
    t('commands.ecdn.certificates.list.description', 'List certificates for a zone'),
    '/cli/ecdn.html#b2c-ecdn-certificates-list',
  );

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
      this.log(t('commands.ecdn.certificates.list.fetching', 'Fetching certificates...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/zones/{zoneId}/certificates', {
      params: {
        path: {organizationId, zoneId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.certificates.list.error', 'Failed to fetch certificates: {{message}}', {
          message: formatApiError(error),
        }),
      );
    }

    const certificates = data?.data ?? [];
    const output: ListOutput = {
      certificates,
      total: certificates.length,
    };

    if (this.jsonEnabled()) {
      return output;
    }

    if (certificates.length === 0) {
      this.log(t('commands.ecdn.certificates.list.noCertificates', 'No certificates found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.certificates.list.count', 'Found {{count}} certificate(s):', {
        count: certificates.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(certificates, columns);

    return output;
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
