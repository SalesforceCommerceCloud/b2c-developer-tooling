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
  putContentAsset,
  type ExperienceContentAsset,
  type LibraryPutResult,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {
  LIBRARY_FLAG,
  LIBRARY_ITEM_FLAGS,
  LIBRARY_REQUIRED,
  buildLibraryItemInput,
  resolveLibraryId,
} from '../../../utils/content/library.js';

export default class ContentAssetPut extends InstanceCommand<typeof ContentAssetPut> {
  static args = {
    contentId: Args.string({description: 'Content asset ID', required: true}),
  };

  static description = 'Create or replace a content asset, optionally placing it in a folder';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> summer-banner --name "Summer Banner" --online --markup c_body="<p>Hello</p>" --folder promos',
    '<%= config.bin %> <%= command.id %> summer-banner --file summer-banner.json',
  ];

  static flags = {
    ...LIBRARY_FLAG,
    ...LIBRARY_ITEM_FLAGS,
    folder: Flags.string({description: 'Assign the asset to this folder as its classification folder'}),
  };

  protected operations = {assignContentToFolder, putContentAsset};

  async run(): Promise<LibraryPutResult<ExperienceContentAsset>> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);
    const {contentId} = this.args;

    let input;
    try {
      input = await buildLibraryItemInput(this.flags, {localizedOnline: true});
    } catch (error) {
      this.error((error as Error).message);
    }

    let result;
    try {
      result = await this.operations.putContentAsset(this.instance, libraryId, contentId, input);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (this.flags.folder) {
      try {
        await this.operations.assignContentToFolder(this.instance, libraryId, contentId, this.flags.folder, {
          default: true,
        });
      } catch (error) {
        if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
          this.error(
            `Content asset ${contentId} was ${result.status === 'created' ? 'created' : 'replaced'}, but assigning it to folder ${this.flags.folder} failed: ${error.message}. Retry with "b2c content folder assign ${this.flags.folder} ${contentId} --default".`,
          );
        }
        throw error;
      }
    }
    if (!this.jsonEnabled()) {
      const where = this.flags.folder ? ` in folder ${this.flags.folder}` : '';
      ux.stdout(`${result.status === 'created' ? 'Created' : 'Replaced'} content asset ${contentId}${where}`);
    }
    return result;
  }
}
