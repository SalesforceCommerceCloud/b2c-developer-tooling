/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import type {ObjectAttributeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, bodyFileFlag, objectTypeArg, readJsonBody} from '../../../utils/object-types.js';
import {attributeFromFlags, attributePropertyFlags} from '../../../utils/object-types-attribute-flags.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class ObjectTypesAttributesUpdate extends ObjectTypesCommand<typeof ObjectTypesAttributesUpdate> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute ID (with or without the c_ prefix)', required: true}),
  };

  static description = withDocs(
    t(
      'commands.objectTypes.attributes.update.description',
      'Update properties of an attribute definition; unspecified properties are unchanged',
    ),
    '/cli/object-types.html#b2c-object-types-attributes-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product c_fabric --display-name "Fabric Type"',
    '<%= config.bin %> <%= command.id %> Product c_fabric --searchable --no-visible',
    '<%= config.bin %> <%= command.id %> Product c_fabric --file changes.json',
  ];

  static flags = {
    file: bodyFileFlag,
    ...attributePropertyFlags,
  };

  async run(): Promise<ObjectAttributeDefinition> {
    this.requireOAuthCredentials();
    const changes = {
      ...(this.flags.file ? readJsonBody(this.flags.file) : {}),
      ...attributeFromFlags(this.flags),
    } as Partial<ObjectAttributeDefinition>;
    delete changes.id;
    if (Object.keys(changes).length === 0) {
      this.error(
        t('commands.objectTypes.attributes.update.nothing', 'Nothing to update: pass property flags or --file.'),
      );
    }

    const definition = await this.objectTypes.updateAttributeDefinition(
      this.args['object-type'],
      this.args.id,
      changes,
    );
    if (this.jsonEnabled()) return definition;

    this.log(
      t('commands.objectTypes.attributes.update.updated', 'Updated {{id}} on {{objectType}}.', {
        id: definition.effectiveId ?? definition.id,
        objectType: this.args['object-type'],
      }),
    );
    return definition;
  }
}
