/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {
  normalizeAttributeId,
  type ObjectAttributeDefinition,
} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, bodyFileFlag, objectTypeArg, readJsonBody} from '../../../utils/object-types.js';
import {VALUE_TYPES, attributeFromFlags, attributePropertyFlags} from '../../../utils/object-types-attribute-flags.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class ObjectTypesAttributesCreate extends ObjectTypesCommand<typeof ObjectTypesAttributesCreate> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute ID (the c_ prefix is optional)', required: true}),
  };

  static description = withDocs(
    t(
      'commands.objectTypes.attributes.create.description',
      'Create a custom attribute definition, or replace an existing one with --replace',
    ),
    '/cli/object-types.html#b2c-object-types-attributes-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product fabric --type string --display-name Fabric',
    '<%= config.bin %> <%= command.id %> Product fabric --type string -n Fabric -n fr=Tissu --localizable',
    '<%= config.bin %> <%= command.id %> Order erpId --type string --no-visible --externally-managed',
    '<%= config.bin %> <%= command.id %> Product fabric --file fabric.json --replace',
  ];

  static flags = {
    type: Flags.string({
      char: 't',
      description: 'Value type (required unless set in --file)',
      options: [...VALUE_TYPES],
    }),
    file: bodyFileFlag,
    replace: Flags.boolean({
      description: 'Replace the definition if it exists. Omitted properties are reset to defaults.',
      default: false,
    }),
    ...attributePropertyFlags,
  };

  async run(): Promise<ObjectAttributeDefinition> {
    this.requireOAuthCredentials();
    const objectType = this.args['object-type'];
    const id = normalizeAttributeId(this.args.id);

    const body = {
      ...(this.flags.file ? readJsonBody(this.flags.file) : {}),
      ...attributeFromFlags(this.flags),
      ...(this.flags.type ? {valueType: this.flags.type} : {}),
      id,
    } as ObjectAttributeDefinition;
    if (!body.valueType) {
      this.error(t('commands.objectTypes.attributes.create.typeRequired', 'A value type is required: use --type.'));
    }

    if (!this.flags.replace && (await this.exists(objectType, id))) {
      this.error(
        t(
          'commands.objectTypes.attributes.create.exists',
          'Attribute {{id}} already exists on {{objectType}}. Use "object-types attributes update" or pass --replace.',
          {id, objectType},
        ),
      );
    }

    const {created, definition} = await this.objectTypes.createOrReplaceAttributeDefinition(objectType, body);
    if (this.jsonEnabled()) return definition;

    this.log(
      created
        ? t('commands.objectTypes.attributes.create.created', 'Created {{id}} on {{objectType}}.', {
            id: definition.effectiveId ?? id,
            objectType,
          })
        : t('commands.objectTypes.attributes.create.replaced', 'Replaced {{id}} on {{objectType}}.', {
            id: definition.effectiveId ?? id,
            objectType,
          }),
    );
    if (body.valueDefinitions) {
      this.warn(
        t(
          'commands.objectTypes.attributes.create.valuesIgnored',
          'Enum values (valueDefinitions) cannot be set through the API. Use a site import (b2c job import) for enum values.',
        ),
      );
    }
    return definition;
  }

  private async exists(objectType: string, id: string): Promise<boolean> {
    try {
      await this.objectTypes.getAttributeDefinition(objectType, id);
      return true;
    } catch (error) {
      if ((error as {status?: number}).status === 404) return false;
      throw error;
    }
  }
}
