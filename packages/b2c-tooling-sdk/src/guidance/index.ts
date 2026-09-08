/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Offline workflow guidance catalogs, bounded reads, and ranked discovery.
 * Native skill installation remains in the separate skills module.
 * @module guidance
 */
export * from './types.js';
export {GuidanceCatalog, guidanceUri, GUIDANCE_INDEX_URI} from './catalog.js';
export {guidanceHeadings, type GuidanceHeading} from './markdown.js';
