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
 * Identifies the type of B2C Commerce project.
 */
export type ProjectType =
  | 'pwa-kit-v3' // PWA Kit v3 storefront (template copy or extensible flavor)
  | 'storefront-next' // Storefront Next (Odyssey)
  | 'sfra' // SFRA/cartridge-based storefront
  | 'custom-api' // Custom SCAPI project
  | 'headless'; // Generic headless (uses SCAPI/dw.json but no specific framework)

/**
 * Detection pattern definition.
 */
export interface DetectionPattern {
  /** Unique pattern identifier */
  name: string;
  /** Project type this pattern detects */
  projectType: ProjectType;
  /** Detection function */
  detect: (workspacePath: string) => Promise<boolean>;
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
}
