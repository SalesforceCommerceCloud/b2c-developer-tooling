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
  deleteContentFolder,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {LIBRARY_FLAG, LIBRARY_REQUIRED, resolveLibraryId} from '../../../utils/content/library.js';

export default class ContentFolderDelete extends InstanceCommand<typeof ContentFolderDelete> {
  static args = {
    folderId: Args.string({description: 'Folder ID', required: true}),
  };

  static description = 'Delete a content folder';

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> promos --library SharedLibrary --force'];

  static flags = {
    ...LIBRARY_FLAG,
    force: Flags.boolean({description: 'Skip the confirmation prompt'}),
  };

  protected operations = {deleteContentFolder};

  async run(): Promise<{deleted: boolean; folderId: string; libraryId: string}> {
    this.assertDestructiveOperationAllowed('delete content folder');
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);
    const {folderId} = this.args;
    if (folderId === 'root') this.error('The root folder cannot be deleted.');

    if (!this.flags.force && !this.jsonEnabled()) {
      const answer = await confirm(`Delete folder ${folderId} from library ${libraryId}?`);
      if (!answer) {
        ux.stdout('Cancelled.');
        return {folderId, libraryId, deleted: false};
      }
    }

    try {
      await this.operations.deleteContentFolder(this.instance, libraryId, folderId);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Deleted folder ${folderId}`);
    return {folderId, libraryId, deleted: true};
  }
}
