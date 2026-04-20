/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {type CartridgePathResult, BM_SITE_ID, removeCartridge} from '@salesforce/b2c-tooling-sdk/operations/sites';
import {t, withDocs} from '../../../i18n/index.js';

export default class SitesCartridgesRemove extends InstanceCommand<typeof SitesCartridgesRemove> {
  static description = withDocs(
    t('commands.sites.cartridges.remove.description', "Remove a cartridge from a site's cartridge path"),
    '/cli/sites.html#b2c-sites-cartridges-remove',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> sites cartridges remove old_cartridge --site-id RefArch',
    '<%= config.bin %> sites cartridges remove bm_extension --bm',
  ];

  static hiddenAliases = ['sites:cartridge:remove'];

  static args = {
    cartridge: Args.string({
      description: t('args.cartridge.description', 'Cartridge name to remove'),
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
    this.assertDestructiveOperationAllowed('remove cartridge from site cartridge path');
    this.requireOAuthCredentials();

    const siteId = this.resolveSiteId();
    const {cartridge} = this.args;

    const result = await removeCartridge(this.instance, siteId, cartridge, {
      log: (msg) => {
        if (!this.jsonEnabled()) this.log(msg);
      },
      waitOptions: {
        onPoll: (info) => {
          if (!this.jsonEnabled()) {
            this.log(
              t('commands.sites.cartridges.jobProgress', '  Status: {{status}} ({{elapsed}}s elapsed)', {
                status: info.status,
                elapsed: String(info.elapsedSeconds),
              }),
            );
          }
        },
      },
    });

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(
      t('commands.sites.cartridges.remove.success', 'Removed "{{cartridge}}" from site "{{siteId}}" cartridge path.', {
        cartridge,
        siteId,
      }),
    );
    this.log(
      t('commands.sites.cartridges.remove.updatedPath', 'Updated path: {{cartridges}}', {
        cartridges: result.cartridges || '(empty)',
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
