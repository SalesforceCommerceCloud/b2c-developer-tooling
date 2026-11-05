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
  deleteSlotConfiguration,
  type SlotContextType,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {CONTEXT_OPTIONS} from '../../../../utils/content/slots.js';

export default class ContentSlotConfigDelete extends InstanceCommand<typeof ContentSlotConfigDelete> {
  static args = {
    slotId: Args.string({description: 'Slot ID', required: true}),
    configurationId: Args.string({description: 'Slot configuration ID', required: true}),
  };

  static description = 'Delete a slot configuration';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> home-main summer-sale --site-id RefArch',
    '<%= config.bin %> <%= command.id %> home-main summer-sale --force',
  ];

  static flags = {
    'site-id': Flags.string({description: 'Site ID; defaults to siteId from configuration'}),
    context: Flags.string({description: 'Configuration context', options: CONTEXT_OPTIONS}),
    force: Flags.boolean({description: 'Skip the confirmation prompt'}),
  };

  protected operations = {deleteSlotConfiguration};

  async run(): Promise<{configurationId: string; deleted: boolean; slotId: string}> {
    this.assertDestructiveOperationAllowed('delete slot configuration');
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) this.error('Site ID is required. Use --site-id or set siteId in your configuration.');
    const {slotId, configurationId} = this.args;

    if (!this.flags.force && !this.jsonEnabled()) {
      const answer = await confirm(`Delete slot configuration ${slotId}/${configurationId} on site ${siteId}?`);
      if (!answer) {
        ux.stdout('Cancelled.');
        return {slotId, configurationId, deleted: false};
      }
    }

    try {
      await this.operations.deleteSlotConfiguration(this.instance, slotId, configurationId, {
        siteId,
        context: this.flags.context as SlotContextType | undefined,
      });
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Deleted slot configuration ${slotId}/${configurationId}`);
    return {slotId, configurationId, deleted: true};
  }
}
