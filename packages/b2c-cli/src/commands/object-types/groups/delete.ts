/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {ObjectTypesCommand, forceFlag, objectTypeArg} from '../../../utils/object-types.js';
import {t, withDocs} from '../../../i18n/index.js';

interface DeleteResult {
  deleted: boolean;
  objectType: string;
  id: string;
}

export default class ObjectTypesGroupsDelete extends ObjectTypesCommand<typeof ObjectTypesGroupsDelete> {
  static args = {
    'object-type': objectTypeArg,
    id: Args.string({description: 'Attribute group ID', required: true}),
  };

  static description = withDocs(
    t(
      'commands.objectTypes.groups.delete.description',
      'Delete an attribute group; its attribute definitions are kept',
    ),
    '/cli/object-types.html#b2c-object-types-groups-delete',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> Product materials',
    '<%= config.bin %> <%= command.id %> Product materials --force',
  ];

  static flags = {
    force: forceFlag,
  };

  async run(): Promise<DeleteResult> {
    this.requireOAuthCredentials();
    const objectType = this.args['object-type'];
    const {id} = this.args;

    if (!this.flags.force && !this.jsonEnabled()) {
      const ok = await confirm(
        t('commands.objectTypes.groups.delete.confirm', 'Delete attribute group {{id}} from {{objectType}}?', {
          id,
          objectType,
        }),
      );
      if (!ok) {
        this.log(t('commands.objectTypes.cancelled', 'Cancelled.'));
        return {deleted: false, objectType, id};
      }
    }

    await this.objectTypes.deleteAttributeGroup(objectType, id);
    if (!this.jsonEnabled()) {
      this.log(
        t('commands.objectTypes.groups.delete.deleted', 'Deleted group {{id}} from {{objectType}}.', {id, objectType}),
      );
    }
    return {deleted: true, objectType, id};
  }
}
