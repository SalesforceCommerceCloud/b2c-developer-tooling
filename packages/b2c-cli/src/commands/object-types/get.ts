/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import {localizedDefault, type ObjectTypeDefinition} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg} from '../../utils/object-types.js';
import {t, withDocs} from '../../i18n/index.js';

export default class ObjectTypesGet extends ObjectTypesCommand<typeof ObjectTypesGet> {
  static args = {
    'object-type': objectTypeArg,
  };

  static description = withDocs(
    t('commands.objectTypes.get.description', 'Show a system object type'),
    '/cli/object-types.html#b2c-object-types-get',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> Product', '<%= config.bin %> <%= command.id %> Order --json'];

  async run(): Promise<ObjectTypeDefinition> {
    this.requireOAuthCredentials();
    const type = await this.objectTypes.getObjectType(this.args['object-type']);
    if (this.jsonEnabled()) return type;

    printFieldsBlock(type.objectType ?? this.args['object-type'], [
      ['Display Name', localizedDefault(type.displayName)],
      ['Description', localizedDefault(type.description)],
      ['Attributes', type.attributeDefinitionCount],
      ['Groups', type.attributeGroupCount],
      ['Read Only', type.readOnly],
      ['Content Object', type.contentObject],
      ['Queryable', type.queryable],
    ]);
    return type;
  }
}
