/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Storefront Next project detection pattern.
 *
 * @module discovery/patterns/storefront-next
 */
import type {DetectionPattern} from '../types.js';
import {readPackageJson} from '../utils.js';

/**
 * Detection pattern for Storefront Next (Odyssey) projects.
 *
 * Detects projects that have Storefront Next SDK dependencies.
 * Matches packages starting with @salesforce/storefront-next
 * (e.g., @salesforce/storefront-next-dev, @salesforce/storefront-next-runtime).
 */
export const storefrontNextPattern: DetectionPattern = {
  name: 'storefront-next',
  projectType: 'storefront-next',
  detect: async (workspacePath) => {
    const pkg = await readPackageJson(workspacePath);
    if (!pkg) return false;

    const deps = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
    return deps.some((dep) => dep.startsWith('@salesforce/storefront-next'));
  },
};
