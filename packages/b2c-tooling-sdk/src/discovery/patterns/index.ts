/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Detection patterns for workspace discovery.
 *
 * @module discovery/patterns
 */
import type {DetectionPattern} from '../types.js';
import {pwaKitV3Pattern} from './pwa-kit.js';
import {storefrontNextPattern} from './storefront-next.js';
import {sfraPattern} from './sfra.js';
import {customApiPattern} from './custom-api.js';
import {dwJsonPattern} from './base.js';

/**
 * Default detection patterns in priority order.
 *
 * Patterns are sorted by priority when detection runs, but this
 * array provides a logical grouping:
 * 1. Framework-specific patterns (PWA Kit v3, Storefront Next, SFRA)
 * 2. Project-type patterns (Custom API)
 * 3. Fallback patterns (dw.json)
 */
export const DEFAULT_PATTERNS: DetectionPattern[] = [
  pwaKitV3Pattern,
  storefrontNextPattern,
  sfraPattern,
  customApiPattern,
  dwJsonPattern,
];

// Individual pattern exports for customization
export {pwaKitV3Pattern} from './pwa-kit.js';
export {storefrontNextPattern} from './storefront-next.js';
export {sfraPattern} from './sfra.js';
export {customApiPattern} from './custom-api.js';
export {dwJsonPattern} from './base.js';
