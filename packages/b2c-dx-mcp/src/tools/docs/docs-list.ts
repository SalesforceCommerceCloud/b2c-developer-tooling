/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {listDocs, categoriesForWorkspace, type DocCategory, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {categoryEnumValues, enabledCategoriesNote} from './topics.js';
import {WORKSPACE_VALUES, detectedWorkspaceNote, resolveWorkspace, type WorkspaceParam} from './storefront.js';

/** Default page size for a filtered listing. Bounds payload size (large corpora hold 500+ entries). */
const DEFAULT_LIMIT = 100;

interface ListInput {
  category?: DocCategory;
  workspace?: WorkspaceParam;
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
  detectedWorkspaces: readonly ProjectType[] = [],
  enabledCategories?: readonly DocCategory[],
): McpTool {
  return createToolAdapter<ListInput, ListOutput>(
    {
      name: 'docs_list',
      description:
        'Enumerate B2C Commerce documentation entries (id + title + category only) for a category or workspace. ' +
        'Prefer docs_search for questions — this tool is for browsing a known category. Without a category or ' +
        'workspace it returns just a category directory (counts), not the full corpus. Results are a table of ' +
        'contents; paginated via limit/offset. Use docs_read for content.' +
        enabledCategoriesNote(enabledCategories) +
        detectedWorkspaceNote(detectedWorkspaces),
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        category: z
          .enum(categoryEnumValues(enabledCategories))
          .optional()
          .describe('Restrict the listing to one documentation category.'),
        workspace: z
          .enum(WORKSPACE_VALUES)
          .optional()
          .describe(
            'Limit to a workspace\'s relevant categories. "auto" uses the auto-detected workspace; ' +
              'or name a type. Omit for the category directory.',
          ),
        limit: z.number().int().positive().optional().describe(`Max entries per page. Defaults to ${DEFAULT_LIMIT}.`),
        offset: z.number().int().nonnegative().optional().describe('Number of entries to skip (for pagination).'),
      },
      async execute(args) {
        // Explicit category wins; otherwise a workspace narrows to its relevant categories.
        const workspace = resolveWorkspace(args.workspace, detectedWorkspaces);
        const filter: DocCategory | DocCategory[] | undefined =
          args.category ??
          (args.workspace && args.workspace !== 'all' && workspace ? categoriesForWorkspace(workspace) : undefined);

        // No filter at all → return a compact directory of categories + counts,
        // never the whole corpus (which would blow the inline payload budget).
        // The directory itself is bounded by the launch-time allowlist.
        if (!filter) {
          const counts = new Map<DocCategory, number>();
          for (const e of listDocs(undefined, enabledCategories)) {
            if (e.category) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
          }
          const categories = [...counts.entries()]
            .map(([category, count]) => ({category, count}))
            .sort((a, b) => b.count - a.count);
          const total = categories.reduce((sum, c) => sum + c.count, 0);
          return {
            note: 'Pass a category (or workspace) to list its entries, or use docs_search for a query.',
            total,
            categories,
          };
        }

        const all = listDocs(filter, enabledCategories);
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
