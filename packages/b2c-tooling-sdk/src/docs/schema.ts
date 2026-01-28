/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Fuse from 'fuse.js';
import {XSD_DATA_DIR, type SchemaEntry, type SchemaIndex, type SchemaSearchResult} from './types.js';

// Lazy-loaded index and Fuse instance
let schemaIndex: SchemaIndex | null = null;
let fuseInstance: Fuse<SchemaEntry> | null = null;

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
  return schemaIndex;
}

/**
 * Get or create the Fuse.js search instance.
 */
function getFuse(): Fuse<SchemaEntry> {
  if (fuseInstance) {
    return fuseInstance;
  }

  const index = loadIndex();
  fuseInstance = new Fuse(index.entries, {
    keys: [{name: 'id', weight: 1}],
    includeScore: true,
    threshold: 0.4,
  });
  return fuseInstance;
}

/**
 * List all available schema entries.
 */
export function listSchemas(): SchemaEntry[] {
  const index = loadIndex();
  return index.entries;
}

/**
 * Read a schema by its exact ID.
 */
export function readSchema(id: string): {entry: SchemaEntry; content: string} | null {
  const index = loadIndex();
  const entry = index.entries.find((e) => e.id === id);

  if (!entry) {
    return null;
  }

  const filePath = path.join(XSD_DATA_DIR, entry.filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  return {entry, content};
}

/**
 * Find a schema by fuzzy query and return its content.
 * Returns the best match or null if no match found.
 */
export function readSchemaByQuery(query: string): {entry: SchemaEntry; content: string} | null {
  // First try exact match
  const exactMatch = readSchema(query);
  if (exactMatch) {
    return exactMatch;
  }

  // Try fuzzy search
  const fuse = getFuse();
  const results = fuse.search(query, {limit: 1});

  if (results.length === 0) {
    return null;
  }

  const bestMatch = results[0];
  const filePath = path.join(XSD_DATA_DIR, bestMatch.item.filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  return {entry: bestMatch.item, content};
}

/**
 * Search schemas by fuzzy query.
 */
export function searchSchemas(query: string, limit = 20): SchemaSearchResult[] {
  const fuse = getFuse();
  const results = fuse.search(query, {limit});

  return results.map((result) => ({
    entry: result.item,
    score: result.score ?? 0,
  }));
}
