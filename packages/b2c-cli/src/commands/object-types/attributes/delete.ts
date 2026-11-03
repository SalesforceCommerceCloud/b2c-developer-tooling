/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {normalizeAttributeId} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {ObjectTypesCommand, forceFlag, objectTypeArg} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

interface DeleteResult {
  deleted: boolean;
  objectType: string;
  id: string;
}

export default class ObjectTypesAttributesDelete extends ObjectTypesCommand<typeof ObjectTypesAttributesDelete> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute ID (with or without the c_ prefix)', required: true}),
  };

  static description = withDocs(
    t(
      'commands.objectTypes.attributes.delete.description',
      'Delete a custom attribute definition and all of its stored values',
    ),
    '/cli/object-types.html#b2c-object-types-attributes-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product c_fabric',
    '<%= config.bin %> <%= command.id %> Product c_fabric --force',
  ];

  static flags = {
    force: forceFlag,
  };

  async run(): Promise<DeleteResult> {
    this.requireOAuthCredentials();
    const objectType = this.args['object-type'];
    const id = normalizeAttributeId(this.args.id);

    if (!this.flags.force && !this.jsonEnabled()) {
      const ok = await confirm(
        t(
          'commands.objectTypes.attributes.delete.confirm',
          'Delete attribute {{id}} from {{objectType}}? Stored values for this attribute are removed.',
          {id, objectType},
        ),
      );
      if (!ok) {
        this.log(t('commands.objectTypes.cancelled', 'Cancelled.'));
        return {deleted: false, objectType, id};
      }
    }

    await this.objectTypes.deleteAttributeDefinition(objectType, id);
    if (!this.jsonEnabled()) {
      this.log(
        t('commands.objectTypes.attributes.delete.deleted', 'Deleted {{id}} from {{objectType}}.', {id, objectType}),
      );
    }
    return {deleted: true, objectType, id};
  }
}
