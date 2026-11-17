/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {InstanceCommand, TableRenderer, columnFlagsFor, selectColumns} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  searchSlotConfigurations,
  type SlotContextType,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {
  CONTEXT_OPTIONS,
  SLOT_CONFIG_COLUMNS,
  SLOT_CONFIG_DEFAULT_COLUMNS,
  toSlotConfigurationRow,
  type SlotConfigurationRow,
} from '../../../../utils/content/slots.js';

const tableRenderer = new TableRenderer(SLOT_CONFIG_COLUMNS);

export default class ContentSlotConfigList extends InstanceCommand<typeof ContentSlotConfigList> {
  static description = 'List slot configurations of a site, with their content and whether they are active';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --site-id RefArch',
    '<%= config.bin %> <%= command.id %> --slot-id home-main --extended',
    '<%= config.bin %> <%= command.id %> --context category --json',
  ];

  static flags = {
    'site-id': Flags.string({description: 'Site ID; defaults to siteId from configuration'}),
    'slot-id': Flags.string({description: 'Only configurations of this slot'}),
    context: Flags.string({description: 'Only configurations with this context', options: CONTEXT_OPTIONS}),
    ...columnFlagsFor(SLOT_CONFIG_COLUMNS),
  };

  protected operations = {searchSlotConfigurations};

  async run(): Promise<{data: SlotConfigurationRow[]; total: number}> {
    this.requireOAuthCredentials();
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) this.error('Site ID is required. Use --site-id or set siteId in your configuration.');

    let result;
    try {
      result = await this.operations.searchSlotConfigurations(this.instance, {
        siteId,
        slotId: this.flags['slot-id'],
        context: this.flags.context as SlotContextType | undefined,
        all: true,
      });
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }

    const data = result.hits.map((c) => toSlotConfigurationRow(c));
    if (this.jsonEnabled()) return {data, total: result.total};
    if (data.length === 0) {
      ux.stdout('No slot configurations found.');
    } else {
      tableRenderer.render(
        data,
        selectColumns(this.flags, tableRenderer, SLOT_CONFIG_DEFAULT_COLUMNS, this.warn.bind(this)),
      );
    }
    return {data, total: result.total};
  }
}
