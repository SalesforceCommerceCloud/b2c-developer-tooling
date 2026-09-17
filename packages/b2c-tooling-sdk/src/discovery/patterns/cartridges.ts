/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Cartridge project detection pattern.
 *
 * Detects any project containing cartridges by looking for .project files
 * (Eclipse project marker, primary) or cartridge/<name>.properties files
 * (SFCC structural marker, fallback used by pwa-kit and storefront-next).
 *
 * @module discovery/patterns/cartridges
 */
import type {DetectionPattern} from '../types.js';
import {findCartridges} from '../../operations/code/cartridges.js';

/**
 * Detection pattern for cartridge-based projects.
 *
 * Uses the SDK's findCartridges function to detect any cartridges in the workspace.
 * This covers SFRA, pwa-kit, storefront-next, custom cartridges, and any other
 * cartridge-based development.
 */
export const cartridgesPattern: DetectionPattern = {
  name: 'cartridges',
  projectType: 'cartridges',
  detect: async (workspacePath, context) => {
    // Existence check only — stop at the first cartridge and honor the depth
    // bound so a broad root (e.g. a home directory) is not fully scanned.
    const cartridges = findCartridges(workspacePath, {firstMatchOnly: true, maxDepth: context?.maxDepth});
    return cartridges.length > 0;
  },
};
