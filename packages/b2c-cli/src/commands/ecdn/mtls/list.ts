/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {CdnZonesComponents} from '@salesforce/b2c-tooling-sdk/clients';
import {EcdnCommand, formatApiError} from '../../../utils/ecdn/index.js';
import {t, withDocs} from '../../../i18n/index.js';

type MtlsCertificateResponse = CdnZonesComponents['schemas']['MtlsCertificateResponse'];

/**
 * Response type for the list command.
 */
interface ListOutput {
  certificates: MtlsCertificateResponse[];
  total: number;
}

const COLUMNS: Record<string, ColumnDef<MtlsCertificateResponse>> = {
  mtlsCertificateId: {
    header: 'Certificate ID',
    get: (r) => r.mtlsCertificateId || '-',
  },
  mtlsCertificateName: {
    header: 'Name',
    get: (r) => r.mtlsCertificateName || '-',
  },
  issuer: {
    header: 'Issuer',
    get: (r) => r.issuer || '-',
  },
  expiresOn: {
    header: 'Expires',
    get: (r) => r.expiresOn || '-',
  },
  mtlsAssociatedCodeUploadHostname: {
    header: 'Hostname',
    get: (r) => r.mtlsAssociatedCodeUploadHostname || '-',
    extended: true,
  },
  ca: {
    header: 'CA',
    get: (r) => (r.ca ? 'yes' : 'no'),
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['mtlsCertificateId', 'mtlsCertificateName', 'issuer', 'expiresOn'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list mTLS certificates for an organization.
 */
export default class EcdnMtlsList extends EcdnCommand<typeof EcdnMtlsList> {
  static description = withDocs(
    t('commands.ecdn.mtls.list.description', 'List mTLS certificates for code upload'),
    '/cli/ecdn.html#b2c-ecdn-mtls-list',
  );

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
      this.log(t('commands.ecdn.mtls.list.fetching', 'Fetching mTLS certificates...'));
    }

    const client = this.getCdnZonesClient();
    const organizationId = this.getOrganizationId();

    const {data, error} = await client.GET('/organizations/{organizationId}/mtls/code-upload-certificates', {
      params: {
        path: {organizationId},
      },
    });

    if (error) {
      this.error(
        t('commands.ecdn.mtls.list.error', 'Failed to fetch mTLS certificates: {{message}}', {
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
      this.log(t('commands.ecdn.mtls.list.noCertificates', 'No mTLS certificates found.'));
      return output;
    }

    this.log(
      t('commands.ecdn.mtls.list.count', 'Found {{count}} mTLS certificate(s):', {
        count: certificates.length,
      }),
    );
    this.log('');

    const columns = this.getSelectedColumns();
    tableRenderer.render(certificates, columns);

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
