/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {localizedDefault, type ObjectAttributeGroup} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<ObjectAttributeGroup>> = {
  id: {header: 'ID', get: (g) => g.id ?? '-'},
  displayName: {header: 'Display Name', get: (g) => localizedDefault(g.displayName) ?? '-'},
  attributes: {header: 'Attributes', get: (g) => String(g.attributeDefinitionsCount ?? 0)},
  internal: {header: 'Internal', get: (g) => String(g.internal ?? false)},
  position: {header: 'Position', get: (g) => String(g.position ?? '-'), extended: true},
  description: {header: 'Description', get: (g) => localizedDefault(g.description) ?? '-', extended: true},
};

const DEFAULT_COLUMNS = ['id', 'displayName', 'attributes', 'internal'];
const tableRenderer = new TableRenderer(COLUMNS);

interface GroupsListResult {
  data: ObjectAttributeGroup[];
  total: number;
}

export default class ObjectTypesGroupsList extends ObjectTypesCommand<typeof ObjectTypesGroupsList> {
  static args = {
    'object-type': objectTypeArg,
  };

  static description = withDocs(
    t('commands.objectTypes.groups.list.description', 'List attribute groups of a system object type'),
    '/cli/object-types.html#b2c-object-types-groups-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product',
    '<%= config.bin %> <%= command.id %> SitePreferences --extended',
    '<%= config.bin %> <%= command.id %> Product --json',
  ];

  static flags = {
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<GroupsListResult> {
    this.requireOAuthCredentials();
    const groups = await this.objectTypes.listAttributeGroups(this.args['object-type']);
    const result = {data: groups, total: groups.length};
    if (this.jsonEnabled()) return result;

    if (groups.length === 0) {
      ux.stdout(t('commands.objectTypes.groups.list.none', 'No attribute groups found.'));
      return result;
    }
    tableRenderer.render(groups, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    return result;
  }
}
