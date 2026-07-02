/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {DocCategory} from '@salesforce/b2c-tooling-sdk/docs';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createDocsListTool} from './docs-list.js';
import {createDocsReadTool} from './docs-read.js';
import {createDocsSchemaListTool} from './docs-schema-list.js';
import {createDocsSchemaReadTool} from './docs-schema-read.js';
import {createDocsSchemaSearchTool} from './docs-schema-search.js';
import {createDocsSearchTool} from './docs-search.js';

/**
 * Server-startup context baked into the documentation tools.
 */
export interface DocsToolContext {
  /**
   * Workspace storefront type(s) detected at startup. Baked into the search/list
   * tool descriptions and used as the default storefront context so results
   * favor the current storefront.
   */
  detectedStorefronts?: readonly ProjectType[];
  /**
   * A launch-time allowlist of documentation categories (from `--docs-topics`).
   * When set, the docs tools expose ONLY these categories — a hard boundary the
   * per-call `category`/`storefront` narrowing operates within.
   */
  enabledCategories?: readonly DocCategory[];
}

/**
 * Builds the documentation tools with the given server-startup context.
 */
export function createDocsTools(
  loadServices: () => Promise<Services> | Services,
  context: DocsToolContext = {},
): McpTool[] {
  const {detectedStorefronts = [], enabledCategories} = context;
  return [
    createDocsSearchTool(loadServices, detectedStorefronts, enabledCategories),
    createDocsReadTool(loadServices, enabledCategories),
    createDocsListTool(loadServices, detectedStorefronts, enabledCategories),
    createDocsSchemaSearchTool(loadServices),
    createDocsSchemaReadTool(loadServices),
    createDocsSchemaListTool(loadServices),
  ];
}
