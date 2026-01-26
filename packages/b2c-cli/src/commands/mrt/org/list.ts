/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listOrganizations,
  type ListOrganizationsResult,
  type MrtOrganization,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtOrganization>> = {
  name: {
    header: 'Name',
    get: (org) => org.name,
  },
  slug: {
    header: 'Slug',
    get: (org) => org.slug,
  },
  status: {
    header: 'Status',
    get: (org) => org.deletion_status ?? 'active',
  },
  created: {
    header: 'Created',
    get: (org) => (org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'),
  },
};

const DEFAULT_COLUMNS = ['name', 'slug', 'status', 'created'];

/**
 * List MRT organizations accessible to the authenticated user.
 */
export default class MrtOrgList extends MrtCommand<typeof MrtOrgList> {
  static description = withDocs(
    t('commands.mrt.org.list.description', 'List Managed Runtime organizations'),
    '/cli/mrt.html#b2c-mrt-org-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 10',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    limit: Flags.integer({
      description: 'Maximum number of results to return',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination',
    }),
  };

  async run(): Promise<ListOrganizationsResult> {
    this.requireMrtCredentials();

    const {limit, offset} = this.flags;

    this.log(t('commands.mrt.org.list.fetching', 'Fetching organizations...'));

    const result = await listOrganizations(
      {
        limit,
        offset,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.organizations.length === 0) {
        this.log(t('commands.mrt.org.list.empty', 'No organizations found.'));
      } else {
        this.log(t('commands.mrt.org.list.count', 'Found {{count}} organization(s):', {count: result.count}));
        createTable(COLUMNS).render(result.organizations, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
