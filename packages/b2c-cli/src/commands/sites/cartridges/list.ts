/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {type CartridgePathResult, BM_SITE_ID, getCartridgePath} from '@salesforce/b2c-tooling-sdk/operations/sites';
import {t, withDocs} from '../../../i18n/index.js';

export default class SitesCartridgesList extends InstanceCommand<typeof SitesCartridgesList> {
  static description = withDocs(
    t('commands.sites.cartridges.list.description', 'List the cartridge path for a site'),
    '/cli/sites.html#b2c-sites-cartridges-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> sites cartridges list --site-id RefArch',
    '<%= config.bin %> sites cartridges list --bm',
    '<%= config.bin %> sites cartridges list --site-id RefArch --json',
  ];

  static hiddenAliases = ['sites:cartridge:list'];

  static flags = {
    'site-id': Flags.string({
      description: t('flags.siteId.description', 'Site ID (e.g. RefArch)'),
      exclusive: ['bm'],
    }),
    bm: Flags.boolean({
      description: t('flags.bm.description', 'Use Business Manager site (Sites-Site)'),
      exclusive: ['site-id'],
    }),
  };

  async run(): Promise<CartridgePathResult> {
    this.requireOAuthCredentials();

    const siteId = this.resolveSiteId();
    const hostname = this.resolvedConfig.values.hostname!;

    this.log(
      t('commands.sites.cartridges.list.fetching', 'Fetching cartridge path for site "{{siteId}}" on {{hostname}}...', {
        siteId,
        hostname,
      }),
    );

    const result = await getCartridgePath(this.instance, siteId);

    if (this.jsonEnabled()) {
      return result;
    }

    if (result.cartridgeList.length === 0) {
      ux.stdout(t('commands.sites.cartridges.list.empty', 'No cartridges configured for site "{{siteId}}".', {siteId}));
      return result;
    }

    ux.stdout(
      t('commands.sites.cartridges.list.header', 'Cartridge path for site "{{siteId}}" ({{total}} cartridges):', {
        siteId,
        total: String(result.cartridgeList.length),
      }),
    );
    for (let i = 0; i < result.cartridgeList.length; i++) {
      ux.stdout(`  ${i + 1}. ${result.cartridgeList[i]}`);
    }

    return result;
  }

  private resolveSiteId(): string {
    const siteId = this.flags['site-id'];
    const bm = this.flags.bm;

    if (!siteId && !bm) {
      this.error(t('commands.sites.cartridges.siteIdRequired', 'Provide --site-id <id> or --bm to specify a site.'));
    }

    return bm ? BM_SITE_ID : siteId!;
  }
}
