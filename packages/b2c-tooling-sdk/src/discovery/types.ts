/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Types for workspace discovery.
 *
 * @module discovery/types
 */

/**
 * A workspace marker: something detected about a B2C Commerce project. A single
 * workspace can carry several — they are not mutually exclusive. In particular
 * `sfra` is a refinement of `cartridges` (a SFRA project also has cartridges),
 * so an SFRA workspace detects as both.
 *
 * - cartridges: any project with cartridges (detected via .project files)
 * - sfra: a Storefront Reference Architecture project (has `app_storefront_base`)
 * - pwa-kit-v3: PWA Kit v3 storefront
 * - storefront-next: Storefront Next (Odyssey)
 */
export type ProjectType =
  | 'cartridges' // Any cartridge-based project (custom APIs, integrations, SFRA, etc.)
  | 'sfra' // Storefront Reference Architecture (implies cartridges)
  | 'pwa-kit-v3' // PWA Kit v3 storefront
  | 'storefront-next'; // Storefront Next (Odyssey)

/**
 * All workspace markers as a runtime list (single source of truth for callers
 * that need to validate user input, e.g. a CLI flag or MCP enum). Kept in sync
 * with {@link ProjectType} by the `satisfies` check below.
 */
export const PROJECT_TYPES = [
  'cartridges',
  'sfra',
  'pwa-kit-v3',
  'storefront-next',
] as const satisfies readonly ProjectType[];

/**
 * Context passed to a detection pattern's `detect` function.
 */
export interface DetectionContext {
  /**
   * Maximum directory depth (in path segments, relative to the workspace root)
   * that filesystem-scanning patterns should recurse. Undefined means unbounded.
   * Bounding this protects against costly walks when the workspace root is broad
   * (e.g. an MCP server launched from a home directory).
   */
  maxDepth?: number;
}

/**
 * Detection pattern definition.
 */
export interface DetectionPattern {
  /** Unique pattern identifier */
  name: string;
  /** Project type this pattern detects */
  projectType: ProjectType;
  /** Detection function */
  detect: (workspacePath: string, context?: DetectionContext) => Promise<boolean>;
}

/**
 * Result of workspace detection.
 */
export interface DetectionResult {
  /** All detected project types (from matched patterns) */
  projectTypes: ProjectType[];
  /** All patterns that matched */
  matchedPatterns: string[];
  /** Whether auto-discovery was performed */
  autoDiscovered: boolean;
}

/**
 * Options for workspace detection.
 */
export interface DetectOptions {
  /** Custom patterns to use (replaces defaults) */
  patterns?: DetectionPattern[];
  /** Additional patterns to include */
  additionalPatterns?: DetectionPattern[];
  /** Patterns to exclude by name */
  excludePatterns?: string[];
  /**
   * Maximum directory depth (in path segments, relative to the workspace root)
   * that filesystem-scanning patterns recurse. Undefined means unbounded.
   * Passed to each pattern via {@link DetectionContext}. Set this when detecting
   * from a potentially broad root to keep the scan bounded.
   */
  maxDepth?: number;
}
