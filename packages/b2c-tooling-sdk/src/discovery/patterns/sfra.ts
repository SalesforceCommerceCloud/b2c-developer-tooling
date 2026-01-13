/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SFRA/cartridge project detection pattern.
 *
 * @module discovery/patterns/sfra
 */
import type {DetectionPattern} from '../types.js';
import {glob} from '../utils.js';

/**
 * Detection pattern for SFRA/cartridge-based storefronts.
 *
 * Detects projects that have the standard cartridge folder structure
 * with controllers and/or templates. Searches recursively so cartridges
 * can be at the workspace root or in subdirectories (e.g., monorepos).
 */
export const sfraPattern: DetectionPattern = {
  name: 'sfra-cartridge',
  projectType: 'sfra',
  detect: async (workspacePath) => {
    // Look for SFRA-style structure (controllers or templates)
    // Searches recursively - cartridges can be at root or nested in subdirectories
    const hasControllers = await glob('**/cartridge/controllers/**/*.js', {cwd: workspacePath});
    if (hasControllers.length > 0) return true;

    const hasTemplates = await glob('**/cartridge/templates/**/*.isml', {cwd: workspacePath});
    return hasTemplates.length > 0;
  },
};
