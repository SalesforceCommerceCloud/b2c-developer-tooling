/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type MiniSearch from 'minisearch';
import {createRankedIndex} from '../search/ranking.js';
import {XSD_DATA_DIR, type SchemaEntry, type SchemaIndex, type SchemaSearchResult} from './types.js';

// Lazy-loaded index and search instance
let schemaIndex: SchemaIndex | null = null;
let searchInstance: MiniSearch | null = null;
const entryById = new Map<string, SchemaEntry>();

/**
 * Load the schema index from disk.
 */
function loadIndex(): SchemaIndex {
  if (schemaIndex) {
    return schemaIndex;
  }

  const indexPath = path.join(XSD_DATA_DIR, 'index.json');
  const content = fs.readFileSync(indexPath, 'utf-8');
  schemaIndex = JSON.parse(content) as SchemaIndex;
  for (const entry of schemaIndex.entries) entryById.set(entry.id, entry);
  return schemaIndex;
}

/**
 * Get or create the search instance over schema IDs.
 */
function getSearch(): MiniSearch {
  if (searchInstance) {
    return searchInstance;
  }

  searchInstance = createRankedIndex(loadIndex().entries.map((entry) => ({id: entry.id, title: entry.id})));
  return searchInstance;
}

/**
 * Rank schema IDs for a query. IDs are compound words ("giftcertificate"), so the query is also tried with
 * separators removed; "gift certificate" and "gift-certificate" both match.
 */
function rankSchemas(query: string, limit: number): SchemaSearchResult[] {
  const compact = query.toLowerCase().replaceAll(/[^a-z\d]+/g, '');
  return getSearch()
    .search(
      {combineWith: 'OR', queries: compact ? [query, compact] : [query]},
      {fuzzy: (term) => (term.length > 3 ? 0.25 : false)},
    )
    .slice(0, limit)
    .map((result) => ({entry: entryById.get(result.id as string)!, score: result.score}));
}

/**
 * List all available schema entries.
 *
 * @returns Array of all schema entries in the index
 *
 * @example
 * ```typescript
 * const schemas = listSchemas();
 * schemas.forEach(s => console.log(s.id));
 * ```
 */
export function listSchemas(): SchemaEntry[] {
  const index = loadIndex();
  return index.entries;
}

/**
 * Read a schema by its exact ID.
 *
 * @param id - The exact schema ID to look up
 * @returns An object containing the schema entry, file content, and file path; or null if the schema ID is not found
 */
export function readSchema(id: string): {entry: SchemaEntry; content: string; path: string} | null {
  const index = loadIndex();
  const entry = index.entries.find((e) => e.id === id);

  if (!entry) {
    return null;
  }

  const filePath = path.join(XSD_DATA_DIR, entry.filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  return {entry, content, path: filePath};
}

/**
 * Find a schema by fuzzy query and return its content.
 * First attempts an exact ID match, then falls back to fuzzy search.
 * Returns the best match or null if no match found.
 *
 * @param query - The search query string (can be exact schema ID or fuzzy search term)
 * @returns Object containing the schema entry, file content, and file path; or null if no match found
 */
export function readSchemaByQuery(query: string): {entry: SchemaEntry; content: string; path: string} | null {
  // First try exact match
  const exactMatch = readSchema(query);
  if (exactMatch) {
    return exactMatch;
  }

  // Try fuzzy search
  const [bestMatch] = rankSchemas(query, 1);

  if (!bestMatch) {
    return null;
  }

  const filePath = path.join(XSD_DATA_DIR, bestMatch.entry.filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  return {entry: bestMatch.entry, content, path: filePath};
}

/**
 * Search schemas by fuzzy query.
 *
 * @param query - The search query string to match against schema IDs
 * @param limit - Maximum number of results to return (default: 20)
 * @returns Array of schema search results with relevance scores, best match first (higher scores indicate better matches)
 *
 * @example
 * ```typescript
 * const results = searchSchemas('catalog');
 * results.forEach(r => console.log(r.entry.id, r.score));
 * ```
 */
export function searchSchemas(query: string, limit = 20): SchemaSearchResult[] {
  return rankSchemas(query, limit);
}
