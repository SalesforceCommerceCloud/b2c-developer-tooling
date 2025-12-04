import {ux} from '@oclif/core';
import {InstanceCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling/cli';
import type {OcapiComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

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

export default class SitesList extends InstanceCommand<typeof SitesList> {
  static description = t('commands.sites.list.description', 'List sites on a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  async run(): Promise<Sites> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.hostname!;

    this.log(t('commands.sites.list.fetching', 'Fetching sites from {{hostname}}...', {hostname}));

    const {data, error} = await this.instance.ocapi.GET('/sites', {
      params: {query: {select: '(**)'}},
    });

    if (error) {
      this.error(t('commands.sites.list.error', 'Failed to fetch sites: {{message}}', {message: String(error)}));
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

    createTable(COLUMNS).render(sites.data ?? [], DEFAULT_COLUMNS);

    return sites;
  }
}
