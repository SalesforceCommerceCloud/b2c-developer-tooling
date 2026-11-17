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
  getContentFolder,
  type ExperienceContentFolder,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {LIBRARY_FLAG, LIBRARY_REQUIRED, resolveLibraryId} from '../../../utils/content/library.js';

export default class ContentFolderGet extends InstanceCommand<typeof ContentFolderGet> {
  static args = {
    folderId: Args.string({description: 'Folder ID', required: true}),
  };

  static description = 'Show a content folder as JSON (needs the sfcc.experiences.rw scope)';

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> promos --library SharedLibrary'];

  static flags = {...LIBRARY_FLAG};

  protected operations = {getContentFolder};

  async run(): Promise<ExperienceContentFolder> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);

    let folder;
    try {
      folder = await this.operations.getContentFolder(this.instance, libraryId, this.args.folderId);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(JSON.stringify(folder, null, 2));
    return folder;
  }
}
