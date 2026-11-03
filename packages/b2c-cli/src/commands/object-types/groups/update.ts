/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import type {ObjectAttributeGroup} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg, parseLocalized} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class ObjectTypesGroupsUpdate extends ObjectTypesCommand<typeof ObjectTypesGroupsUpdate> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute group ID', required: true}),
  };

  static description = withDocs(
    t(
      'commands.objectTypes.groups.update.description',
      'Update the display name, description, or position of an attribute group',
    ),
    '/cli/object-types.html#b2c-object-types-groups-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product materials --display-name "Materials & Care"',
    '<%= config.bin %> <%= command.id %> Product materials --position 3',
  ];

  static flags = {
    'display-name': Flags.string({
      char: 'n',
      description: 'Display name; repeat as locale=text for translations',
      multiple: true,
    }),
    description: Flags.string({description: 'Description; repeat as locale=text for translations', multiple: true}),
    position: Flags.integer({description: 'Sort position in Business Manager'}),
  };

  async run(): Promise<ObjectAttributeGroup> {
    this.requireOAuthCredentials();
    const changes: Partial<ObjectAttributeGroup> = {};
    const displayName = parseLocalized(this.flags['display-name']);
    const description = parseLocalized(this.flags.description);
    if (displayName) changes.displayName = displayName;
    if (description) changes.description = description;
    if (this.flags.position !== undefined) changes.position = this.flags.position;
    if (Object.keys(changes).length === 0) {
      this.error(
        t(
          'commands.objectTypes.groups.update.nothing',
          'Nothing to update: pass --display-name, --description, or --position.',
        ),
      );
    }

    const group = await this.objectTypes.updateAttributeGroup(this.args['object-type'], this.args.id, changes);
    if (this.jsonEnabled()) return group;
    this.log(
      t('commands.objectTypes.groups.update.updated', 'Updated group {{id}} on {{objectType}}.', {
        id: this.args.id,
        objectType: this.args['object-type'],
      }),
    );
    return group;
  }
}
