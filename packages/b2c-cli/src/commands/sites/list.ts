import {InstanceCommand} from '@salesforce/b2c-tooling/cli';
import type {OcapiComponents} from '@salesforce/b2c-tooling';
import {t} from '../../i18n/index.js';

type Sites = OcapiComponents['schemas']['sites'];

export default class SitesList extends InstanceCommand<typeof SitesList> {
  static description = t('commands.sites.list.description', 'List sites on a B2C Commerce instance');

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net',
  ];

  async run(): Promise<void> {
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.hostname!;

    this.log(t('commands.sites.list.fetching', 'Fetching sites from {{hostname}}...', {hostname}));

    // eslint-disable-next-line new-cap
    const {data, error} = await this.instance.ocapi.GET('/sites', {
      params: {query: {select: '(**)'}},
    });

    if (error) {
      this.error(t('commands.sites.list.error', 'Failed to fetch sites: {{message}}', {message: String(error)}));
    }

    const sites = data as Sites;
    if (!sites || sites.count === 0) {
      this.log(t('commands.sites.list.noSites', 'No sites found.'));
      return;
    }

    this.log('');
    this.log(t('commands.sites.list.foundSites', 'Found {{count}} site(s):', {count: sites.count}));
    this.log('');

    for (const site of sites.data ?? []) {
      const displayName = site.display_name?.default || site.id;
      const status = site.storefront_status || 'unknown';
      this.log(`  ${site.id}`);
      this.log(`    ${t('commands.sites.list.displayName', 'Display Name: {{name}}', {name: displayName})}`);
      this.log(`    ${t('commands.sites.list.status', 'Status: {{status}}', {status})}`);
      this.log('');
    }
  }
}
