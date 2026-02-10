/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Content library operations for B2C Commerce.
 *
 * This module provides functions for exporting and manipulating
 * Page Designer content libraries including pages, components, and assets.
 *
 * ## Core Classes
 *
 * - {@link Library} - Parse and manipulate content library trees
 * - {@link LibraryNode} - Individual nodes in the library tree
 *
 * ## Operations
 *
 * - {@link fetchContentLibrary} - Fetch and parse a content library
 * - {@link exportContent} - Export filtered pages with assets to disk
 *
 * ## Utilities
 *
 * - {@link extractAssetPaths} - Extract asset paths from component JSON data
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   Library,
 *   fetchContentLibrary,
 *   exportContent,
 * } from '@salesforce/b2c-tooling-sdk/operations/content';
 *
 * // Fetch and filter a library
 * const { library } = await fetchContentLibrary(instance, 'SharedLibrary');
 * library.filter(n => n.id === 'homepage');
 *
 * // Or use the high-level export
 * const result = await exportContent(instance, ['homepage'], 'SharedLibrary', './export');
 * ```
 *
 * @module operations/content
 */

export {Library, LibraryNode} from './library.js';

export {extractAssetPaths} from './asset-query.js';

export {fetchContentLibrary, exportContent} from './export.js';

export type {
  ColorizeFn,
  ContentExportOptions,
  ContentExportResult,
  FetchContentLibraryOptions,
  FetchContentLibraryResult,
  FilterCallback,
  LibraryNodeType,
  LibraryParseOptions,
  TraverseCallback,
  TraverseOptions,
  TreeStringOptions,
} from './types.js';
