/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import * as xml2js from 'xml2js';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  planLibraryPagePush,
  pushPage,
} from '@salesforce/b2c-tooling-sdk/operations/content';

/** How a content save was written to the instance. */
export type ContentSaveResult =
  | {method: 'experiences-api'; siteId: string; pageId: string; pageXml: string}
  | {method: 'import'; fallbackReason?: string; pageXml?: string};

type XmlContent = Record<string, unknown> & {$?: Record<string, string>};

function contentElements(doc: Record<string, unknown>): XmlContent[] {
  const library = doc['library'] as Record<string, unknown> | undefined;
  return (library?.['content'] as XmlContent[] | undefined) ?? [];
}

/**
 * Replaces the page XML's content elements with the edited ones (matched by
 * content ID) and adds edited elements the page did not have yet, so the
 * result is the whole page with the component edit applied.
 */
export async function applyEditToPageXml(pageXml: string, editedXml: string): Promise<string> {
  const page = (await xml2js.parseStringPromise(pageXml)) as Record<string, unknown>;
  const edited = (await xml2js.parseStringPromise(editedXml)) as Record<string, unknown>;
  const replacements = new Map(contentElements(edited).map((c) => [c.$?.['content-id'], c]));
  const merged = contentElements(page).map((c) => {
    const id = c.$?.['content-id'];
    const replacement = replacements.get(id);
    replacements.delete(id);
    return replacement ?? c;
  });
  merged.push(...replacements.values());
  (page['library'] as Record<string, unknown>)['content'] = merged;
  return new xml2js.Builder().buildObject(page);
}

/**
 * The page a component belongs to, captured when the component was opened, so
 * a component save can update its page through the Experiences API.
 */
export interface ContentPageContext {
  pageId: string;
  /** The page's XML (page and every component under it) as it was opened. */
  pageXml: string;
}

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
  /** For a component: its page, so the save can go through a page update. */
  page?: ContentPageContext;
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
  const {page} = options;
  // A component edit is saved as an update of its page: the page as opened,
  // with the edited component (and anything under it) swapped in.
  const pageXml = page ? await applyEditToPageXml(page.pageXml, options.xml).catch(() => undefined) : undefined;
  const fallback = async (reason?: string): Promise<ContentSaveResult> => {
    if (reason) logger.info(`[Content] Saving ${options.contentId} with a site import: ${reason}`);
    await options.importXml();
    return {method: 'import', fallbackReason: reason, pageXml};
  };

  if (!options.useExperiencesApi) return fallback();
  const siteId = options.isSiteLibrary ? options.libraryId : options.siteId;
  if (page && !pageXml) return fallback('the edited XML could not be applied to its page');

  const pageId = page?.pageId ?? options.contentId;
  const plan = await planLibraryPagePush(pageXml ?? options.xml, {
    pageId,
    originalXml: page ? page.pageXml : options.originalXml,
  });
  if (!plan.pushable) return fallback(plan.reason);
  if (!siteId) return fallback('no site ID is configured (siteId in dw.json) for the page update');

  try {
    const result = await (options.push ?? pushPage)(options.instance, plan.page, {siteId});
    const what = page ? `component ${options.contentId} (page ${pageId})` : `page ${pageId}`;
    logger.info(`[Content] Saved ${what} through the Experiences API (${result.status})`);
    return {method: 'experiences-api', siteId, pageId, pageXml: pageXml ?? options.xml};
  } catch (error) {
    if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
      return fallback(`the Experiences API page update failed (${error.message})`);
    }
    throw error;
  }
}
