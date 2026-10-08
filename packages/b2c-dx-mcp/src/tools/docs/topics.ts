/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {DOC_CATEGORIES, type DocCategory} from '@salesforce/b2c-tooling-sdk/docs';

/**
 * Helpers for the launch-time documentation "topics" allowlist (`--docs-topics`),
 * shared across the docs search/list/read tools so the enabled-category boundary
 * is described and enforced consistently.
 */

/**
 * The category values a docs tool's `category` parameter should accept, given
 * the optional launch-time allowlist. When an allowlist is configured the enum
 * is narrowed to it (so the schema itself reflects what is reachable); otherwise
 * every category is accepted.
 *
 * Always returns a non-empty tuple so `z.enum(...)` is happy — an allowlist that
 * somehow filtered to nothing falls back to the full set.
 */
export function categoryEnumValues(enabledCategories?: readonly DocCategory[]): [DocCategory, ...DocCategory[]] {
  const all = [...DOC_CATEGORIES] as DocCategory[];
  if (!enabledCategories || enabledCategories.length === 0) {
    return all as [DocCategory, ...DocCategory[]];
  }
  const allowed = all.filter((c) => enabledCategories.includes(c));
  return (allowed.length > 0 ? allowed : all) as [DocCategory, ...DocCategory[]];
}

/**
 * A sentence for a tool description noting the corpus is restricted to the
 * configured topics, or an empty string when there is no restriction.
 */
/**
 * Returned with every docs_search/docs_read result. Doc IDs are lookup keys for docs_read, not user-facing references;
 * the rule sits next to the data because agents cite while reading results, long after reading tool descriptions.
 */
export const DOCS_CITATION_NOTE =
  'Cite docs to users by url (sourceUrl for Markdown). Never show doc ids; they are docs_read keys. Show ids only if asked.';

export function enabledCategoriesNote(enabledCategories?: readonly DocCategory[]): string {
  if (!enabledCategories || enabledCategories.length === 0) return '';
  if (DOC_CATEGORIES.every((category) => enabledCategories.includes(category))) return '';
  return ` Topics: ${enabledCategories.join(', ')}.`;
}
