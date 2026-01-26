/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listRedirects, type ListRedirectsResult, type MrtRedirect} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtRedirect>> = {
  fromPath: {
    header: 'From',
    get: (r) => r.from_path ?? '-',
  },
  toUrl: {
    header: 'To',
    get: (r) => r.to_url ?? '-',
  },
  status: {
    header: 'HTTP',
    get: (r) => r.http_status_code?.toString() ?? '301',
  },
  publishingStatus: {
    header: 'Status',
    get: (r) => r.publishing_status ?? '-',
  },
  forwardQs: {
    header: 'Fwd QS',
    get: (r) => (r.forward_querystring ? 'Yes' : 'No'),
  },
};

const DEFAULT_COLUMNS = ['fromPath', 'toUrl', 'status', 'publishingStatus'];

/**
 * List redirects for an MRT environment.
 */
export default class MrtRedirectList extends MrtCommand<typeof MrtRedirectList> {
  static description = t('commands.mrt.redirect.list.description', 'List redirects for a Managed Runtime environment');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --search "/old"',
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
    search: Flags.string({
      description: 'Search term for filtering',
    }),
  };

  async run(): Promise<ListRedirectsResult> {
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

    const {limit, offset, search} = this.flags;

    this.log(
      t('commands.mrt.redirect.list.fetching', 'Fetching redirects for {{project}}/{{environment}}...', {
        project,
        environment,
      }),
    );

    const result = await listRedirects(
      {
        projectSlug: project,
        targetSlug: environment,
        limit,
        offset,
        search,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.redirects.length === 0) {
        this.log(t('commands.mrt.redirect.list.empty', 'No redirects found.'));
      } else {
        this.log(t('commands.mrt.redirect.list.count', 'Found {{count}} redirect(s):', {count: result.count}));
        createTable(COLUMNS).render(result.redirects, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
