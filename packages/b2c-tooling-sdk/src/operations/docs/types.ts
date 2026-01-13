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

/**
 * A documentation entry in the search index.
 */
export interface DocEntry {
  /** Unique identifier - the filename without .md extension (e.g., "dw.catalog.ProductMgr") */
  id: string;
  /** The title from the document heading (e.g., "Class ProductMgr") */
  title: string;
  /** The filename (e.g., "dw.catalog.ProductMgr.md") */
  filePath: string;
  /** Optional preview/excerpt from the document */
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
  /** Match score (lower is better in Fuse.js, 0 = perfect match) */
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
