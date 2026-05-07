/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {
  MrtCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listCertificates,
  type ListCertificatesResult,
  type MrtCertificateListCreate,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtCertificateListCreate>> = {
  id: {header: 'ID', get: (c) => c.id?.toString() ?? '-'},
  domain: {header: 'Domain', get: (c) => c.domain_name ?? '-'},
  validation: {header: 'Validation', get: (c) => c.validation_status ?? '-'},
  expires: {
    header: 'Expires',
    get: (c) => (c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '-'),
  },
  renewal: {header: 'Renewal', get: (c) => (c.renewal_status as null | string) ?? '-'},
};

const DEFAULT_COLUMNS = ['id', 'domain', 'validation', 'expires', 'renewal'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class MrtOrgCertList extends MrtCommand<typeof MrtOrgCertList> {
  static description = withDocs(
    t('commands.mrt.org.cert.list.description', 'List custom domain certificates for an organization'),
    '/cli/mrt.html#b2c-mrt-org-cert-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --org my-org',
    '<%= config.bin %> <%= command.id %> --org my-org --custom-only',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    org: Flags.string({description: 'Organization slug', required: true}),
    limit: Flags.integer({description: 'Maximum number of results to return'}),
    offset: Flags.integer({description: 'Offset for pagination'}),
    search: Flags.string({description: 'Search term for filtering'}),
    'custom-only': Flags.boolean({description: 'Show only customer-managed certificates'}),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ListCertificatesResult> {
    this.requireMrtCredentials();

    const {org, limit, offset, search, 'custom-only': customOnly} = this.flags;

    const result = await listCertificates(
      {
        organizationSlug: org,
        limit,
        offset,
        search,
        customOnly,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.certificates.length === 0) {
        this.log(t('commands.mrt.org.cert.list.empty', 'No certificates found.'));
      } else {
        this.log(t('commands.mrt.org.cert.list.count', 'Found {{count}} certificate(s):', {count: result.count}));
        tableRenderer.render(
          result.certificates,
          selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)),
        );
      }
    }

    return result;
  }
}
