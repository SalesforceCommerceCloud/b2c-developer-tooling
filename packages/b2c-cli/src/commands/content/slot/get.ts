/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {InstanceCommand, TableRenderer} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  getSlot,
  type SlotContextType,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {ExperienceSlot} from '@salesforce/b2c-tooling-sdk/clients';
import {
  CONTEXT_OPTIONS,
  SLOT_CONFIG_COLUMNS,
  SLOT_CONFIG_DEFAULT_COLUMNS,
  toSlotConfigurationRow,
} from '../../../utils/content/slots.js';

const tableRenderer = new TableRenderer(SLOT_CONFIG_COLUMNS);

export default class ContentSlotGet extends InstanceCommand<typeof ContentSlotGet> {
  static args = {
    slotId: Args.string({description: 'Slot ID', required: true}),
  };

  static description = 'Show a content slot and all of its configurations';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> home-main --site-id RefArch',
    '<%= config.bin %> <%= command.id %> cat-banner --context category --json',
  ];

  static flags = {
    'site-id': Flags.string({description: 'Site ID; defaults to siteId from configuration'}),
    context: Flags.string({description: 'Slot context type', options: CONTEXT_OPTIONS, default: 'global'}),
  };

  protected operations = {getSlot};

  async run(): Promise<ExperienceSlot> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) this.error('Site ID is required. Use --site-id or set siteId in your configuration.');

    let slot;
    try {
      slot = await this.operations.getSlot(this.instance, this.args.slotId, this.flags.context as SlotContextType, {
        siteId,
      });
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (this.jsonEnabled()) return slot;

    ux.stdout(`Slot: ${slot.slotId} (${slot.contextType})`);
    if (slot.description) ux.stdout(`Description: ${slot.description}`);
    const configs = (slot.slotConfigurations ?? []).map((c) => toSlotConfigurationRow({...c, slotId: slot.slotId}));
    ux.stdout('');
    if (configs.length === 0) {
      ux.stdout('No configurations.');
    } else {
      tableRenderer.render(
        configs,
        SLOT_CONFIG_DEFAULT_COLUMNS.filter((c) => c !== 'slotId'),
      );
    }
    return slot;
  }
}
