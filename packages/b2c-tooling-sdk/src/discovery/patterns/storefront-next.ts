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
import path from 'node:path';
import type {DetectionPattern} from '../types.js';
import type {PackageJson} from '../utils.js';
import {readPackageJson, globDirs} from '../utils.js';

/**
 * Returns true if this package.json (deps or name) indicates a Storefront Next project.
 * Relies on @salesforce/storefront-next* dependency or package name starting with "storefront-next" only.
 */
function packageIndicatesStorefrontNext(pkg: PackageJson): boolean {
  const deps = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  if (deps.some((dep) => dep.startsWith('@salesforce/storefront-next'))) {
    return true;
  }
  const name = pkg.name;
  if (typeof name !== 'string' || !name.trim()) return false;
  const nameWithoutScope = name.includes('/') ? name.split('/').pop()?.trim() : name.trim();
  if (!nameWithoutScope) return false;
  return nameWithoutScope.startsWith('storefront-next');
}

/**
 * Detection pattern for Storefront Next (Odyssey) projects.
 *
 * Detects (1) storefront-next-template and similar: root package.json has
 * @salesforce/storefront-next* dependency or name starting with "storefront-next".
 * (2) storefront-next monorepo: root has no signal but a workspace package has
 * the dependency or name (e.g. https://github.com/SalesforceCommerceCloud/storefront-next).
 */
export const storefrontNextPattern: DetectionPattern = {
  name: 'storefront-next',
  projectType: 'storefront-next',
  detect: async (workspacePath) => {
    const rootPkg = await readPackageJson(workspacePath);
    if (!rootPkg) return false;

    if (packageIndicatesStorefrontNext(rootPkg)) return true;

    const workspaces = rootPkg.workspaces;
    if (!workspaces) return false;

    const patterns = Array.isArray(workspaces) ? workspaces : [workspaces];
    for (const pattern of patterns) {
      if (typeof pattern !== 'string' || !pattern.trim()) continue;
      const dirs = await globDirs(pattern, {cwd: workspacePath});
      for (const dir of dirs) {
        const pkgPath = path.join(workspacePath, dir);
        const pkg = await readPackageJson(pkgPath);
        if (pkg && packageIndicatesStorefrontNext(pkg)) return true;
      }
    }
    return false;
  },
};
