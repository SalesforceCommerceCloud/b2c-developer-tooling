/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {type CartridgePathResult, BM_SITE_ID, setCartridgePath} from '@salesforce/b2c-tooling-sdk/operations/sites';
import {t, withDocs} from '../../../i18n/index.js';

export default class SitesCartridgesSet extends InstanceCommand<typeof SitesCartridgesSet> {
  static description = withDocs(
    t('commands.sites.cartridges.set.description', 'Replace the entire cartridge path for a site'),
    '/cli/sites.html#b2c-sites-cartridges-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> sites cartridges set "app_storefront_base:plugin_applepay" --site-id RefArch',
    '<%= config.bin %> sites cartridges set "bm_ext1:bm_ext2" --bm',
  ];

  static hiddenAliases = ['sites:cartridge:set'];

  static args = {
    cartridges: Args.string({
      description: t('args.cartridges.description', 'New cartridge path (colon-separated, e.g. "cart1:cart2:cart3")'),
      required: true,
    }),
  };

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
    this.assertDestructiveOperationAllowed('replace site cartridge path');
    this.requireOAuthCredentials();

    const siteId = this.resolveSiteId();
    const {cartridges} = this.args;

    const result = await setCartridgePath(this.instance, siteId, cartridges, {
      log: (msg) => {
        if (!this.jsonEnabled()) this.log(msg);
      },
      waitOptions: {
        onProgress: (exec, elapsed) => {
          if (!this.jsonEnabled()) {
            const elapsedSec = Math.floor(elapsed / 1000);
            this.log(
              t('commands.sites.cartridges.jobProgress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                status: exec.execution_status,
                elapsed: elapsedSec.toString(),
              }),
            );
          }
        },
      },
    });

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(t('commands.sites.cartridges.set.success', 'Cartridge path updated for site "{{siteId}}".', {siteId}));
    this.log(
      t('commands.sites.cartridges.set.updatedPath', 'New path: {{cartridges}}', {
        cartridges: result.cartridges,
      }),
    );

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
