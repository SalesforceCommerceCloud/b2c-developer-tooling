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
  updateSlotConfiguration,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {SLOT_CONFIG_INPUT_FLAGS, buildSlotConfigurationInput} from '../../../../utils/content/slots.js';

export default class ContentSlotConfigUpdate extends InstanceCommand<typeof ContentSlotConfigUpdate> {
  static args = {
    slotId: Args.string({description: 'Slot ID', required: true}),
    configurationId: Args.string({description: 'Slot configuration ID', required: true}),
  };

  static description = 'Change fields of an existing slot configuration, keeping the rest';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> home-main summer-sale --no-enabled',
    '<%= config.bin %> <%= command.id %> home-main summer-sale --end-date 2026-09-01T00:00:00Z --rank 1',
  ];

  static flags = {
    'site-id': Flags.string({description: 'Site ID; defaults to siteId from configuration'}),
    ...SLOT_CONFIG_INPUT_FLAGS,
  };

  protected operations = {updateSlotConfiguration};

  async run(): Promise<ExperienceSlotConfiguration> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) this.error('Site ID is required. Use --site-id or set siteId in your configuration.');

    let changes;
    try {
      changes = await buildSlotConfigurationInput(this.flags);
    } catch (error) {
      this.error((error as Error).message);
    }
    if (Object.keys(changes).length === 0) this.error('Nothing to update. Pass at least one field flag or --file.');

    let config;
    try {
      config = await this.operations.updateSlotConfiguration(
        this.instance,
        this.args.slotId,
        this.args.configurationId,
        changes,
        {siteId, context: changes.context},
      );
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Updated slot configuration ${this.args.slotId}/${this.args.configurationId}`);
    return config;
  }
}
