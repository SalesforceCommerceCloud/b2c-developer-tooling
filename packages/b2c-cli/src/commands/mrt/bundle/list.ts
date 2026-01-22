/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listBundles, type ListBundlesResult, type MrtBundle} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtBundle>> = {
  id: {
    header: 'ID',
    get: (bundle) => bundle.id?.toString() ?? '-',
  },
  message: {
    header: 'Message',
    get: (bundle) => bundle.message ?? '-',
  },
  status: {
    header: 'Status',
    get: (bundle) => bundle.status?.toString() ?? '-',
  },
  user: {
    header: 'User',
    get: (bundle) => bundle.user ?? '-',
  },
  created: {
    header: 'Created',
    get: (bundle) => (bundle.created_at ? new Date(bundle.created_at).toLocaleString() : '-'),
  },
};

const DEFAULT_COLUMNS = ['id', 'message', 'status', 'user', 'created'];

/**
 * List bundles for an MRT project.
 */
export default class MrtBundleList extends MrtCommand<typeof MrtBundleList> {
  static description = t('commands.mrt.bundle.list.description', 'List bundles for a Managed Runtime project');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --limit 10',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
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

  async run(): Promise<ListBundlesResult> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {limit, offset} = this.flags;

    this.log(t('commands.mrt.bundle.list.fetching', 'Fetching bundles for {{project}}...', {project}));

    const result = await listBundles(
      {
        projectSlug: project,
        limit,
        offset,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.bundles.length === 0) {
        this.log(t('commands.mrt.bundle.list.empty', 'No bundles found.'));
      } else {
        this.log(t('commands.mrt.bundle.list.count', 'Found {{count}} bundle(s):', {count: result.count}));
        createTable(COLUMNS).render(result.bundles, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
