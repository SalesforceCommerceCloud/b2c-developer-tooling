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
import {createSitesBackend, type SiteInfo} from '@salesforce/b2c-tooling-sdk/operations/sites';
import {t, withDocs} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<SiteInfo>> = {
  id: {
    header: 'ID',
    get: (s) => s.id || '-',
  },
  displayName: {
    header: 'Display Name',
    get: (s) => s.displayName || s.id || '-',
  },
  status: {
    header: 'Status',
    get: (s) => s.storefrontStatus || 'unknown',
  },
};

const DEFAULT_COLUMNS = ['id', 'displayName', 'status'];

const tableRenderer = new TableRenderer(COLUMNS);

interface SitesListResult {
  count: number;
  data: SiteInfo[];
  total: number;
}

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

  async run(): Promise<SitesListResult> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const backend = createSitesBackend({
      preference: this.apiBackendPreference,
      instance: this.instance,
      shortCode: this.resolvedConfig.values.shortCode,
      tenantId: this.resolvedConfig.values.tenantId,
      auth: this.hasScapiConfig() ? this.getOAuthStrategy() : undefined,
    });
    this.logger.debug(`Using ${backend.name} backend for sites list`);

    this.log(t('commands.sites.list.fetching', 'Fetching sites from {{hostname}}...', {hostname}));

    const sites = await backend.listSites();

    const result: SitesListResult = {count: sites.length, data: sites, total: sites.length};

    // In JSON mode, just return the data - oclif handles output to stdout
    if (this.jsonEnabled()) {
      return result;
    }

    // Human-readable table output to stdout
    if (sites.length === 0) {
      ux.stdout(t('commands.sites.list.noSites', 'No sites found.'));
      return result;
    }

    tableRenderer.render(sites, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return result;
  }
}
