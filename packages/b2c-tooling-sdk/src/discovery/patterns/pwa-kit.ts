/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * PWA Kit v3 project detection pattern.
 *
 * @module discovery/patterns/pwa-kit-v3
 */
import type {DetectionPattern} from '../types.js';
import {readPackageJson} from '../utils.js';

/**
 * Detection pattern for PWA Kit v3 storefronts.
 *
 * Detects projects that have PWA Kit v3 SDK dependencies in package.json.
 * Supports two flavors:
 * - Template copy: Has @salesforce/pwa-kit-* packages
 * - Extensible: Has @salesforce/retail-react-app or ccExtensibility field
 */
export const pwaKitV3Pattern: DetectionPattern = {
  name: 'pwa-kit-v3',
  projectType: 'pwa-kit-v3',
  detect: async (workspacePath) => {
    const pkg = await readPackageJson(workspacePath);
    if (!pkg) return false;

    // Check for ccExtensibility field (extensible flavor marker)
    if (pkg.ccExtensibility) return true;

    const deps = Object.keys({...pkg.dependencies, ...pkg.devDependencies});

    // Template copy flavor: @salesforce/pwa-kit-* packages
    // Extensible flavor: @salesforce/retail-react-app package
    return deps.some((dep) => dep.startsWith('@salesforce/pwa-kit') || dep === '@salesforce/retail-react-app');
  },
};
