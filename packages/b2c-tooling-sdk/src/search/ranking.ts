/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import MiniSearch from 'minisearch';

/** Shared ranking fields; each corpus owns its index and query-time filters. */
export interface RankedDocument {
  id: string;
  title: string;
  category?: string;
  headings?: string;
  summary?: string;
  keywords?: string[];
}

/** Build an independent index using the established documentation ranking. */
export function createRankedIndex(entries: readonly RankedDocument[]): MiniSearch {
  const index = new MiniSearch({
    idField: 'id',
    fields: ['title', 'id', 'headings', 'keywords', 'summary'],
    storeFields: ['category'],
    searchOptions: {
      boost: {title: 3, id: 2.5, keywords: 2, headings: 2, summary: 1.5},
      fuzzy: 0.2,
      prefix: true,
    },
  });
  index.addAll(
    entries.map((entry) => ({
      ...entry,
      category: entry.category ?? '',
      headings: entry.headings ?? '',
      summary: entry.summary ?? '',
      keywords: entry.keywords?.join(' ') ?? '',
    })),
  );
  return index;
}
