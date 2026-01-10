/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Documentation operations for B2C Commerce Script API.
 *
 * Provides functions for downloading documentation from B2C instances
 * and searching bundled documentation locally.
 *
 * ## Download Documentation
 *
 * Use {@link downloadDocs} to download documentation from a B2C instance:
 *
 * ```typescript
 * import { downloadDocs } from '@salesforce/b2c-tooling-sdk/operations/docs';
 * import { B2CInstance } from '@salesforce/b2c-tooling-sdk';
 *
 * const instance = B2CInstance.fromEnvironment();
 * const result = await downloadDocs(instance, { outputDir: './docs' });
 * console.log(`Downloaded ${result.fileCount} files`);
 * ```
 *
 * ## Search Bundled Docs
 *
 * Use {@link searchDocs} and {@link readDocByQuery} to search and read bundled documentation:
 *
 * ```typescript
 * import { searchDocs, readDocByQuery } from '@salesforce/b2c-tooling-sdk/operations/docs';
 *
 * // Search for documentation
 * const results = searchDocs('ProductMgr');
 * results.forEach(r => console.log(r.entry.id, r.score));
 *
 * // Read a specific doc by fuzzy query
 * const doc = readDocByQuery('dw.catalog.ProductMgr');
 * if (doc) {
 *   console.log(doc.content);
 * }
 * ```
 *
 * @module operations/docs
 */

// Types
export type {DocEntry, SearchIndex, SearchResult, SchemaEntry, SchemaIndex, SchemaSearchResult} from './types.js';

// Search operations
export {searchDocs, readDoc, readDocByQuery, listDocs, loadSearchIndex} from './search.js';

// Schema operations
export {listSchemas, readSchema, readSchemaByQuery, searchSchemas} from './schema.js';

// Download operation
export {downloadDocs} from './download.js';
export type {DownloadDocsOptions, DownloadDocsResult} from './download.js';
