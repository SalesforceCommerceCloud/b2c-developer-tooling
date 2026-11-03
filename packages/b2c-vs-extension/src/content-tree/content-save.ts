/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  planLibraryPagePush,
  pushPage,
} from '@salesforce/b2c-tooling-sdk/operations/content';

/** How a content save was written to the instance. */
export type ContentSaveResult =
  | {method: 'experiences-api'; siteId: string}
  | {method: 'import'; fallbackReason?: string};

export interface SaveContentOptions {
  instance: B2CInstance;
  libraryId: string;
  isSiteLibrary: boolean;
  contentId: string;
  xml: string;
  /** The XML as it was opened, used to tell which fields the edit changed. */
  originalXml?: string;
  /** Site for the page PUT; a site-private library uses its own ID. */
  siteId?: string;
  /** `b2c-dx.content.saveWithExperiencesApi` (default on). */
  useExperiencesApi: boolean;
  /** The existing site-archive import (always available as the fallback). */
  importXml: () => Promise<void>;
  /** Overridable for tests. */
  push?: typeof pushPage;
}

/**
 * Saves an edited content item. Pages go through the Experiences API page PUT
 * when the edit fits what it can write; everything else, and every API
 * failure, falls back to the site-archive import used before.
 */
export async function saveContentXml(options: SaveContentOptions): Promise<ContentSaveResult> {
  const logger = getLogger();
  const fallback = async (reason?: string): Promise<ContentSaveResult> => {
    if (reason) logger.info(`[Content] Saving ${options.contentId} with a site import: ${reason}`);
    await options.importXml();
    return {method: 'import', fallbackReason: reason};
  };

  if (!options.useExperiencesApi) return fallback();
  const siteId = options.isSiteLibrary ? options.libraryId : options.siteId;

  const plan = await planLibraryPagePush(options.xml, {pageId: options.contentId, originalXml: options.originalXml});
  if (!plan.pushable) return fallback(plan.reason);
  if (!siteId) return fallback('no site ID is configured (siteId in dw.json) for the page update');

  try {
    const result = await (options.push ?? pushPage)(options.instance, plan.page, {siteId});
    logger.info(`[Content] Saved page ${options.contentId} through the Experiences API (${result.status})`);
    return {method: 'experiences-api', siteId};
  } catch (error) {
    if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
      return fallback(`the Experiences API page update failed (${error.message})`);
    }
    throw error;
  }
}
