/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  type CartridgePathResult,
  type CartridgePosition,
  BM_SITE_ID,
  addCartridge,
} from '@salesforce/b2c-tooling-sdk/operations/sites';
import {t, withDocs} from '../../../i18n/index.js';

export default class SitesCartridgesAdd extends InstanceCommand<typeof SitesCartridgesAdd> {
  static description = withDocs(
    t('commands.sites.cartridges.add.description', "Add a cartridge to a site's cartridge path"),
    '/cli/sites.html#b2c-sites-cartridges-add',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> sites cartridges add my_cartridge --site-id RefArch',
    '<%= config.bin %> sites cartridges add my_cartridge --site-id RefArch --position first',
    '<%= config.bin %> sites cartridges add my_cartridge --site-id RefArch --position after --target app_storefront_base',
    '<%= config.bin %> sites cartridges add bm_extension --bm',
  ];

  static hiddenAliases = ['sites:cartridge:add'];

  static args = {
    cartridge: Args.string({
      description: t('args.cartridge.description', 'Cartridge name to add'),
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
    position: Flags.string({
      description: t('flags.position.description', 'Position to add the cartridge'),
      options: ['first', 'last', 'before', 'after'],
      default: 'first',
    }),
    target: Flags.string({
      description: t('flags.target.description', 'Target cartridge (required when position is before/after)'),
    }),
  };

  async run(): Promise<CartridgePathResult> {
    this.requireOAuthCredentials();

    const siteId = this.resolveSiteId();
    const {cartridge} = this.args;
    const position = this.flags.position as CartridgePosition;
    const {target} = this.flags;

    // Validate target is provided for relative positions
    if ((position === 'before' || position === 'after') && !target) {
      this.error(
        t('commands.sites.cartridges.add.targetRequired', '--target is required when --position is "{{position}}"', {
          position,
        }),
      );
    }

    const result = await addCartridge(
      this.instance,
      siteId,
      {name: cartridge, position, target},
      {
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
      },
    );

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(
      t('commands.sites.cartridges.add.success', 'Added "{{cartridge}}" to site "{{siteId}}" cartridge path.', {
        cartridge,
        siteId,
      }),
    );
    this.log(
      t('commands.sites.cartridges.add.updatedPath', 'Updated path: {{cartridges}}', {
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
