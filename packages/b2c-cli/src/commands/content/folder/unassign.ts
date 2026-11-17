/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  unassignContentFromFolder,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {LIBRARY_FLAG, LIBRARY_REQUIRED, resolveLibraryId} from '../../../utils/content/library.js';

export default class ContentFolderUnassign extends InstanceCommand<typeof ContentFolderUnassign> {
  static args = {
    folderId: Args.string({description: 'Folder ID', required: true}),
    contentId: Args.string({description: 'Content asset ID', required: true}),
  };

  static description = 'Remove a content asset from a folder (the asset itself is kept)';

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> promos summer-banner'];

  static flags = {...LIBRARY_FLAG};

  protected operations = {unassignContentFromFolder};

  async run(): Promise<{contentId: string; folderId: string; libraryId: string}> {
    this.assertDestructiveOperationAllowed('remove content asset from folder');
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);
    const {folderId, contentId} = this.args;

    try {
      await this.operations.unassignContentFromFolder(this.instance, libraryId, contentId, folderId);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Removed content asset ${contentId} from folder ${folderId}`);
    return {contentId, folderId, libraryId};
  }
}
