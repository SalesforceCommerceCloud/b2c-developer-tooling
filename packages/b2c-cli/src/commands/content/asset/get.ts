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
  getContentAsset,
  getContentAssetFolders,
  type ExperienceContentAsset,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {LIBRARY_FLAG, LIBRARY_REQUIRED, resolveLibraryId} from '../../../utils/content/library.js';

export default class ContentAssetGet extends InstanceCommand<typeof ContentAssetGet> {
  static args = {
    contentId: Args.string({description: 'Content asset ID', required: true}),
  };

  static description = 'Show a content asset as JSON (classic assets only, not Page Designer pages)';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> about-us --library SharedLibrary',
    '<%= config.bin %> <%= command.id %> about-us --folders',
    '<%= config.bin %> <%= command.id %> about-us > about-us.json',
  ];

  static flags = {
    ...LIBRARY_FLAG,
    folders: Flags.boolean({description: 'Include the folders the asset is assigned to'}),
  };

  protected operations = {getContentAsset, getContentAssetFolders};

  async run(): Promise<ExperienceContentAsset & {folders?: string[]}> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);

    let result: ExperienceContentAsset & {folders?: string[]};
    try {
      result = await this.operations.getContentAsset(this.instance, libraryId, this.args.contentId);
      if (this.flags.folders) {
        const folders = await this.operations.getContentAssetFolders(this.instance, libraryId, this.args.contentId);
        result = {...result, folders: folders.map((f) => f.id)};
      }
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(JSON.stringify(result, null, 2));
    return result;
  }
}
