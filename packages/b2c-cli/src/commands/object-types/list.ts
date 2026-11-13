/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {localizedDefault, type ObjectTypeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand} from '../../utils/object-types.js';
import {t, withDocs} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<ObjectTypeDefinition>> = {
  objectType: {header: 'Object Type', get: (o) => o.objectType ?? '-'},
  displayName: {header: 'Display Name', get: (o) => localizedDefault(o.displayName) ?? '-'},
  attributes: {header: 'Attributes', get: (o) => String(o.attributeDefinitionCount ?? '-')},
  groups: {header: 'Groups', get: (o) => String(o.attributeGroupCount ?? '-')},
  readOnly: {header: 'Read Only', get: (o) => String(o.readOnly ?? false), extended: true},
  contentObject: {header: 'Content Object', get: (o) => String(o.contentObject ?? false), extended: true},
  description: {header: 'Description', get: (o) => localizedDefault(o.description) ?? '-', extended: true},
};

const DEFAULT_COLUMNS = ['objectType', 'displayName', 'attributes', 'groups'];
const tableRenderer = new TableRenderer(COLUMNS);

interface ObjectTypesListResult {
  data: ObjectTypeDefinition[];
  total: number;
}

export default class ObjectTypesList extends ObjectTypesCommand<typeof ObjectTypesList> {
  static description = withDocs(
    t('commands.objectTypes.list.description', 'List system object types and their attribute and group counts'),
    '/cli/object-types.html#b2c-object-types-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<ObjectTypesListResult> {
    this.requireOAuthCredentials();
    const types = await this.objectTypes.listObjectTypes();
    const result = {data: types, total: types.length};
    if (this.jsonEnabled()) return result;

    if (types.length === 0) {
      ux.stdout(t('commands.objectTypes.list.none', 'No object types found.'));
      return result;
    }
    tableRenderer.render(types, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    return result;
  }
}
