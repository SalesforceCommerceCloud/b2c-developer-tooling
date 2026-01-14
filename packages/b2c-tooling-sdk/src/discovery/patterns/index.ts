/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Detection patterns for workspace discovery.
 *
 * Simplified to 3 workspace types:
 * - cartridges: Any project with cartridges
 * - pwa-kit-v3: PWA Kit v3 storefront
 * - storefront-next: Storefront Next (Odyssey)
 *
 * @module discovery/patterns
 */
import type {DetectionPattern} from '../types.js';
import {cartridgesPattern} from './cartridges.js';
import {pwaKitV3Pattern} from './pwa-kit.js';
import {storefrontNextPattern} from './storefront-next.js';

/**
 * Default detection patterns.
 *
 * All patterns are checked - multiple can match for hybrid projects.
 */
export const DEFAULT_PATTERNS: DetectionPattern[] = [pwaKitV3Pattern, storefrontNextPattern, cartridgesPattern];

// Individual pattern exports for customization
export {cartridgesPattern} from './cartridges.js';
export {pwaKitV3Pattern} from './pwa-kit.js';
export {storefrontNextPattern} from './storefront-next.js';

// Additional patterns (not in DEFAULT_PATTERNS, available for custom use)
export {sfraPattern} from './sfra.js';
