/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Cartridge project detection pattern.
 *
 * Detects any project containing cartridges by looking for .project files
 * (Eclipse project markers used in SFCC development).
 *
 * @module discovery/patterns/cartridges
 */
import type {DetectionPattern} from '../types.js';
import {findCartridges} from '../../operations/code/cartridges.js';

/**
 * Detection pattern for cartridge-based projects.
 *
 * Uses the SDK's findCartridges function to detect any cartridges in the workspace.
 * This covers SFRA, custom APIs, and any other cartridge-based development.
 */
export const cartridgesPattern: DetectionPattern = {
  name: 'cartridges',
  projectType: 'cartridges',
  detect: async (workspacePath) => {
    const cartridges = findCartridges(workspacePath);
    return cartridges.length > 0;
  },
};
