/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Workspace discovery for B2C Commerce projects.
 *
 * This module provides utilities for detecting the type of B2C Commerce
 * project in a workspace. Returns ALL matched project types to enable
 * union toolset selection for hybrid projects.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { detectWorkspaceType } from '@salesforce/b2c-tooling-sdk/discovery';
 *
 * const result = await detectWorkspaceType(process.cwd());
 *
 * console.log(`Project types: ${result.projectTypes.join(', ')}`);
 * console.log(`Matched patterns: ${result.matchedPatterns.join(', ')}`);
 * ```
 *
 * ## Project Types
 *
 * The detector recognizes 3 workspace types:
 *
 * - `cartridges` - Any cartridge-based project (detected via .project files)
 * - `pwa-kit-v3` - PWA Kit v3 storefront
 * - `storefront-next` - Storefront Next/Odyssey project
 *
 * ## Toolset Mapping
 *
 * - base (fallback): SCAPI
 * - cartridges: CARTRIDGES + SCAPI
 * - pwa-kit-v3: PWAV3 + MRT + SCAPI
 * - storefront-next: STOREFRONTNEXT + MRT + SCAPI
 *
 * ## Custom Patterns
 *
 * You can extend detection with custom patterns:
 *
 * ```typescript
 * import { WorkspaceTypeDetector, type DetectionPattern } from '@salesforce/b2c-tooling-sdk/discovery';
 *
 * const myPattern: DetectionPattern = {
 *   name: 'my-framework',
 *   projectType: 'cartridges',
 *   detect: async (path) => {
 *     // Custom detection logic
 *     return false;
 *   },
 * };
 *
 * const detector = new WorkspaceTypeDetector('/path/to/project', {
 *   additionalPatterns: [myPattern],
 * });
 *
 * const result = await detector.detect();
 * ```
 *
 * @module discovery
 */

// Main API
export {WorkspaceTypeDetector, detectWorkspaceType} from './detector.js';

// Types
export type {ProjectType, DetectionPattern, DetectionResult, DetectOptions} from './types.js';

// Patterns (for customization)
export {
  DEFAULT_PATTERNS,
  cartridgesPattern,
  pwaKitV3Pattern,
  storefrontNextPattern,
  sfraPattern,
} from './patterns/index.js';

// Utilities (for building custom patterns)
export {readPackageJson, exists, glob, globDirs} from './utils.js';
export type {PackageJson} from './utils.js';
