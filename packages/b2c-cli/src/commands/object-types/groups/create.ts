/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import type {ObjectAttributeGroup} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg, parseLocalized} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class ObjectTypesGroupsCreate extends ObjectTypesCommand<typeof ObjectTypesGroupsCreate> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute group ID', required: true}),
  };

  static description = withDocs(
    t('commands.objectTypes.groups.create.description', 'Create an attribute group and optionally assign attributes'),
    '/cli/object-types.html#b2c-object-types-groups-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product materials --display-name Materials',
    '<%= config.bin %> <%= command.id %> Product materials -n Materials --attribute c_fabric --attribute c_lining',
  ];

  static flags = {
    'display-name': Flags.string({
      char: 'n',
      description: 'Display name; repeat as locale=text for translations',
      multiple: true,
    }),
    description: Flags.string({description: 'Description; repeat as locale=text for translations', multiple: true}),
    position: Flags.integer({description: 'Sort position in Business Manager'}),
    attribute: Flags.string({char: 'a', description: 'Attribute to assign to the group (repeatable)', multiple: true}),
  };

  async run(): Promise<ObjectAttributeGroup> {
    this.requireOAuthCredentials();
    const objectType = this.args['object-type'];
    const {id} = this.args;

    if (await this.exists(objectType, id)) {
      this.error(
        t(
          'commands.objectTypes.groups.create.exists',
          'Attribute group {{id}} already exists on {{objectType}}. Use "object-types groups update".',
          {id, objectType},
        ),
      );
    }

    const body: ObjectAttributeGroup = {id};
    const displayName = parseLocalized(this.flags['display-name']);
    const description = parseLocalized(this.flags.description);
    if (displayName) body.displayName = displayName;
    if (description) body.description = description;
    if (this.flags.position !== undefined) body.position = this.flags.position;

    await this.objectTypes.createOrReplaceAttributeGroup(objectType, body);
    for (const attribute of this.flags.attribute ?? []) {
      // eslint-disable-next-line no-await-in-loop -- sequential so a failure stops at the attribute that failed
      await this.objectTypes.assignAttributeToGroup(objectType, id, attribute);
    }
    const group = await this.objectTypes.getAttributeGroup(objectType, id, {expandDefinitions: true});
    if (this.jsonEnabled()) return group;

    this.log(
      t(
        'commands.objectTypes.groups.create.created',
        'Created group {{id}} on {{objectType}} with {{count}} attribute(s).',
        {
          id,
          objectType,
          count: group.attributeDefinitionsCount ?? 0,
        },
      ),
    );
    return group;
  }

  private async exists(objectType: string, id: string): Promise<boolean> {
    try {
      await this.objectTypes.getAttributeGroup(objectType, id);
      return true;
    } catch (error) {
      if ((error as {status?: number}).status === 404) return false;
      throw error;
    }
  }
}
