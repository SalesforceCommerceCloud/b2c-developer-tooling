/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SFRA (Storefront Reference Architecture) detection pattern.
 *
 * NOTE: This pattern is NOT included in DEFAULT_PATTERNS.
 * The simpler `cartridgesPattern` is used instead, which detects any cartridge project.
 * This pattern is exported for custom detection scenarios where SFRA-specific
 * detection is needed.
 *
 * @module discovery/patterns/sfra
 */
import type {DetectionPattern} from '../types.js';
import {findCartridges} from '../../operations/code/cartridges.js';
import {readPackageJson} from '../utils.js';

/**
 * Detection pattern for SFRA projects.
 *
 * Detects SFRA workspaces by checking for:
 * 1. A cartridge named `app_storefront_base` - the core SFRA cartridge that serves as the
 *    foundation for SFRA-based storefronts. Per Salesforce documentation, this cartridge
 *    is essential and should not be renamed. (Primary detection method)
 * 2. A package.json with `paths.base` containing `app_storefront_base` - used in multi-repo
 *    setups with sgmf-scripts where the SFRA base cartridge is external to the project.
 *    (Secondary heuristic, less common)
 *
 * @see https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-customizing-sfra.html
 *
 * @example
 * ```
 * // Use in custom detection
 * import { sfraPattern } from '@salesforce/b2c-tooling-sdk/discovery';
 *
 * const customPatterns = [sfraPattern, ...otherPatterns];
 * const result = await detectWorkspaceType(workspacePath, { patterns: customPatterns });
 * ```
 */
export const sfraPattern: DetectionPattern = {
  name: 'sfra',
  projectType: 'cartridges', // Maps to cartridges project type
  detect: async (workspacePath) => {
    // Primary check: Look for app_storefront_base cartridge (the core SFRA cartridge)
    // This is the definitive indicator per Salesforce documentation
    const cartridges = findCartridges(workspacePath);
    const hasSfraCartridge = cartridges.some((cartridge) => cartridge.name === 'app_storefront_base');
    if (hasSfraCartridge) {
      return true;
    }

    // Secondary check: Look for package.json with paths.base pointing to app_storefront_base
    // Used in multi-repo setups with sgmf-scripts where SFRA base is in a separate repo
    const packageJson = await readPackageJson(workspacePath);
    if (packageJson) {
      const paths = packageJson.paths as Record<string, string> | undefined;
      if (paths?.base && typeof paths.base === 'string') {
        if (paths.base.includes('app_storefront_base')) {
          return true;
        }
      }
    }

    return false;
  },
};
