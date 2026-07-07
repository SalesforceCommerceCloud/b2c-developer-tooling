/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Fuse from 'fuse.js';
import {JOB_STEPS_DATA_DIR, SCRIPT_API_DATA_DIR, type DocEntry, type SearchIndex, type SearchResult} from './types.js';

// Singleton cache for loaded index and Fuse instance
let cachedIndex: SearchIndex | null = null;
let cachedFuse: Fuse<DocEntry> | null = null;

// Maps each entry id to the absolute data directory that holds its file. This
// lets a single combined index span multiple bundled corpora (Script API docs
// and the standard job-step reference) without changing the public DocEntry shape.
const entryDataDir = new Map<string, string>();

/**
 * Loads one bundled index.json from the given directory, returning its entries
 * and recording the directory for each entry id. Missing indexes are ignored.
 */
function loadCorpus(dataDir: string): DocEntry[] {
  const indexPath = path.join(dataDir, 'index.json');
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SearchIndex;
  for (const entry of parsed.entries) {
    // First corpus wins on id collision (Script API is loaded first).
    if (!entryDataDir.has(entry.id)) {
      entryDataDir.set(entry.id, dataDir);
    }
  }
  return parsed.entries;
}

/**
 * Loads the pre-built search index from the bundled data directories.
 *
 * Combines the Script API documentation corpus with the standard job-step
 * reference so both are searchable through the same functions.
 *
 * @returns The combined search index with all documentation entries
 * @throws Error if the Script API index file cannot be read
 */
export function loadSearchIndex(): SearchIndex {
  if (cachedIndex) return cachedIndex;

  entryDataDir.clear();
  const scriptApiEntries = loadCorpus(SCRIPT_API_DATA_DIR);
  const jobStepEntries = loadCorpus(JOB_STEPS_DATA_DIR);

  cachedIndex = {
    version: '1.0.0',
    generatedAt: new Date(0).toISOString(),
    entries: [...scriptApiEntries, ...jobStepEntries],
  };
  return cachedIndex;
}

/**
 * Gets or creates the Fuse.js search instance.
 */
function getFuseInstance(): Fuse<DocEntry> {
  if (cachedFuse) return cachedFuse;

  const index = loadSearchIndex();

  cachedFuse = new Fuse(index.entries, {
    keys: [
      {name: 'title', weight: 0.5},
      {name: 'id', weight: 0.5},
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });

  return cachedFuse;
}

/**
 * Searches the documentation index with fuzzy matching.
 *
 * @param query - The search query string
 * @param limit - Maximum number of results to return (default: 20)
 * @returns Array of search results sorted by relevance
 *
 * @example
 * ```typescript
 * const results = searchDocs('ProductMgr');
 * results.forEach(r => console.log(r.entry.id, r.score));
 * ```
 */
export function searchDocs(query: string, limit = 20): SearchResult[] {
  const fuse = getFuseInstance();
  const results = fuse.search(query, {limit});

  return results.map((r) => ({
    entry: r.item,
    score: r.score ?? 0,
  }));
}

/**
 * Reads the content of a documentation file by its ID.
 *
 * @param id - The documentation ID (filename without .md extension)
 * @returns The raw markdown content of the document
 * @throws Error if the document is not found
 *
 * @example
 * ```typescript
 * const content = readDoc('dw.catalog.ProductMgr');
 * console.log(content);
 * ```
 */
export function readDoc(id: string): string {
  const index = loadSearchIndex();
  const entry = index.entries.find((e) => e.id === id);

  if (!entry) {
    throw new Error(`Documentation not found: ${id}`);
  }

  const dataDir = entryDataDir.get(entry.id) ?? SCRIPT_API_DATA_DIR;
  const filePath = path.join(dataDir, entry.filePath);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Reads documentation by fuzzy-matching the query and returning the best match.
 *
 * @param query - The search query string
 * @returns The best matching entry and its content, or null if no match
 *
 * @example
 * ```typescript
 * const doc = readDocByQuery('ProductMgr');
 * if (doc) {
 *   console.log(`Found: ${doc.entry.title}`);
 *   console.log(doc.content);
 * }
 * ```
 */
export function readDocByQuery(query: string): {entry: DocEntry; content: string} | null {
  const results = searchDocs(query, 1);

  if (results.length === 0) {
    return null;
  }

  const entry = results[0].entry;
  const content = readDoc(entry.id);

  return {entry, content};
}

/**
 * Lists all available documentation entries.
 *
 * @returns Array of all documentation entries in the index
 *
 * @example
 * ```typescript
 * const docs = listDocs();
 * console.log(`${docs.length} documentation files available`);
 * ```
 */
export function listDocs(): DocEntry[] {
  const index = loadSearchIndex();
  return index.entries;
}
