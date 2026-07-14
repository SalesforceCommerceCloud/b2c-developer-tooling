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
import type {PackageJson} from '../utils.js';
import {readPackageJson} from '../utils.js';

/**
 * Returns true if this package.json indicates a PWA Kit v3 project.
 *
 * Two flavors:
 * - Template copy: has an `@salesforce/pwa-kit-*` package
 * - Extensible: has `@salesforce/retail-react-app` or the `ccExtensibility` field
 *
 * Exported so other patterns (e.g. storefront-next) can treat a PWA Kit signal
 * as a disambiguator without duplicating this logic.
 */
export function packageIndicatesPwaKit(pkg: PackageJson): boolean {
  // ccExtensibility field is the extensible-flavor marker.
  if (pkg.ccExtensibility) return true;

  const deps = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  return deps.some((dep) => dep.startsWith('@salesforce/pwa-kit') || dep === '@salesforce/retail-react-app');
}

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
    return packageIndicatesPwaKit(pkg);
  },
};
