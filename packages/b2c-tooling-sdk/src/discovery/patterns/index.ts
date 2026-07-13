/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Detection patterns for workspace discovery.
 *
 * Workspace markers (not mutually exclusive — a workspace can match several):
 * - cartridges: Any project with cartridges
 * - sfra: Storefront Reference Architecture (also matches `cartridges`)
 * - pwa-kit-v3: PWA Kit v3 storefront
 * - storefront-next: Storefront Next (Odyssey)
 *
 * @module discovery/patterns
 */
import type {DetectionPattern} from '../types.js';
import {cartridgesPattern} from './cartridges.js';
import {pwaKitV3Pattern} from './pwa-kit.js';
import {sfraPattern} from './sfra.js';
import {storefrontNextPattern} from './storefront-next.js';

/**
 * Default detection patterns.
 *
 * All patterns are checked — multiple can match for hybrid projects. `sfra` is a
 * refinement of `cartridges`, so a SFRA workspace matches both.
 */
export const DEFAULT_PATTERNS: DetectionPattern[] = [
  pwaKitV3Pattern,
  storefrontNextPattern,
  sfraPattern,
  cartridgesPattern,
];

// Individual pattern exports for customization
export {cartridgesPattern} from './cartridges.js';
export {pwaKitV3Pattern} from './pwa-kit.js';
export {storefrontNextPattern} from './storefront-next.js';
export {sfraPattern} from './sfra.js';
