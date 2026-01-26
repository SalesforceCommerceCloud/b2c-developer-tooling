/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listDeployments,
  type ListDeploymentsResult,
  type MrtDeployment,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtDeployment>> = {
  bundleId: {
    header: 'Bundle ID',
    get: (deploy) => deploy.bundle?.id?.toString() ?? '-',
  },
  bundleMessage: {
    header: 'Message',
    get: (deploy) => deploy.bundle?.message ?? '-',
  },
  status: {
    header: 'Status',
    get: (deploy) => deploy.status ?? '-',
  },
  type: {
    header: 'Type',
    get: (deploy) => deploy.deploy_type ?? '-',
  },
  user: {
    header: 'User',
    get: (deploy) => deploy.user ?? '-',
  },
  created: {
    header: 'Created',
    get: (deploy) => (deploy.created_at ? new Date(deploy.created_at).toLocaleString() : '-'),
  },
};

const DEFAULT_COLUMNS = ['bundleId', 'bundleMessage', 'status', 'type', 'created'];

/**
 * List deployment history for an MRT environment.
 */
export default class MrtBundleHistory extends MrtCommand<typeof MrtBundleHistory> {
  static description = withDocs(
    t('commands.mrt.bundle.history.description', 'List deployment history for a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-bundle-history',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --limit 5',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --json',
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

  async run(): Promise<ListDeploymentsResult> {
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {limit, offset} = this.flags;

    this.log(
      t('commands.mrt.bundle.history.fetching', 'Fetching deployment history for {{project}}/{{environment}}...', {
        project,
        environment,
      }),
    );

    const result = await listDeployments(
      {
        projectSlug: project,
        targetSlug: environment,
        limit,
        offset,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.deployments.length === 0) {
        this.log(t('commands.mrt.bundle.history.empty', 'No deployments found.'));
      } else {
        this.log(t('commands.mrt.bundle.history.count', 'Found {{count}} deployment(s):', {count: result.count}));
        createTable(COLUMNS).render(result.deployments, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
