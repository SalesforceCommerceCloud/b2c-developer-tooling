import {ux} from '@oclif/core';
import cliui from 'cliui';
import {InstanceCommand} from '@salesforce/b2c-tooling/cli';
import type {OcapiComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

type Sites = OcapiComponents['schemas']['sites'];
type Site = OcapiComponents['schemas']['site'];

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

    this.printSitesTable(sites.data ?? []);

    return sites;
  }

  private printSitesTable(sites: Site[]): void {
    const ui = cliui({width: process.stdout.columns || 80});

    // Header
    ui.div(
      {text: 'ID', width: 30, padding: [0, 2, 0, 0]},
      {text: 'Display Name', width: 30, padding: [0, 2, 0, 0]},
      {text: 'Status', padding: [0, 0, 0, 0]},
    );

    // Separator
    ui.div({text: '─'.repeat(70), padding: [0, 0, 0, 0]});

    // Rows
    for (const site of sites) {
      const displayName = site.display_name?.default || site.id || '';
      const status = site.storefront_status || 'unknown';

      ui.div(
        {text: site.id || '', width: 30, padding: [0, 2, 0, 0]},
        {text: displayName, width: 30, padding: [0, 2, 0, 0]},
        {text: status, padding: [0, 0, 0, 0]},
      );
    }

    ux.stdout(ui.toString());
  }
}
