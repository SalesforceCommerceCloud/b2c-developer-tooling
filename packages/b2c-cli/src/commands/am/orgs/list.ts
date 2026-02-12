/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, Errors} from '@oclif/core';
import {AmCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import type {AccountManagerOrganization, OrganizationCollection} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<AccountManagerOrganization>> = {
  id: {
    header: 'ID',
    get: (o) => o.id || '-',
  },
  name: {
    header: 'Name',
    get: (o) => o.name || '-',
  },
  realms: {
    header: 'Realms',
    get: (o) => (o.realms && o.realms.length > 0 ? o.realms.length.toString() : '0'),
  },
  emailsDomains: {
    header: 'Email Domains',
    get(o) {
      const domains = o.emailsDomains as string[] | undefined;
      return domains && domains.length > 0 ? domains.length.toString() : '0';
    },
  },
  twoFARoles: {
    header: '2FA Roles',
    get: (o) => (o.twoFARoles && o.twoFARoles.length > 0 ? o.twoFARoles.length.toString() : '0'),
  },
  twoFAEnabled: {
    header: '2FA Enabled',
    get: (o) => (o.twoFAEnabled ? 'Yes' : 'No'),
  },
  allowedVerifierTypes: {
    header: 'Verifier Types',
    get: (o) =>
      o.allowedVerifierTypes && o.allowedVerifierTypes.length > 0 ? o.allowedVerifierTypes.length.toString() : '0',
  },
  vaasEnabled: {
    header: 'VaaS Enabled',
    get: (o) => (o.vaasEnabled ? 'Yes' : 'No'),
  },
  sfIdentityFederation: {
    header: 'SF Identity',
    get: (o) => (o.sfIdentityFederation ? 'Yes' : 'No'),
  },
  passwordMinEntropy: {
    header: 'Min Password Length',
    get(o) {
      const minEntropy = o.passwordMinEntropy as number | undefined;
      return minEntropy === undefined ? '-' : minEntropy.toString();
    },
  },
};

const DEFAULT_COLUMNS = [
  'id',
  'name',
  'realms',
  'emailsDomains',
  'twoFAEnabled',
  'vaasEnabled',
  'sfIdentityFederation',
  'passwordMinEntropy',
];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list Account Manager organizations.
 */
export default class OrgList extends AmCommand<typeof OrgList> {
  static description = t('commands.org.list.description', 'List Account Manager organizations');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --size 50',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    size: Flags.integer({
      char: 's',
      description: 'Page size (default: 25, min: 1, max: 5000)',
    }),
    page: Flags.integer({
      description: 'Page number (zero-based index, default: 0, min: 0)',
    }),
    all: Flags.boolean({
      char: 'a',
      description: 'Return all organizations (uses max page size of 5000)',
    }),
    columns: Flags.string({
      description: 'Comma-separated list of columns to display',
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Show extended columns',
    }),
  };

  async run(): Promise<OrganizationCollection> {
    const {size = 25, page = 0, all = false} = this.flags;

    // Validate size
    if (size !== undefined) {
      if (size < 1) {
        throw new Errors.CLIError(t('commands.org.list.errors.sizeMin', 'Size must be at least 1'));
      }
      if (size > 5000) {
        throw new Errors.CLIError(t('commands.org.list.errors.sizeMax', 'Size cannot exceed 5000'));
      }
    }

    // Validate page
    if (page !== undefined && page < 0) {
      throw new Errors.CLIError(t('commands.org.list.errors.pageMin', 'Page must be a non-negative integer'));
    }

    this.log(t('commands.org.list.fetching', 'Fetching organizations...'));

    const result = await this.accountManagerClient.listOrgs({
      size,
      page,
      all,
    });

    if (this.jsonEnabled()) {
      return result;
    }

    if (!result.content || result.content.length === 0) {
      this.log(t('commands.org.list.noResults', 'No organizations found'));
      return result;
    }

    // Determine columns to display
    let columnsToShow = DEFAULT_COLUMNS;
    if (this.flags.columns) {
      columnsToShow = this.flags.columns.split(',').map((c) => c.trim());
    } else if (this.flags.extended) {
      columnsToShow = Object.keys(COLUMNS);
    }

    tableRenderer.render(result.content, columnsToShow);

    // Show pagination hint if more pages available
    const totalPages = result.totalPages ?? 0;
    const currentPage = result.number ?? 0;
    if (totalPages > 1 && currentPage < totalPages - 1) {
      this.log(
        t('commands.org.list.morePages', 'More organizations available. Use --page {{page}} to view the next page.', {
          page: currentPage + 1,
        }),
      );
    }

    return result;
  }
}
