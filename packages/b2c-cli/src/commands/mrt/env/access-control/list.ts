/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listAccessControlHeaders,
  type ListAccessControlHeadersResult,
  type MrtAccessControlHeader,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtAccessControlHeader>> = {
  id: {
    header: 'ID',
    get: (h) => h.id ?? '-',
  },
  value: {
    header: 'Value',
    get: (h) => h.value ?? '-',
  },
  status: {
    header: 'Status',
    get: (h) => h.publishing_status_description ?? '-',
  },
  created: {
    header: 'Created',
    get: (h) => (h.created_at ? new Date(h.created_at).toLocaleString() : '-'),
  },
};

const DEFAULT_COLUMNS = ['id', 'value', 'status', 'created'];

/**
 * List access control headers for an MRT environment.
 */
export default class MrtAccessControlList extends MrtCommand<typeof MrtAccessControlList> {
  static description = t(
    'commands.mrt.access-control.list.description',
    'List access control headers for a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment production',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --json',
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

  async run(): Promise<ListAccessControlHeadersResult> {
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
      t(
        'commands.mrt.access-control.list.fetching',
        'Fetching access control headers for {{project}}/{{environment}}...',
        {
          project,
          environment,
        },
      ),
    );

    const result = await listAccessControlHeaders(
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
      if (result.headers.length === 0) {
        this.log(t('commands.mrt.access-control.list.empty', 'No access control headers found.'));
      } else {
        this.log(
          t('commands.mrt.access-control.list.count', 'Found {{count}} access control header(s):', {
            count: result.count,
          }),
        );
        createTable(COLUMNS).render(result.headers, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
