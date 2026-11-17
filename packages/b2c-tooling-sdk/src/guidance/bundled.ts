/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import {createRequire} from 'node:module';
import {GuidanceCatalog} from './catalog.js';

const require = createRequire(import.meta.url);

/**
 * Directory of the skill bundle shipped with the SDK (`index.json` plus Markdown),
 * built from the repository's agent plugins and MCP skills.
 */
export const BUNDLED_GUIDANCE_DIR = path.join(
  path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json')),
  'data/guidance',
);

/** Collections installable as agent plugins, as served by `b2c docs skill`. */
export const PLUGIN_GUIDANCE_COLLECTIONS: readonly string[] = Object.freeze([
  'b2c-cli',
  'b2c',
  'b2c-ops',
  'storefront-next',
]);

export interface BundledGuidanceOptions {
  /** Include collections that are not generally available. Defaults to `false`. */
  allowNonGa?: boolean;
  /** Expose only these collection IDs. Defaults to every collection. */
  collections?: readonly string[];
}

const catalogs = new Map<string, GuidanceCatalog>();

/**
 * The skills bundled with the SDK, as a {@link GuidanceCatalog}: the agent plugin
 * collections plus the MCP workflow skills (`mcp`) and `cap-dev`. Catalogs are
 * cached per option set. Throws a `GuidanceError` when the bundle is missing,
 * for example in an unbuilt checkout.
 *
 * @example
 * ```typescript
 * import {loadBundledGuidanceCatalog} from '@salesforce/b2c-tooling-sdk/guidance';
 *
 * const catalog = loadBundledGuidanceCatalog();
 * const page = catalog.read({query: 'deploy cartridges'});
 * const skill = catalog.readResource('skill://mcp/b2c-mcp-scapi/SKILL.md');
 * ```
 */
export function loadBundledGuidanceCatalog(options: BundledGuidanceOptions = {}): GuidanceCatalog {
  const key = JSON.stringify([Boolean(options.allowNonGa), options.collections ?? null]);
  let catalog = catalogs.get(key);
  if (!catalog) {
    catalog = new GuidanceCatalog(BUNDLED_GUIDANCE_DIR, options);
    catalogs.set(key, catalog);
  }
  return catalog;
}
