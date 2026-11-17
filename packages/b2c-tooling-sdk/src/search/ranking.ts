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

/**
 * Query-time synonym groups. A query term in a group also matches the group's
 * other terms, so "MRT size limits" finds a page whose metadata says
 * "constraints". Prefix matching already covers plurals. Keep groups small and
 * near-identical in meaning; every added term dilutes the rest of the query.
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [['limit', 'limitation', 'constraint', 'quota']];

/** Weight of an expanded synonym relative to the term the user typed. */
const SYNONYM_WEIGHT = 0.3;

const SYNONYMS = new Map<string, readonly string[]>(
  SYNONYM_GROUPS.flatMap((group) => group.map((term) => [term, group] as const)),
);

function synonymsFor(term: string): readonly string[] | undefined {
  // "limits" -> "limit": match a group by its singular so plurals expand too.
  return SYNONYMS.get(term) ?? SYNONYMS.get(term.replace(/s$/, ''));
}

/** Lowercases a query term and adds its synonyms, if any. */
export function expandQueryTerm(term: string): string[] {
  const lower = term.toLowerCase();
  const group = synonymsFor(lower);
  return group ? [lower, ...group.filter((t) => t !== lower.replace(/s$/, ''))] : [lower];
}

/** Down-weights terms added by {@link expandQueryTerm} so they never outrank what was typed. */
export function synonymTermBoost(term: string, _i: number, terms: string[]): number {
  const group = synonymsFor(term);
  if (!group) return 1;
  const typedIndex = terms.findIndex((t) => t !== term && synonymsFor(t) === group);
  // The first term of an expanded run is the one the user typed.
  return typedIndex !== -1 && typedIndex < terms.indexOf(term) ? SYNONYM_WEIGHT : 1;
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
      boostTerm: synonymTermBoost,
      processTerm: expandQueryTerm,
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
