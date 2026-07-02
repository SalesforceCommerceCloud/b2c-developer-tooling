/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import MiniSearch from 'minisearch';
import {getLogger} from '../logging/logger.js';
import {
  GUIDES_DATA_DIR,
  JOB_STEPS_DATA_DIR,
  SCRIPT_API_DATA_DIR,
  TOOLING_DATA_DIR,
  type DocCategory,
  type DocEntry,
  type SearchIndex,
  type SearchResult,
} from './types.js';

/**
 * The bundled corpora, loaded (and combined) in priority order. Earlier corpora
 * win on id collisions. Each directory holds an `index.json` ({@link SearchIndex})
 * and, for corpora whose content ships in the package, the referenced files.
 */
const CORPUS_DIRS: readonly string[] = [SCRIPT_API_DATA_DIR, JOB_STEPS_DATA_DIR, GUIDES_DATA_DIR, TOOLING_DATA_DIR];

// Singleton caches for the combined index and the MiniSearch instance.
let cachedIndex: SearchIndex | null = null;
let cachedMiniSearch: MiniSearch<IndexedDoc> | null = null;

// Maps each entry id to the absolute data directory that holds its bundled file.
// Lets a single combined index span multiple bundled corpora without changing
// the public DocEntry shape. Online-only entries (guides) are not recorded here.
const entryDataDir = new Map<string, string>();

// Maps each entry id to its full DocEntry, for O(1) lookup on read.
const entryById = new Map<string, DocEntry>();

/** Internal shape indexed by MiniSearch. `keywords` is flattened for indexing. */
interface IndexedDoc {
  id: string;
  title: string;
  category: string;
  headings: string;
  summary: string;
  keywords: string;
}

/**
 * Loads one bundled index.json from the given directory, returning its entries
 * and recording the directory for each id that ships its content on disk.
 * Missing indexes are ignored so a not-yet-generated corpus is simply absent.
 */
function loadCorpus(dataDir: string): DocEntry[] {
  const indexPath = path.join(dataDir, 'index.json');
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SearchIndex;
  for (const entry of parsed.entries) {
    if (entryById.has(entry.id)) continue; // first corpus wins on id collision
    entryById.set(entry.id, entry);
    // Only record a data dir for entries whose content is bundled on disk.
    if (entry.filePath) {
      entryDataDir.set(entry.id, dataDir);
    }
  }
  return parsed.entries;
}

/**
 * Loads the combined search index from every bundled corpus directory.
 *
 * Combines the Script API reference, standard job steps, Developer Center
 * guides, and this project's own docs so all are searchable through the same
 * functions. Corpora that have not been generated are skipped.
 *
 * @returns The combined search index with all documentation entries
 */
export function loadSearchIndex(): SearchIndex {
  if (cachedIndex) return cachedIndex;

  entryDataDir.clear();
  entryById.clear();

  const entries: DocEntry[] = [];
  const perCorpus: Record<string, number> = {};
  for (const dir of CORPUS_DIRS) {
    const loaded = loadCorpus(dir);
    perCorpus[path.basename(dir)] = loaded.length;
    entries.push(...loaded);
  }

  getLogger().debug({total: entries.length, perCorpus}, 'Loaded combined documentation search index');

  cachedIndex = {
    version: '2.0.0',
    generatedAt: new Date(0).toISOString(),
    entries,
  };
  return cachedIndex;
}

/**
 * Gets or creates the MiniSearch instance over the combined index.
 *
 * MiniSearch gives tokenized, BM25-style ranking with field boosting — far
 * better recall on prose (Developer Center guides) than a title-only fuzzy
 * match, while still returning class-name lookups (e.g. "ProductMgr") first.
 */
function getMiniSearch(): MiniSearch<IndexedDoc> {
  if (cachedMiniSearch) return cachedMiniSearch;

  const index = loadSearchIndex();

  const ms = new MiniSearch<IndexedDoc>({
    idField: 'id',
    fields: ['title', 'id', 'headings', 'keywords', 'summary'],
    // We look entries up in entryById on read, so nothing extra needs storing.
    storeFields: ['category'],
    searchOptions: {
      boost: {title: 3, id: 2.5, keywords: 2, headings: 2, summary: 1.5},
      fuzzy: 0.2,
      prefix: true,
      // OR-combine: relevance ranking surfaces the best (near-AND) matches first
      // while still finding prose docs from natural-language queries whose
      // stopwords ("how", "the") are not indexed. Verified best recall in eval.
    },
  });

  ms.addAll(
    index.entries.map((e) => ({
      id: e.id,
      title: e.title ?? '',
      category: e.category ?? '',
      headings: e.headings ?? '',
      summary: e.summary ?? '',
      keywords: Array.isArray(e.keywords) ? e.keywords.join(' ') : '',
    })),
  );

  getLogger().debug({documentCount: index.entries.length}, 'Built MiniSearch index for documentation search');

  cachedMiniSearch = ms;
  return ms;
}

/**
 * Options for {@link searchDocs}.
 */
export interface SearchDocsOptions {
  /** Maximum number of results to return (default: 20). */
  limit?: number;
  /** Restrict results to one or more corpora/categories. */
  category?: DocCategory | DocCategory[];
}

/**
 * Searches the combined documentation index.
 *
 * Higher scores are better. Results carry the full {@link DocEntry} (including
 * `category`, `summary`, `keywords`, and `url` when available) so callers can
 * triage matches without a follow-up read.
 *
 * @param query - The search query string
 * @param limitOrOptions - Result limit (number) or {@link SearchDocsOptions}
 * @returns Array of search results sorted by relevance (best first)
 *
 * @example
 * ```typescript
 * const results = searchDocs('passwordless login', {category: 'commerce-api'});
 * results.forEach(r => console.log(r.entry.id, r.score));
 * ```
 */
export function searchDocs(query: string, limitOrOptions?: number | SearchDocsOptions): SearchResult[] {
  const opts: SearchDocsOptions = typeof limitOrOptions === 'number' ? {limit: limitOrOptions} : (limitOrOptions ?? {});
  const limit = opts.limit ?? 20;
  const categories = opts.category ? (Array.isArray(opts.category) ? opts.category : [opts.category]) : undefined;

  const ms = getMiniSearch();

  const raw = ms.search(query, {
    filter: categories ? (r) => categories.includes(r.category as DocCategory) : undefined,
  });

  const results: SearchResult[] = [];
  for (const r of raw) {
    const entry = entryById.get(r.id as string);
    if (!entry) continue;
    results.push({entry, score: r.score});
    if (results.length >= limit) break;
  }

  const logger = getLogger();
  logger.debug({query, categories, limit, matched: raw.length, returned: results.length}, 'docs searchDocs completed');
  logger.trace(
    {query, top: results.slice(0, 5).map((r) => ({id: r.entry.id, score: r.score}))},
    'docs search top hits',
  );

  return results;
}

/**
 * Lists documentation entries, optionally filtered by category.
 *
 * @param category - Optional corpus/category (or list) to restrict to
 * @returns Array of matching documentation entries
 */
export function listDocs(category?: DocCategory | DocCategory[]): DocEntry[] {
  const index = loadSearchIndex();
  if (!category) return index.entries;
  const categories = Array.isArray(category) ? category : [category];
  return index.entries.filter((e) => e.category && categories.includes(e.category));
}

/**
 * Reads the full content of a documentation entry by its exact id.
 *
 * Bundled entries are read from disk. Entries whose content is published online
 * (Developer Center guides) are fetched from their canonical URL; on network
 * failure a readable fallback assembled from the indexed metadata is returned.
 *
 * @param id - The documentation id
 * @returns The document content (markdown)
 * @throws Error if the id is unknown
 */
export async function readDoc(id: string): Promise<string> {
  loadSearchIndex();
  const entry = entryById.get(id);
  if (!entry) {
    throw new Error(`Documentation not found: ${id}`);
  }
  return readEntryContent(entry);
}

/**
 * Reads the content of a resolved {@link DocEntry}, choosing bundled-file vs.
 * online fetch based on whether the entry ships its content on disk.
 */
export async function readEntryContent(entry: DocEntry): Promise<string> {
  const logger = getLogger();
  const dataDir = entryDataDir.get(entry.id);
  if (dataDir && entry.filePath) {
    logger.debug({id: entry.id, source: 'bundled', filePath: entry.filePath}, 'Reading bundled documentation entry');
    return fs.readFileSync(path.join(dataDir, entry.filePath), 'utf-8');
  }
  if (entry.url) {
    logger.debug({id: entry.id, source: 'online', url: entry.url}, 'Reading online documentation entry');
    return fetchOnlineContent(entry);
  }
  throw new Error(`No content source for documentation entry: ${entry.id}`);
}

/**
 * Fetches a guide's markdown from its published URL, falling back to a summary
 * assembled from indexed metadata if the request fails (offline, 404, etc.).
 */
async function fetchOnlineContent(entry: DocEntry): Promise<string> {
  const logger = getLogger();
  try {
    logger.trace({url: entry.url}, 'Fetching online documentation content');
    const res = await fetch(entry.url!, {headers: {accept: 'text/markdown, text/plain, */*'}});
    if (!res.ok) {
      logger.debug({url: entry.url, status: res.status}, 'Online doc fetch returned non-OK status');
      return offlineFallback(entry, `HTTP ${res.status}`);
    }
    const text = await res.text();
    logger.trace({url: entry.url, bytes: text.length}, 'Fetched online documentation content');
    return text;
  } catch (err) {
    logger.debug({url: entry.url, err}, 'Online doc fetch failed');
    return offlineFallback(entry, err instanceof Error ? err.message : String(err));
  }
}

/** Assembles a minimal readable document from indexed metadata when fetch fails. */
function offlineFallback(entry: DocEntry, reason: string): string {
  const lines = [`# ${entry.title}`, ''];
  if (entry.summary) lines.push(entry.summary, '');
  if (entry.headings)
    lines.push(
      '## Sections',
      '',
      entry.headings
        .split(' • ')
        .map((h) => `- ${h}`)
        .join('\n'),
      '',
    );
  if (entry.url) lines.push(`Full documentation: ${entry.url}`, '');
  lines.push(`> Note: live content could not be fetched (${reason}); showing indexed summary only.`);
  return lines.join('\n');
}

/**
 * Reads documentation by fuzzy-matching the query and returning the best match.
 *
 * @param query - The search query string
 * @param options - Optional search constraints (e.g. category)
 * @returns The best matching entry and its content, or null if no match
 *
 * @example
 * ```typescript
 * const doc = await readDocByQuery('ProductMgr');
 * if (doc) console.log(doc.content);
 * ```
 */
export async function readDocByQuery(
  query: string,
  options?: SearchDocsOptions,
): Promise<{entry: DocEntry; content: string} | null> {
  // Prefer an exact id match so precise lookups are deterministic. Honor a
  // category constraint so an exact id in a non-requested corpus does not win.
  loadSearchIndex();
  const exact = entryById.get(query);
  if (exact) {
    const categories = options?.category
      ? Array.isArray(options.category)
        ? options.category
        : [options.category]
      : undefined;
    if (!categories || (exact.category && categories.includes(exact.category))) {
      return {entry: exact, content: await readEntryContent(exact)};
    }
  }

  const results = searchDocs(query, {...options, limit: 1});
  if (results.length === 0) {
    return null;
  }
  const entry = results[0].entry;
  return {entry, content: await readEntryContent(entry)};
}

/**
 * Resets the in-memory index/search caches. Intended for tests that swap the
 * bundled data on disk between assertions.
 */
export function resetDocsCache(): void {
  cachedIndex = null;
  cachedMiniSearch = null;
  entryDataDir.clear();
  entryById.clear();
}
