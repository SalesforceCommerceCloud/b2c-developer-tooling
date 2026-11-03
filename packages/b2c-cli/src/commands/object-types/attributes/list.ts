/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {localizedDefault, type ObjectAttributeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<ObjectAttributeDefinition>> = {
  id: {header: 'ID', get: (a) => a.effectiveId ?? a.id},
  displayName: {header: 'Display Name', get: (a) => localizedDefault(a.displayName) ?? '-'},
  valueType: {header: 'Type', get: (a) => a.valueType ?? '-'},
  system: {header: 'System', get: (a) => String(a.system ?? false)},
  mandatory: {header: 'Mandatory', get: (a) => String(a.mandatory ?? false), extended: true},
  localizable: {header: 'Localizable', get: (a) => String(a.localizable ?? false), extended: true},
  siteSpecific: {header: 'Site Specific', get: (a) => String(a.siteSpecific ?? false), extended: true},
  searchable: {header: 'Searchable', get: (a) => String(a.searchable ?? false), extended: true},
  multiValue: {header: 'Multi Value', get: (a) => String(a.multiValueType ?? false), extended: true},
  values: {
    header: 'Values',
    get: (a) => (a.valueDefinitions?.length ? a.valueDefinitions.map((v) => v.value ?? v.id).join(', ') : '-'),
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'displayName', 'valueType', 'system'];
const tableRenderer = new TableRenderer(COLUMNS);

interface AttributesListResult {
  data: ObjectAttributeDefinition[];
  total: number;
}

export default class ObjectTypesAttributesList extends ObjectTypesCommand<typeof ObjectTypesAttributesList> {
  static args = {
    'object-type': objectTypeArg,
  };

  static description = withDocs(
    t('commands.objectTypes.attributes.list.description', 'List attribute definitions of a system object type'),
    '/cli/object-types.html#b2c-object-types-attributes-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product',
    '<%= config.bin %> <%= command.id %> Product --custom',
    '<%= config.bin %> <%= command.id %> Product --search color --extended',
    '<%= config.bin %> <%= command.id %> Product --group storefrontAttributes',
    '<%= config.bin %> <%= command.id %> Product --custom --values --json',
  ];

  static flags = {
    custom: Flags.boolean({description: 'Only custom attributes', exclusive: ['system']}),
    system: Flags.boolean({description: 'Only system attributes', exclusive: ['custom']}),
    search: Flags.string({char: 'q', description: 'Filter by text in the attribute ID or display name'}),
    group: Flags.string({char: 'g', description: 'Only attributes assigned to this attribute group'}),
    values: Flags.boolean({description: 'Include enum values (included automatically with --extended)'}),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<AttributesListResult> {
    this.requireOAuthCredentials();
    const {custom, system, search, group, values, extended} = this.flags;
    const attributes = await this.objectTypes.listAttributeDefinitions(this.args['object-type'], {
      kind: custom ? 'custom' : system ? 'system' : undefined,
      text: search,
      group,
      includeValues: values || extended,
    });
    const result = {data: attributes, total: attributes.length};
    if (this.jsonEnabled()) return result;

    if (attributes.length === 0) {
      ux.stdout(t('commands.objectTypes.attributes.list.none', 'No attribute definitions found.'));
      return result;
    }
    tableRenderer.render(attributes, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    return result;
  }
}
