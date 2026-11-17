/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {
  InstanceCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  searchSlots,
  type SlotContextType,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {ExperienceSlot} from '@salesforce/b2c-tooling-sdk/clients';
import {CONTEXT_OPTIONS, isConfigurationActive} from '../../../utils/content/slots.js';

export interface SlotListItem {
  slotId: string;
  contextType: string;
  description: string;
  configurations: number;
  activeConfigurations: string[];
}

export function toSlotListItem(slot: ExperienceSlot): SlotListItem {
  const configs = slot.slotConfigurations ?? [];
  return {
    slotId: slot.slotId ?? '',
    contextType: slot.contextType ?? '',
    description: slot.description ?? '',
    configurations: configs.length,
    activeConfigurations: configs.filter((c) => isConfigurationActive(c)).map((c) => c.configurationId ?? ''),
  };
}

const COLUMNS: Record<string, ColumnDef<SlotListItem>> = {
  slotId: {header: 'SLOT', get: (s) => s.slotId},
  contextType: {header: 'CONTEXT', get: (s) => s.contextType},
  configurations: {header: 'CONFIGS', get: (s) => String(s.configurations)},
  activeConfigurations: {header: 'ACTIVE', get: (s) => s.activeConfigurations.join(', ') || '-'},
  description: {header: 'DESCRIPTION', get: (s) => s.description || '-', extended: true},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class ContentSlotList extends InstanceCommand<typeof ContentSlotList> {
  static description = 'List the content slots of a site with their configuration counts';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --context category --json',
  ];

  static flags = {
    'site-id': Flags.string({description: 'Site ID; defaults to siteId from configuration'}),
    context: Flags.string({description: 'Only slots of this context type', options: CONTEXT_OPTIONS}),
    ...columnFlagsFor(COLUMNS),
  };

  protected operations = {searchSlots};

  async run(): Promise<{data: SlotListItem[]; total: number}> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) this.error('Site ID is required. Use --site-id or set siteId in your configuration.');

    let result;
    try {
      result = await this.operations.searchSlots(this.instance, {
        siteId,
        contextType: this.flags.context as SlotContextType | undefined,
        all: true,
      });
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }

    const data = result.hits.map((s) => toSlotListItem(s));
    if (this.jsonEnabled()) return {data, total: result.total};
    if (data.length === 0) {
      ux.stdout('No slots found.');
    } else {
      tableRenderer.render(
        data,
        selectColumns(
          this.flags,
          tableRenderer,
          ['slotId', 'contextType', 'configurations', 'activeConfigurations'],
          this.warn.bind(this),
        ),
      );
    }
    return {data, total: result.total};
  }
}
