/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  putSlotConfiguration,
  type PutSlotConfigurationResult,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {SLOT_CONFIG_INPUT_FLAGS, buildSlotConfigurationInput} from '../../../../utils/content/slots.js';

export default class ContentSlotConfigPut extends InstanceCommand<typeof ContentSlotConfigPut> {
  static args = {
    slotId: Args.string({description: 'Slot ID (the slot must already exist)', required: true}),
    configurationId: Args.string({description: 'Slot configuration ID', required: true}),
  };

  static description =
    'Create or replace a slot configuration; content (--content-assets, --products, --categories, --html or a file) and --template are required';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> home-main summer-sale --content-assets summer-banner --template slots/content/htmlslotcontainer.isml --enabled',
    '<%= config.bin %> <%= command.id %> home-main summer-sale --file summer-sale.json --start-date 2026-06-01T00:00:00Z',
  ];

  static flags = {
    'site-id': Flags.string({description: 'Site ID; defaults to siteId from configuration'}),
    ...SLOT_CONFIG_INPUT_FLAGS,
  };

  protected operations = {putSlotConfiguration};

  async run(): Promise<PutSlotConfigurationResult> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) this.error('Site ID is required. Use --site-id or set siteId in your configuration.');

    let input;
    try {
      input = await buildSlotConfigurationInput(this.flags);
    } catch (error) {
      this.error((error as Error).message);
    }
    if (!input.slotContent) {
      this.error('Slot content is required. Use --content-assets, --products, --categories, --html, or --file.');
    }
    if (!input.template) this.error('A rendering template is required. Use --template or set it in --file.');

    let result;
    try {
      result = await this.operations.putSlotConfiguration(
        this.instance,
        this.args.slotId,
        this.args.configurationId,
        input,
        {siteId},
      );
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) {
      ux.stdout(
        `${result.status === 'created' ? 'Created' : 'Replaced'} slot configuration ${this.args.slotId}/${this.args.configurationId}`,
      );
    }
    return result;
  }
}
