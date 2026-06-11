/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {DocEntryKind, SearchEntry} from './types.js';

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

export interface SearchOptions {
  /** Maximum number of results to return. Defaults to 50. */
  limit?: number;
  /** Restrict to a single kind (e.g. only methods). */
  kinds?: ReadonlySet<DocEntryKind>;
}

const DEFAULT_LIMIT = 50;

/**
 * Score buckets. Higher = better. We pick deterministic integer ranks rather
 * than fuzzy floats so test expectations are stable.
 */
const SCORE = {
  EXACT_QUALIFIED: 1000,
  EXACT_TITLE: 900,
  TITLE_STARTS_WITH: 800,
  QUALIFIED_STARTS_WITH: 700,
  TAG_EXACT: 650,
  TAG_STARTS_WITH: 600,
  TITLE_SUBSTRING: 500,
  QUALIFIED_SUBSTRING: 400,
} as const;

/** Soft kind boost — tie-breaker only. Not enough to outrank a better match. */
const KIND_BOOST: Record<DocEntryKind, number> = {
  package: 5,
  class: 4,
  interface: 4,
  enum: 4,
  method: 2,
  property: 1,
  constant: 1,
};

/**
 * Rank entries against a free-form query.
 *
 * The query is normalized to lowercase. `dw.order.BasketMgr`,
 * `dw/order/BasketMgr`, and `BasketMgr` should all surface the same entry.
 *
 * Ties are broken by qualifiedName lex order so the output is stable.
 */
export function searchDocs(entries: readonly SearchEntry[], query: string, options: SearchOptions = {}): SearchHit[] {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const normalizedQuery = trimmed.toLowerCase();
  const slashedQuery = normalizedQuery.replace(/\./g, '/');
  const dottedQuery = normalizedQuery.replace(/\//g, '.');

  const hits: SearchHit[] = [];
  for (const entry of entries) {
    if (options.kinds && !options.kinds.has(entry.kind)) continue;
    const score = scoreEntry(entry, normalizedQuery, dottedQuery, slashedQuery);
    if (score <= 0) continue;
    hits.push({entry, score: score + KIND_BOOST[entry.kind]});
  }

  hits.sort(byScoreDescThenName);
  if (hits.length > limit) hits.length = limit;
  return hits;
}

function scoreEntry(entry: SearchEntry, query: string, dottedQuery: string, slashedQuery: string): number {
  const title = entry.title.toLowerCase();
  const qualified = entry.qualifiedName.toLowerCase();
  const packagePath = entry.packagePath?.toLowerCase();

  if (qualified === dottedQuery || qualified === query) return SCORE.EXACT_QUALIFIED;
  if (title === query) return SCORE.EXACT_TITLE;

  if (title.startsWith(query)) return SCORE.TITLE_STARTS_WITH;
  if (qualified.startsWith(dottedQuery) || qualified.startsWith(query)) return SCORE.QUALIFIED_STARTS_WITH;
  if (packagePath && (packagePath.startsWith(slashedQuery) || packagePath.startsWith(query))) {
    return SCORE.QUALIFIED_STARTS_WITH;
  }

  if (entry.tags) {
    for (const tag of entry.tags) {
      const t = tag.toLowerCase();
      if (t === query || t === dottedQuery) return SCORE.TAG_EXACT;
      if (t.startsWith(query)) return SCORE.TAG_STARTS_WITH;
    }
  }

  if (title.includes(query)) return SCORE.TITLE_SUBSTRING;
  if (qualified.includes(query) || qualified.includes(dottedQuery)) return SCORE.QUALIFIED_SUBSTRING;

  return 0;
}

function byScoreDescThenName(a: SearchHit, b: SearchHit): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.entry.qualifiedName !== b.entry.qualifiedName) {
    return a.entry.qualifiedName < b.entry.qualifiedName ? -1 : 1;
  }
  return 0;
}
