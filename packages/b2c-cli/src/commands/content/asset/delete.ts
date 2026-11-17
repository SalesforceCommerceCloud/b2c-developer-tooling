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
  deleteContentAsset,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {LIBRARY_FLAG, LIBRARY_REQUIRED, resolveLibraryId} from '../../../utils/content/library.js';

export default class ContentAssetDelete extends InstanceCommand<typeof ContentAssetDelete> {
  static args = {
    contentId: Args.string({description: 'Content asset ID', required: true}),
  };

  static description = 'Delete a content asset (classic assets only; Page Designer pages are not affected)';

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> summer-banner --library SharedLibrary --force'];

  static flags = {
    ...LIBRARY_FLAG,
    force: Flags.boolean({description: 'Skip the confirmation prompt'}),
  };

  protected operations = {deleteContentAsset};

  async run(): Promise<{contentId: string; deleted: boolean; libraryId: string}> {
    this.assertDestructiveOperationAllowed('delete content asset');
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);
    const {contentId} = this.args;

    if (!this.flags.force && !this.jsonEnabled()) {
      const answer = await confirm(`Delete content asset ${contentId} from library ${libraryId}?`);
      if (!answer) {
        ux.stdout('Cancelled.');
        return {contentId, libraryId, deleted: false};
      }
    }

    try {
      await this.operations.deleteContentAsset(this.instance, libraryId, contentId);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Deleted content asset ${contentId}`);
    return {contentId, libraryId, deleted: true};
  }
}
