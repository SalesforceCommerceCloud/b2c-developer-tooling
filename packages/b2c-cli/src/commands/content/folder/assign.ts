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
  assignContentToFolder,
  type ExperienceContentFolderAssignment,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {LIBRARY_FLAG, LIBRARY_REQUIRED, resolveLibraryId} from '../../../utils/content/library.js';

export default class ContentFolderAssign extends InstanceCommand<typeof ContentFolderAssign> {
  static args = {
    folderId: Args.string({description: 'Folder ID', required: true}),
    contentId: Args.string({description: 'Content asset ID', required: true}),
  };

  static description = 'Assign a content asset to a folder';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> promos summer-banner',
    '<%= config.bin %> <%= command.id %> promos summer-banner --default --position 1',
  ];

  static flags = {
    ...LIBRARY_FLAG,
    default: Flags.boolean({description: "Make this the asset's classification folder"}),
    position: Flags.integer({description: 'Sort position within the folder'}),
  };

  protected operations = {assignContentToFolder};

  async run(): Promise<ExperienceContentFolderAssignment> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);
    const {folderId, contentId} = this.args;

    let assignment;
    try {
      assignment = await this.operations.assignContentToFolder(this.instance, libraryId, contentId, folderId, {
        default: this.flags.default || undefined,
        position: this.flags.position,
      });
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Assigned content asset ${contentId} to folder ${folderId}`);
    return assignment;
  }
}
