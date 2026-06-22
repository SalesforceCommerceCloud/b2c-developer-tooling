/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {
  InstanceCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getApiErrorMessage,
  isOcapiDeprecatedFault,
  OCAPI_DEPRECATED_MESSAGE,
} from '@salesforce/b2c-tooling-sdk/clients';
import type {OcapiComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type Sites = OcapiComponents['schemas']['sites'];
type Site = OcapiComponents['schemas']['site'];

const COLUMNS: Record<string, ColumnDef<Site>> = {
  id: {
    header: 'ID',
    get: (s) => s.id || '-',
  },
  displayName: {
    header: 'Display Name',
    get: (s) => s.display_name?.default || s.id || '-',
  },
  status: {
    header: 'Status',
    get: (s) => s.storefront_status || 'unknown',
  },
};

const DEFAULT_COLUMNS = ['id', 'displayName', 'status'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class SitesList extends InstanceCommand<typeof SitesList> {
  static description = withDocs(
    t('commands.sites.list.description', 'List sites on a B2C Commerce instance'),
    '/cli/sites.html#b2c-sites-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --columns id,status',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<Sites> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;

    this.log(t('commands.sites.list.fetching', 'Fetching sites from {{hostname}}...', {hostname}));

    const {data, error, response} = await this.instance.ocapi.GET('/sites', {
      params: {query: {select: '(**)'}},
    });

    if (error) {
      if (isOcapiDeprecatedFault(error)) {
        this.error(OCAPI_DEPRECATED_MESSAGE);
      }
      this.error(
        t('commands.sites.list.error', 'Failed to fetch sites: {{message}}', {
          message: getApiErrorMessage(error, response),
        }),
      );
    }

    const sites = data as Sites;

    // In JSON mode, just return the data - oclif handles output to stdout
    if (this.jsonEnabled()) {
      return sites;
    }

    // Human-readable table output to stdout
    if (!sites || sites.count === 0) {
      ux.stdout(t('commands.sites.list.noSites', 'No sites found.'));
      return sites;
    }

    tableRenderer.render(
      sites.data ?? [],
      selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)),
    );

    return sites;
  }
}
