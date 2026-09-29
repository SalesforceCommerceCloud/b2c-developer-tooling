/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Developer Center sources indexed into the guides corpus (`data/guides/index.json`),
 * shared by `generate-guides-index.ts` and `enrich-docs.ts`.
 *
 * Each source maps a content directory in the Developer Center repo (relative to
 * GUIDES_CONTENT_DIR, `/`-separated) to a docs category and the published URL path.
 * Nested directories are flattened: `<dir>/**\/<basename>.md` is published at
 * `https://developer.salesforce.com/docs/commerce/<urlPath>/<basename>.html` (and `.md`).
 *
 * `toc` names the table-of-contents YAML that decides which pages are published.
 * Sources without one use the guide TOCs (every `.yml` under a `guides/` directory).
 */
export interface GuidesSource {
  category: string;
  dir: string;
  urlPath: string;
  toc?: string;
}

export const GUIDES_SOURCES: readonly GuidesSource[] = [
  {category: 'commerce-api', dir: 'commerce-api/guides', urlPath: 'commerce-api/guide'},
  {
    category: 'pwa-kit-managed-runtime',
    dir: 'pwa-kit-managed-runtime/guides',
    urlPath: 'pwa-kit-managed-runtime/guide',
  },
  {category: 'sfnext', dir: 'sfnext/guides', urlPath: 'sfnext/guide'},
  {category: 'sfra', dir: 'sfra/guides', urlPath: 'sfra/guide'},
  {category: 'b2c-commerce', dir: 'b2c-commerce/guides', urlPath: 'b2c-commerce/guide'},
  // OCAPI prose reference (usage, hooks, settings, best practices); the API specs
  // alongside these files are JSON and are not indexed.
  {
    category: 'ocapi',
    dir: 'b2c-commerce/references/ocapi/current',
    urlPath: 'b2c-commerce/references/b2c-commerce-ocapi',
    toc: 'b2c-commerce/references/ocapi-toc.yml',
  },
];
