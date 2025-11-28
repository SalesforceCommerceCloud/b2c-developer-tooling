import {InstanceCommand} from '@salesforce/b2c-tooling/cli';
import {t} from '../../i18n/index.js';

interface SitesResponse {
  _v: string;
  count: number;
  data: Array<{
    id: string;
    display_name?: {default?: string};
    status?: string;
  }>;
  total: number;
}

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

    try {
      const data = await this.instance.ocapi.get<SitesResponse>('sites', {
        params: {select: '(**)'},
      });

      if (data.count === 0) {
        this.log(t('commands.sites.list.noSites', 'No sites found.'));
        return;
      }

      this.log('');
      this.log(t('commands.sites.list.foundSites', 'Found {{count}} site(s):', {count: data.count}));
      this.log('');

      for (const site of data.data) {
        const displayName = site.display_name?.default || site.id;
        const status = site.status || 'unknown';
        this.log(`  ${site.id}`);
        this.log(`    ${t('commands.sites.list.displayName', 'Display Name: {{name}}', {name: displayName})}`);
        this.log(`    ${t('commands.sites.list.status', 'Status: {{status}}', {status})}`);
        this.log('');
      }
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.sites.list.error', 'Failed to fetch sites: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
