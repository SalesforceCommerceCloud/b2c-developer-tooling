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
  patchContentAsset,
  type ExperienceContentAsset,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {
  LIBRARY_FLAG,
  LIBRARY_ITEM_FLAGS,
  LIBRARY_REQUIRED,
  buildLibraryItemInput,
  resolveLibraryId,
} from '../../../utils/content/library.js';

export default class ContentAssetUpdate extends InstanceCommand<typeof ContentAssetUpdate> {
  static args = {
    contentId: Args.string({description: 'Content asset ID', required: true}),
  };

  static description = 'Change fields of a content asset and keep the rest';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> summer-banner --no-online',
    '<%= config.bin %> <%= command.id %> summer-banner --locale fr --markup c_body="<p>Bonjour</p>"',
  ];

  static flags = {
    ...LIBRARY_FLAG,
    ...LIBRARY_ITEM_FLAGS,
  };

  protected operations = {patchContentAsset};

  async run(): Promise<ExperienceContentAsset> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);

    let changes;
    try {
      changes = await buildLibraryItemInput(this.flags, {localizedOnline: true});
    } catch (error) {
      this.error((error as Error).message);
    }
    if (Object.keys(changes).length === 0) this.error('Nothing to update. Pass at least one field flag or --file.');

    let asset;
    try {
      asset = await this.operations.patchContentAsset(this.instance, libraryId, this.args.contentId, changes);
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }
    if (!this.jsonEnabled()) ux.stdout(`Updated content asset ${this.args.contentId}`);
    return asset;
  }
}
