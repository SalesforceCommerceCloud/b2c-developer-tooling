/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import MiniSearch from 'minisearch';
import type {ProjectType} from '../discovery/types.js';
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

/**
 * Per-category relevance multipliers applied at search time via MiniSearch's
 * `boostDocument`. Nudges the highest-value / most-current corpora up for
 * ambiguous cross-corpus queries; categories not listed default to `1` (neutral).
 *
 * Kept small on purpose: cross-corpus scores are not normalized, so these only
 * reorder results within a similar score band — a modest boost will not float a
 * weak prose match above a strong exact-title/class-name hit. Use the `category`
 * filter (not a large boost) when you need to hard-scope to one corpus.
 */
const CATEGORY_WEIGHTS: Partial<Record<DocCategory, number>> = {
  tooling: 1.3,
  sfnext: 1.3,
};

/** Multiplier applied to a storefront's relevant categories when a storefront context is known. */
const STOREFRONT_BOOST = 1.4;

/**
 * Doc categories that are relevant to every project regardless of which
 * storefront framework it uses (platform APIs, Script API, job steps, general
 * B2C Commerce guides, and this tooling's own docs).
 */
const ALWAYS_RELEVANT: readonly DocCategory[] = ['commerce-api', 'script-api', 'job-step', 'b2c-commerce', 'tooling'];

/**
 * Maps a detected project/storefront type to the storefront-SPECIFIC doc
 * categories for it. Combined with {@link ALWAYS_RELEVANT} to form the full set
 * of relevant categories. Note SFRA is detected as `cartridges` (the default
 * patterns fold SFRA into the cartridge project type), so `cartridges` maps to
 * the `sfra` guides.
 */
const STOREFRONT_CATEGORIES: Record<ProjectType, DocCategory[]> = {
  cartridges: ['sfra'],
  'pwa-kit-v3': ['pwa-kit-managed-runtime'],
  'storefront-next': ['sfnext'],
};

/**
 * The canonical list of documentation categories, in a stable display order.
 * Exported so the CLI and MCP surfaces validate against a single source of
 * truth instead of maintaining their own copies.
 */
export const DOC_CATEGORIES: readonly DocCategory[] = [
  'script-api',
  'job-step',
  'commerce-api',
  'pwa-kit-managed-runtime',
  'sfnext',
  'sfra',
  'b2c-commerce',
  'tooling',
];

/**
 * Parses and validates a user-supplied set of documentation categories into a
 * "topics" allowlist that bounds the entire available corpus (see
 * {@link SearchDocsOptions.enabledCategories}). Accepts a comma-separated string
 * or an array; names are trimmed and lower-cased.
 *
 * Unknown names are dropped (and reported via `onInvalid`, if provided). Returns
 * `undefined` when the input is empty or contains no valid categories, which
 * means "no restriction" — matching the tolerant behavior of the MCP `--toolsets`
 * flag, so a typo yields a warning and the full corpus rather than a dead tool.
 *
 * @param input - Comma-separated category names, or an array of names
 * @param onInvalid - Optional callback invoked with any unrecognized names
 * @returns The validated, de-duplicated categories, or `undefined` for no restriction
 */
export function resolveEnabledCategories(
  input: string | readonly string[] | undefined,
  onInvalid?: (invalid: string[]) => void,
): DocCategory[] | undefined {
  if (input == undefined) return undefined;
  const raw = Array.isArray(input) ? input : String(input).split(',');
  const names = raw.map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0);
  if (names.length === 0) return undefined;

  const known = new Set<string>(DOC_CATEGORIES);
  const valid: DocCategory[] = [];
  const invalid: string[] = [];
  for (const name of names) {
    if (known.has(name)) valid.push(name as DocCategory);
    else invalid.push(name);
  }
  if (invalid.length > 0) onInvalid?.(invalid);
  return valid.length > 0 ? [...new Set(valid)] : undefined;
}

/** Normalizes a storefront option to an array of project types. */
function toStorefrontList(storefront?: ProjectType | ProjectType[]): ProjectType[] | undefined {
  if (!storefront) return undefined;
  const list = Array.isArray(storefront) ? storefront : [storefront];
  return list.length ? list : undefined;
}

/**
 * Computes the set of doc categories relevant to the given storefront(s):
 * the always-relevant categories plus each storefront's specific categories.
 */
export function categoriesForStorefront(storefront: ProjectType | ProjectType[]): DocCategory[] {
  const list = toStorefrontList(storefront) ?? [];
  const set = new Set<DocCategory>(ALWAYS_RELEVANT);
  for (const type of list) {
    for (const cat of STOREFRONT_CATEGORIES[type] ?? []) set.add(cat);
  }
  return [...set];
}

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
 * Projects a stored entry to the shape returned to callers. Drops `headings`,
 * which exists only to feed the search index (a long ` • `-joined string with
 * no triage value) and would otherwise bloat search/list payloads for agents.
 */
function publicEntry(entry: DocEntry): DocEntry {
  const {headings: _headings, ...rest} = entry;
  return rest;
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
      // NOTE: the per-document category boost is applied per-search in
      // searchDocs (it depends on runtime storefront context), not baked here.
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
 * How a storefront context influences results.
 *
 * - `boost` (default): the storefront's relevant categories rank higher, but
 *   nothing is hidden — cross-storefront docs still appear lower down.
 * - `filter`: only the storefront's relevant categories are returned.
 */
export type StorefrontMode = 'boost' | 'filter';

/**
 * Options for {@link searchDocs}.
 */
export interface SearchDocsOptions {
  /** Maximum number of results to return (default: 20). */
  limit?: number;
  /** Restrict results to one or more corpora/categories (hard filter). */
  category?: DocCategory | DocCategory[];
  /**
   * The current storefront/project type(s). When set, the storefront's relevant
   * categories are boosted (or filtered to, per {@link SearchDocsOptions.storefrontMode})
   * and the storefront preference REPLACES the default category weights.
   */
  storefront?: ProjectType | ProjectType[];
  /** How {@link SearchDocsOptions.storefront} is applied (default: `boost`). */
  storefrontMode?: StorefrontMode;
  /**
   * A hard allowlist of categories that bounds the ENTIRE available corpus for
   * this call — a configuration boundary, distinct from the per-query
   * {@link SearchDocsOptions.category} filter and the soft storefront boost.
   *
   * When set, only entries in these categories are ever eligible; any `category`
   * or storefront `filter` narrows *within* this set (their intersection wins).
   * Intended to be resolved once from a launch-time flag/env var (see
   * {@link resolveEnabledCategories}) so operators can pin the docs surface to
   * exactly the topics they want exposed. `undefined` means no restriction.
   */
  enabledCategories?: readonly DocCategory[];
}

/** Intersects two category lists; `undefined` on either side means "no constraint on that side". */
function intersectCategories(
  a: readonly DocCategory[] | undefined,
  b: readonly DocCategory[] | undefined,
): DocCategory[] | undefined {
  if (!a) return b ? [...b] : undefined;
  if (!b) return [...a];
  const bSet = new Set(b);
  return a.filter((c) => bSet.has(c));
}

/**
 * Searches the combined documentation index.
 *
 * Higher scores are better. Results carry the full {@link DocEntry} (including
 * `category`, `summary`, `keywords`, and `url` when available) so callers can
 * triage matches without a follow-up read.
 *
 * When `storefront` is provided, the relevant categories for that storefront
 * (e.g. `sfra` for cartridges, `pwa-kit-managed-runtime` for PWA Kit,
 * `sfnext` for Storefront Next — plus the always-relevant platform/reference
 * corpora) are favored, and the storefront preference replaces the default
 * category weights. In `filter` mode, only those categories are returned.
 *
 * @param query - The search query string
 * @param limitOrOptions - Result limit (number) or {@link SearchDocsOptions}
 * @returns Array of search results sorted by relevance (best first)
 *
 * @example
 * ```typescript
 * // Favor the current storefront's docs (nothing hidden)
 * searchDocs('deploy bundle', {storefront: 'pwa-kit-v3'});
 * // Only return docs relevant to a Storefront Next project
 * searchDocs('components', {storefront: 'storefront-next', storefrontMode: 'filter'});
 * ```
 */
export function searchDocs(query: string, limitOrOptions?: number | SearchDocsOptions): SearchResult[] {
  const opts: SearchDocsOptions = typeof limitOrOptions === 'number' ? {limit: limitOrOptions} : (limitOrOptions ?? {});
  const limit = opts.limit ?? 20;

  const storefronts = toStorefrontList(opts.storefront);
  const mode = opts.storefrontMode ?? 'boost';

  // Explicit category filter takes precedence; otherwise a storefront in
  // `filter` mode constrains results to that storefront's relevant categories.
  const explicit = opts.category ? (Array.isArray(opts.category) ? opts.category : [opts.category]) : undefined;
  const perQueryFilter =
    explicit ?? (storefronts && mode === 'filter' ? categoriesForStorefront(storefronts) : undefined);

  // The launch-time allowlist bounds the whole corpus; the per-query filter
  // narrows within it. Their intersection is the effective hard filter.
  const filterCategories = intersectCategories(opts.enabledCategories, perQueryFilter);

  // Category weighting: a known storefront (in boost mode) favors its relevant
  // categories and REPLACES the default weights; otherwise use the defaults.
  const boostSet =
    storefronts && mode === 'boost' ? new Set<DocCategory>(categoriesForStorefront(storefronts)) : undefined;

  const ms = getMiniSearch();

  const raw = ms.search(query, {
    filter: filterCategories ? (r) => filterCategories.includes(r.category as DocCategory) : undefined,
    boostDocument: (_id, _term, storedFields) => {
      const category = storedFields?.category as DocCategory | undefined;
      if (boostSet) return category && boostSet.has(category) ? STOREFRONT_BOOST : 1;
      return (category && CATEGORY_WEIGHTS[category]) ?? 1;
    },
  });

  const results: SearchResult[] = [];
  for (const r of raw) {
    const entry = entryById.get(r.id as string);
    if (!entry) continue;
    results.push({entry: publicEntry(entry), score: r.score});
    if (results.length >= limit) break;
  }

  const logger = getLogger();
  logger.debug(
    {query, filterCategories, storefronts, mode, limit, matched: raw.length, returned: results.length},
    'docs searchDocs completed',
  );
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
 * @param enabledCategories - Optional launch-time allowlist that bounds the
 *   entire corpus (see {@link SearchDocsOptions.enabledCategories}). When set,
 *   only entries in these categories are eligible; `category` narrows within it.
 * @returns Array of matching documentation entries
 */
export function listDocs(
  category?: DocCategory | DocCategory[],
  enabledCategories?: readonly DocCategory[],
): DocEntry[] {
  const index = loadSearchIndex();
  const explicit = category ? (Array.isArray(category) ? category : [category]) : undefined;
  const categories = intersectCategories(enabledCategories, explicit);
  const entries = categories
    ? index.entries.filter((e) => e.category && categories.includes(e.category))
    : index.entries;
  return entries.map(publicEntry);
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
  // Prefer an exact id match so precise lookups are deterministic. Honor both
  // the per-query category constraint and the launch-time allowlist so an exact
  // id in a non-requested (or disabled) corpus does not win.
  loadSearchIndex();
  const exact = entryById.get(query);
  if (exact) {
    const perQuery = options?.category
      ? Array.isArray(options.category)
        ? options.category
        : [options.category]
      : undefined;
    const categories = intersectCategories(options?.enabledCategories, perQuery);
    if (!categories || (exact.category && categories.includes(exact.category))) {
      // Resolve content from the stored entry (keeps headings for offline
      // fallback), but return the public entry (headings stripped).
      return {entry: publicEntry(exact), content: await readEntryContent(exact)};
    }
  }

  const results = searchDocs(query, {...options, limit: 1});
  if (results.length === 0) {
    return null;
  }
  const stored = entryById.get(results[0].entry.id) ?? results[0].entry;
  return {entry: publicEntry(stored), content: await readEntryContent(stored)};
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
