/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import {createRequire} from 'node:module';

// Resolve the data directories from the package root
// Uses createRequire to find the package.json location, which is robust
// regardless of where this module is located in the build output
const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'));

export const SCRIPT_API_DATA_DIR = path.join(packageRoot, 'data/script-api');
export const XSD_DATA_DIR = path.join(packageRoot, 'data/xsd');
export const JOB_STEPS_DATA_DIR = path.join(packageRoot, 'data/job-steps');
export const GUIDES_DATA_DIR = path.join(packageRoot, 'data/guides');
export const TOOLING_DATA_DIR = path.join(packageRoot, 'data/tooling');
export const HELP_DATA_DIR = path.join(packageRoot, 'data/help');

/**
 * The corpus a documentation entry belongs to. Used to tag and filter results
 * so agents can narrow a search to a documentation set (e.g., only Storefront
 * Next guides, or only the Script API reference).
 *
 * - `script-api` — B2C Commerce Script API class/module reference
 * - `job-step` — standard (system) job step reference
 * - `commerce-api` / `pwa-kit-managed-runtime` / `sfnext` / `sfra` / `b2c-commerce`
 *   — Developer Center prose guides, one category per Developer Center project
 * - `tooling` — this project's own conceptual guides (CLI/MCP/SDK usage)
 * - `help-admin` — Salesforce Help (help.salesforce.com) administration/ops content:
 *   import/export, jobs, replication, security, Account Manager, permissions, logs
 * - `help-merchant` — Salesforce Help merchandising content: catalogs, products,
 *   promotions, search, content, analytics, SEO
 */
export type DocCategory =
  | 'script-api'
  | 'job-step'
  | 'commerce-api'
  | 'pwa-kit-managed-runtime'
  | 'sfnext'
  | 'sfra'
  | 'b2c-commerce'
  | 'tooling'
  | 'help-admin'
  | 'help-merchant';

/**
 * A documentation entry in the search index.
 *
 * Entries span multiple corpora (Script API reference, job steps, Developer
 * Center guides, and this project's own docs). Reference entries are bundled
 * on disk and read via {@link DocEntry.filePath}; guide entries are indexed
 * locally but their full content is fetched on demand from {@link DocEntry.url}.
 */
export interface DocEntry {
  /**
   * Unique identifier. For bundled reference this is the filename without its
   * extension (e.g., "dw.catalog.ProductMgr"); for guides it is namespaced by
   * category to avoid cross-corpus collisions (e.g., "sfnext/sfnext-get-started").
   */
  id: string;
  /** The title from the document's first heading (e.g., "Class ProductMgr"). */
  title: string;
  /** The corpus/category this entry belongs to. */
  category?: DocCategory;
  /**
   * Path of the bundled markdown file relative to its corpus data directory.
   * Present for entries whose content ships in the package; absent for entries
   * whose content is fetched online (see {@link DocEntry.sourceUrl}).
   */
  filePath?: string;
  /**
   * Canonical human-facing published URL (the rendered `.html` page, e.g. on
   * developer.salesforce.com). This is the durable link to cite/open in a
   * browser. Present for every corpus that has a public page (guides, Script
   * API reference, tooling); absent for corpora with no public page (job steps).
   */
  url?: string;
  /**
   * The raw-markdown (`.md`) URL for the same document — the machine-readable
   * source. For online-only entries (guides) this is what {@link readEntryContent}
   * fetches at read time. Bundled corpora (Script API, tooling) also carry it so
   * callers can retrieve the raw source on request even though content ships in
   * the package. Absent for corpora with no public page (job steps).
   */
  sourceUrl?: string;
  /** Section headings joined into a single searchable string (indexed, not for display). */
  headings?: string;
  /** One-line summary describing what task/topic the doc helps with (agent triage). */
  summary?: string;
  /** Search keywords/synonyms an agent or developer might use to find this doc. */
  keywords?: string[];
  /**
   * IDs of directly related documentation entries. Salesforce Help landing
   * articles use this for linked child topics, while Developer Center guides
   * use it for immediate parent and child pages from the published TOC. Callers
   * can pass any id directly to `docs read` / `docs_read`.
   */
  relatedEntries?: string[];
  /** Optional preview/excerpt from the document. */
  preview?: string;
}

/**
 * The search index structure stored in index.json.
 */
export interface SearchIndex {
  /** Version of the index format */
  version: string;
  /** Timestamp when the index was generated */
  generatedAt: string;
  /** Array of documentation entries */
  entries: DocEntry[];
}

/**
 * A search result with relevance score.
 */
export interface SearchResult {
  /** The matching documentation entry */
  entry: DocEntry;
  /** Relevance score (higher is better; scale is engine-relative, not normalized). */
  score: number;
}

/**
 * An XSD schema entry in the index.
 */
export interface SchemaEntry {
  /** Unique identifier - the filename without .xsd extension (e.g., "catalog") */
  id: string;
  /** The filename (e.g., "catalog.xsd") */
  filePath: string;
}

/**
 * The schema index structure stored in index.json.
 */
export interface SchemaIndex {
  /** Version of the index format */
  version: string;
  /** Timestamp when the index was generated */
  generatedAt: string;
  /** Array of schema entries */
  entries: SchemaEntry[];
}

/**
 * A schema search result with relevance score.
 */
export interface SchemaSearchResult {
  /** The matching schema entry */
  entry: SchemaEntry;
  /** Match score (lower is better in Fuse.js, 0 = perfect match) */
  score: number;
}
