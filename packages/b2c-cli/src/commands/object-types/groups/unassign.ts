/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {normalizeAttributeId} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

interface ObjectTypesGroupsUnassignResult {
  objectType: string;
  group: string;
  attributes: string[];
}

export default class ObjectTypesGroupsUnassign extends ObjectTypesCommand<typeof ObjectTypesGroupsUnassign> {
  static args = {
    'object-type': objectTypeArg,
    group: Args.string({description: 'Attribute group ID', required: true}),
  };

  static description = withDocs(
    t('commands.objectTypes.groups.unassign.description', 'Remove attribute definitions from an attribute group'),
    '/cli/object-types.html#b2c-object-types-groups-unassign',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product materials c_fabric',
    '<%= config.bin %> <%= command.id %> Product materials c_fabric c_lining',
  ];

  static strict = false;

  async run(): Promise<ObjectTypesGroupsUnassignResult> {
    this.requireOAuthCredentials();
    const objectType = this.args['object-type'];
    const {group} = this.args;
    // Variadic attribute IDs are everything in argv after the object-type and group positionals.
    const {argv} = await this.parse(ObjectTypesGroupsUnassign);
    const attributes = (argv as string[]).slice(2).map((id) => normalizeAttributeId(id));
    if (attributes.length === 0) {
      this.error(t('commands.objectTypes.groups.attributesRequired', 'Pass one or more attribute IDs.'));
    }

    for (const attribute of attributes) {
      // eslint-disable-next-line no-await-in-loop -- sequential so a failure stops at the attribute that failed
      await this.objectTypes.unassignAttributeFromGroup(objectType, group, attribute);
    }
    if (!this.jsonEnabled()) {
      this.log(
        t('commands.objectTypes.groups.unassign.done', 'Removed {{attributes}} from group {{group}}.', {
          attributes: attributes.join(', '),
          group,
        }),
      );
    }
    return {objectType, group, attributes};
  }
}
