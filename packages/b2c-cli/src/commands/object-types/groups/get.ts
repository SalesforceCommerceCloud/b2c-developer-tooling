/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import {localizedDefault, type ObjectAttributeGroup} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, objectTypeArg} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

export default class ObjectTypesGroupsGet extends ObjectTypesCommand<typeof ObjectTypesGroupsGet> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute group ID', required: true}),
  };

  static description = withDocs(
    t('commands.objectTypes.groups.get.description', 'Show an attribute group and its assigned attributes'),
    '/cli/object-types.html#b2c-object-types-groups-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product storefrontAttributes',
    '<%= config.bin %> <%= command.id %> SitePreferences myGroup --json',
  ];

  async run(): Promise<ObjectAttributeGroup> {
    this.requireOAuthCredentials();
    const group = await this.objectTypes.getAttributeGroup(this.args['object-type'], this.args.id, {
      expandDefinitions: true,
    });
    if (this.jsonEnabled()) return group;

    printFieldsBlock(
      group.id ?? this.args.id,
      [
        ['Display Name', localizedDefault(group.displayName)],
        ['Description', localizedDefault(group.description)],
        ['Position', group.position],
        ['Internal', group.internal],
        ['Attributes', group.attributeDefinitionsCount],
        ['Last Modified', group.lastModified],
      ],
      {
        sections: [
          {
            title: t('commands.objectTypes.groups.get.attributes', 'Attributes'),
            fields: (group.attributeDefinitions ?? []).map((a) => [
              a.effectiveId ?? a.id,
              `${a.valueType ?? ''}  ${localizedDefault(a.displayName) ?? ''}`.trim(),
            ]),
          },
        ],
      },
    );
    return group;
  }
}
