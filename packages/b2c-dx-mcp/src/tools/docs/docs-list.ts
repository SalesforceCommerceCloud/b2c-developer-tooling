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

/** Default page size for a filtered listing. Bounds payload size (large corpora hold 500+ entries). */
const DEFAULT_LIMIT = 100;

interface ListInput {
  category?: DocCategory;
  storefront?: StorefrontParam;
  limit?: number;
  offset?: number;
}

/** A listing row, trimmed to a table-of-contents shape (no summary/keywords/url). */
interface ListEntry {
  id: string;
  title: string;
  category?: DocCategory;
}

/** A page of entries within one filter. */
interface ListPage {
  category?: DocCategory | DocCategory[];
  total: number;
  offset: number;
  count: number;
  entries: ListEntry[];
  truncated?: boolean;
  nextOffset?: number;
}

/** The category directory returned when no filter is supplied (avoids dumping the whole corpus). */
interface CategoryDirectory {
  note: string;
  total: number;
  categories: Array<{category: DocCategory; count: number}>;
}

type ListOutput = CategoryDirectory | ListPage;

/** Projects a full entry to the table-of-contents shape. */
function toListEntry(entry: DocEntry): ListEntry {
  return {id: entry.id, title: entry.title, category: entry.category};
}

export function createDocsListTool(
  loadServices: () => Promise<Services> | Services,
  detectedStorefronts: readonly ProjectType[] = [],
): McpTool {
  return createToolAdapter<ListInput, ListOutput>(
    {
      name: 'docs_list',
      description:
        'Enumerate B2C Commerce documentation entries (id + title + category only) for a category or storefront. ' +
        'Prefer docs_search for questions — this tool is for browsing a known category. Without a category or ' +
        'storefront it returns just a category directory (counts), not the full corpus. Results are a table of ' +
        'contents; paginated via limit/offset. Use docs_read for content.' +
        detectedStorefrontNote(detectedStorefronts),
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        category: z.enum(CATEGORIES).optional().describe('Restrict the listing to one documentation category.'),
        storefront: z
          .enum(STOREFRONT_VALUES)
          .optional()
          .describe(
            'Limit to a storefront\'s relevant categories. "current" uses the auto-detected storefront; ' +
              'or name a type. Omit for the category directory.',
          ),
        limit: z.number().int().positive().optional().describe(`Max entries per page. Defaults to ${DEFAULT_LIMIT}.`),
        offset: z.number().int().nonnegative().optional().describe('Number of entries to skip (for pagination).'),
      },
      async execute(args) {
        // Explicit category wins; otherwise a storefront narrows to its relevant categories.
        const storefront = resolveStorefront(args.storefront, detectedStorefronts);
        const filter: DocCategory | DocCategory[] | undefined =
          args.category ??
          (args.storefront && args.storefront !== 'all' && storefront
            ? categoriesForStorefront(storefront)
            : undefined);

        // No filter at all → return a compact directory of categories + counts,
        // never the whole corpus (which would blow the inline payload budget).
        if (!filter) {
          const counts = new Map<DocCategory, number>();
          for (const e of listDocs()) {
            if (e.category) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
          }
          const categories = [...counts.entries()]
            .map(([category, count]) => ({category, count}))
            .sort((a, b) => b.count - a.count);
          const total = categories.reduce((sum, c) => sum + c.count, 0);
          return {
            note: 'Pass a category (or storefront) to list its entries, or use docs_search for a query.',
            total,
            categories,
          };
        }

        const all = listDocs(filter);
        const offset = args.offset ?? 0;
        const limit = args.limit ?? DEFAULT_LIMIT;
        const page = all.slice(offset, offset + limit).map((e) => toListEntry(e));
        const end = offset + page.length;
        const truncated = end < all.length;
        return {
          category: filter,
          total: all.length,
          offset,
          count: page.length,
          entries: page,
          ...(truncated && {truncated: true, nextOffset: end}),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
