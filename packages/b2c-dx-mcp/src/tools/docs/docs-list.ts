/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {listDocs, categoriesForStorefront, type DocCategory, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {STOREFRONT_VALUES, detectedStorefrontNote, resolveStorefront, type StorefrontParam} from './storefront.js';

/** Documentation categories a listing can be restricted to. */
const CATEGORIES = [
  'script-api',
  'job-step',
  'commerce-api',
  'pwa-kit-managed-runtime',
  'sfnext',
  'sfra',
  'b2c-commerce',
  'tooling',
] as const;

interface ListInput {
  category?: DocCategory;
  storefront?: StorefrontParam;
}

interface ListOutput {
  count: number;
  entries: DocEntry[];
}

export function createDocsListTool(
  loadServices: () => Promise<Services> | Services,
  detectedStorefronts: readonly ProjectType[] = [],
): McpTool {
  return createToolAdapter<ListInput, ListOutput>(
    {
      name: 'docs_list',
      description:
        'List available B2C Commerce documentation entries (id + title + category) across all corpora ' +
        '(Script API, job steps, Developer Center guides, tooling guides). Output is large; pass a ' +
        'category, or storefront="current" to limit to the detected storefront\'s relevant docs, or prefer ' +
        'docs_search for targeted lookups.' +
        detectedStorefrontNote(detectedStorefronts),
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        category: z.enum(CATEGORIES).optional().describe('Restrict the listing to one documentation category.'),
        storefront: z
          .enum(STOREFRONT_VALUES)
          .optional()
          .describe(
            'Limit to a storefront\'s relevant categories. "current" uses the auto-detected storefront; ' +
              '"all" (default) lists everything; or name a type.',
          ),
      },
      async execute(args) {
        // Explicit category wins; otherwise a storefront narrows to its relevant categories.
        const storefront = resolveStorefront(args.storefront, detectedStorefronts);
        const filter: DocCategory | DocCategory[] | undefined =
          args.category ??
          (args.storefront && args.storefront !== 'all' && storefront
            ? categoriesForStorefront(storefront)
            : undefined);
        const entries = listDocs(filter);
        return {count: entries.length, entries};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
