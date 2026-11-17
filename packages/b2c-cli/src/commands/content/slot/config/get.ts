/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {ExperienceSlotConfiguration} from '@salesforce/b2c-tooling-sdk/clients';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  getSlotConfiguration,
  type SlotContextType,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {CONTEXT_OPTIONS} from '../../../../utils/content/slots.js';

export default class ContentSlotConfigGet extends InstanceCommand<typeof ContentSlotConfigGet> {
  static args = {
    slotId: Args.string({description: 'Slot ID', required: true}),
    configurationId: Args.string({description: 'Slot configuration ID', required: true}),
  };

  static description = 'Show a slot configuration as JSON';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> home-main summer-sale --site-id RefArch',
    '<%= config.bin %> <%= command.id %> home-main summer-sale > summer-sale.json',
  ];

  static flags = {
    'site-id': Flags.string({description: 'Site ID; defaults to siteId from configuration'}),
    context: Flags.string({description: 'Configuration context', options: CONTEXT_OPTIONS}),
  };

  protected operations = {getSlotConfiguration};

  async run(): Promise<ExperienceSlotConfiguration> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) this.error('Site ID is required. Use --site-id or set siteId in your configuration.');

    let config;
    try {
      config = await this.operations.getSlotConfiguration(this.instance, this.args.slotId, this.args.configurationId, {
        siteId,
        context: this.flags.context as SlotContextType | undefined,
      });
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(JSON.stringify(config, null, 2));
    return config;
  }
}
