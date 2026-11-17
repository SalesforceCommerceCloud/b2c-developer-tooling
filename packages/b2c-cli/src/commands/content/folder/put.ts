/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  putContentFolder,
  type ExperienceContentFolder,
  type LibraryPutResult,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {
  LIBRARY_FLAG,
  LIBRARY_ITEM_FLAGS,
  LIBRARY_REQUIRED,
  buildLibraryItemInput,
  resolveLibraryId,
} from '../../../utils/content/library.js';

export default class ContentFolderPut extends InstanceCommand<typeof ContentFolderPut> {
  static args = {
    folderId: Args.string({description: 'Folder ID', required: true}),
  };

  static description = 'Create or replace a content folder';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> promos --name Promotions --online',
    '<%= config.bin %> <%= command.id %> summer --parent promos --name "Summer"',
  ];

  static flags = {
    ...LIBRARY_FLAG,
    ...LIBRARY_ITEM_FLAGS,
    parent: Flags.string({description: 'Parent folder ID (default root)'}),
  };

  protected operations = {putContentFolder};

  async run(): Promise<LibraryPutResult<ExperienceContentFolder>> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);

    let input;
    try {
      input = await buildLibraryItemInput(this.flags, {localizedOnline: false});
    } catch (error) {
      this.error((error as Error).message);
    }
    if (this.flags.parent) input.parentFolderId = this.flags.parent;

    let result;
    try {
      result = await this.operations.putContentFolder(this.instance, libraryId, this.args.folderId, input);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) {
      ux.stdout(`${result.status === 'created' ? 'Created' : 'Replaced'} folder ${this.args.folderId}`);
    }
    return result;
  }
}
