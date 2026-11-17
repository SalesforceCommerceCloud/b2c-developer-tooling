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
  patchContentFolder,
  type ExperienceContentFolder,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {
  LIBRARY_FLAG,
  LIBRARY_ITEM_FLAGS,
  LIBRARY_REQUIRED,
  buildLibraryItemInput,
  resolveLibraryId,
} from '../../../utils/content/library.js';

export default class ContentFolderUpdate extends InstanceCommand<typeof ContentFolderUpdate> {
  static args = {
    folderId: Args.string({description: 'Folder ID', required: true}),
  };

  static description = 'Change fields of a content folder and keep the rest';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> promos --no-online',
    '<%= config.bin %> <%= command.id %> summer --parent archive',
  ];

  static flags = {
    ...LIBRARY_FLAG,
    ...LIBRARY_ITEM_FLAGS,
    parent: Flags.string({description: 'Move the folder under this parent folder'}),
  };

  protected operations = {patchContentFolder};

  async run(): Promise<ExperienceContentFolder> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);

    let changes;
    try {
      changes = await buildLibraryItemInput(this.flags, {localizedOnline: false});
    } catch (error) {
      this.error((error as Error).message);
    }
    if (this.flags.parent) changes.parentFolderId = this.flags.parent;
    if (Object.keys(changes).length === 0) this.error('Nothing to update. Pass at least one field flag or --file.');

    let folder;
    try {
      folder = await this.operations.patchContentFolder(this.instance, libraryId, this.args.folderId, changes);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Updated folder ${this.args.folderId}`);
    return folder;
  }
}
