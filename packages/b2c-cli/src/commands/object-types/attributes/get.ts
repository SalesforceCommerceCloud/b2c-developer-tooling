/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {printFieldsBlock, type DetailSection} from '@salesforce/b2c-tooling-sdk/cli';
import {localizedDefault, type ObjectAttributeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class ObjectTypesAttributesGet extends ObjectTypesCommand<typeof ObjectTypesAttributesGet> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute ID (with or without the c_ prefix)', required: true}),
  };

  static description = withDocs(
    t('commands.objectTypes.attributes.get.description', 'Show an attribute definition, including enum values'),
    '/cli/object-types.html#b2c-object-types-attributes-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product c_color',
    '<%= config.bin %> <%= command.id %> Order exportStatus --json',
  ];

  async run(): Promise<ObjectAttributeDefinition> {
    this.requireOAuthCredentials();
    const attr = await this.objectTypes.getAttributeDefinition(this.args['object-type'], this.args.id, {
      includeValues: true,
    });
    if (this.jsonEnabled()) return attr;

    const sections: DetailSection[] = [];
    if (attr.valueDefinitions?.length) {
      sections.push({
        title: t('commands.objectTypes.attributes.get.values', 'Values'),
        fields: attr.valueDefinitions.map((v) => [v.value ?? v.id ?? '-', localizedDefault(v.displayValue) ?? '']),
      });
    }

    printFieldsBlock(
      attr.effectiveId ?? attr.id,
      [
        ['Display Name', localizedDefault(attr.displayName)],
        ['Description', localizedDefault(attr.description)],
        ['Value Type', attr.valueType],
        ['System', attr.system],
        ['Mandatory', attr.mandatory],
        ['Localizable', attr.localizable],
        ['Site Specific', attr.siteSpecific],
        ['Searchable', attr.searchable],
        ['Visible', attr.visible],
        ['Multi Value', attr.multiValueType],
        ['Externally Managed', attr.externallyManaged],
        ['Read Only', attr.readOnly],
        ['Min Length', attr.minLength || undefined],
        ['Field Length', attr.fieldLength],
        ['Regular Expression', attr.regularExpression],
        ['Min Value', attr.minValue],
        ['Max Value', attr.maxValue],
        ['Scale', attr.scale],
        ['Unit', localizedDefault(attr.unit)],
        ['Default Value', attr.defaultValue?.value],
        ['Last Modified', attr.lastModified],
      ],
      {sections},
    );
    return attr;
  }
}
