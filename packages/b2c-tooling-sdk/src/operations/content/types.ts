/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {WaitForJobOptions} from '../jobs/run.js';

/**
 * Node types in a content library tree.
 */
export type LibraryNodeType = 'LIBRARY' | 'PAGE' | 'CONTENT' | 'COMPONENT' | 'STATIC';

/**
 * Options for parsing a library XML string into a Library tree.
 */
export interface LibraryParseOptions {
  /**
   * Dot-notation paths for extracting static asset references from component JSON data.
   * Use `*` as a wildcard to traverse arrays.
   *
   * @default ['image.path']
   *
   * @example
   * ```typescript
   * // Extract image paths from nested JSON
   * { assetQuery: ['image.path', 'banners.*.image.src'] }
   * ```
   */
  assetQuery?: string[];

  /**
   * Include orphan components (components not linked to any page) as root-level children.
   * Useful for cleaning up unused components.
   *
   * @default false
   */
  keepOrphans?: boolean;
}

/**
 * Options controlling tree traversal behavior.
 */
export interface TraverseOptions {
  /** Traverse into hidden (filtered-out) subtrees. @default true */
  traverseHidden?: boolean;
  /** Execute callback for hidden nodes. @default false */
  callbackHidden?: boolean;
}

/**
 * Callback for tree traversal.
 */
export type TraverseCallback = (node: LibraryNodeData) => void;

/**
 * Callback for tree filtering. Return true to keep the node visible.
 */
export type FilterCallback = (node: LibraryNodeData) => boolean;

/**
 * A function that applies terminal color/style to text.
 * Compatible with oclif's `ux.colorize(color, text)` signature.
 */
export type ColorizeFn = (color: string, text: string) => string;

/**
 * Options for generating a tree string visualization.
 */
export interface TreeStringOptions {
  /** Whether to include hidden nodes in the output. @default false */
  traverseHidden?: boolean;
  /** Optional colorize function for terminal styling. When omitted, plain text is returned. */
  colorize?: ColorizeFn;
}

/**
 * Minimal interface for LibraryNode data (avoids circular import).
 */
export interface LibraryNodeData {
  id: string;
  type: LibraryNodeType;
  typeId: string | null;
  data: Record<string, unknown> | null;
  parent: LibraryNodeData | null;
  children: LibraryNodeData[];
  hidden: boolean;
  /** @internal Raw xml2js content object */
  xml: Record<string, unknown> | null;
}

/**
 * Options for fetching a content library from an instance or local file.
 */
export interface FetchContentLibraryOptions {
  /** Use a local library XML file instead of fetching from the instance. */
  libraryFile?: string;
  /** Library is a site-private library (use site export path). */
  isSiteLibrary?: boolean;
  /** Asset query paths for static asset extraction. @default ['image.path'] */
  assetQuery?: string[];
  /** Include orphan components. @default false */
  keepOrphans?: boolean;
  /** Wait options for the export job. */
  waitOptions?: WaitForJobOptions;
}

/**
 * Result of fetching and parsing a content library.
 */
export interface FetchContentLibraryResult {
  /** The parsed library tree (filter/traverse/mutate as needed). */
  library: import('./library.js').Library;
  /** The raw archive data buffer (for further processing or re-import). */
  archiveData?: Buffer;
}

/**
 * Options for the high-level content export operation.
 */
export interface ContentExportOptions {
  /** Library is a site-private library. @default false */
  isSiteLibrary?: boolean;
  /** Asset query paths for static asset extraction. @default ['image.path'] */
  assetQuery?: string[];
  /** Use a local library XML file instead of fetching from instance. */
  libraryFile?: string;
  /** Skip asset downloads. @default false */
  offline?: boolean;
  /** Filter by folder classification IDs. */
  folders?: string[];
  /** Treat page IDs as regular expressions. @default false */
  regex?: boolean;
  /** Include orphan components. @default false */
  keepOrphans?: boolean;
  /** Wait options for the export job. */
  waitOptions?: WaitForJobOptions;
  /** Callback for asset download progress. */
  onAssetProgress?: (asset: string, index: number, total: number, success: boolean) => void;
}

/**
 * Result of a content export operation.
 */
export interface ContentExportResult {
  /** The parsed and filtered library tree. */
  library: import('./library.js').Library;
  /** Output directory path. */
  outputPath: string;
  /** List of successfully downloaded asset paths. */
  downloadedAssets: string[];
  /** List of assets that failed to download. */
  failedAssets: {path: string; error: string}[];
  /** Number of pages in the filtered export. */
  pageCount: number;
  /** Number of content assets in the filtered export. */
  contentCount: number;
  /** Number of components in the filtered export. */
  componentCount: number;
}
