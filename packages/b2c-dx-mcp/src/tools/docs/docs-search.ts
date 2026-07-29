/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {searchDocs, type DocCategory, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {categoryEnumValues, enabledCategoriesNote} from './topics.js';
import {WORKSPACE_VALUES, detectedWorkspaceNote, resolveWorkspace, type WorkspaceParam} from './storefront.js';

/** Default number of results returned when `limit` is not supplied. Kept small to bound payload size for agents. */
const DEFAULT_LIMIT = 5;

interface SearchInput {
  limit?: number;
  offset?: number;
  query: string;
  category?: DocCategory;
  workspace?: WorkspaceParam;
  verbose?: boolean;
}

/** A single search hit, trimmed for a compact default payload. */
interface LeanResult {
  id: string;
  title: string;
  category?: DocCategory;
  summary?: string;
  score: number;
  // Only present in verbose mode:
  keywords?: string[];
  url?: string;
  sourceUrl?: string;
}

interface SearchOutput {
  query: string;
  category?: DocCategory;
  workspace?: ProjectType[];
  total: number;
  offset: number;
  results: LeanResult[];
  truncated?: boolean;
  nextOffset?: number;
}

/**
 * Projects a search hit to the payload returned to an agent. By default we keep
 * only the triage-critical fields (id, title, category, summary, score) and drop
 * `keywords` (index-tuning metadata) and `url` (derivable / returned on read),
 * which together roughly double the payload. `verbose` restores them.
 */
function leanResult(entry: DocEntry, score: number, verbose: boolean): LeanResult {
  const base: LeanResult = {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    score,
  };
  if (entry.summary) base.summary = entry.summary;
  if (verbose) {
    if (entry.keywords && entry.keywords.length > 0) base.keywords = entry.keywords;
    if (entry.url) base.url = entry.url;
    if (entry.sourceUrl) base.sourceUrl = entry.sourceUrl;
  }
  return base;
}

export function createDocsSearchTool(
  loadServices: () => Promise<Services> | Services,
  detectedWorkspaces: readonly ProjectType[] = [],
  enabledCategories?: readonly DocCategory[],
): McpTool {
  return createToolAdapter<SearchInput, SearchOutput>(
    {
      name: 'docs_search',
      description:
        'PRIMARY entry point for B2C Commerce docs: Script API reference (e.g. "ProductMgr"), standard job steps, ' +
        'Developer Center guides (commerce-api, pwa-kit-managed-runtime, sfnext, sfra, b2c-commerce), and this ' +
        "tooling's own guides. Use for ANY B2C Commerce developer or admin question not already grounded in a " +
        'loaded skill or the current project. Content-aware ranking — pass a natural-language query (prefer this ' +
        'over docs_list, which only enumerates). Optionally restrict by category or workspace. Returns id, title, ' +
        'category, summary, and score for triage; pass verbose=true for keywords+url. Call this BEFORE docs_read ' +
        'when you do not know the exact id.' +
        enabledCategoriesNote(enabledCategories) +
        detectedWorkspaceNote(detectedWorkspaces),
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z.string().min(1).describe('Search query (class name, topic, or natural-language phrase).'),
        category: z.enum(categoryEnumValues(enabledCategories)).optional().describe('Restrict results to one corpus.'),
        workspace: z
          .enum(WORKSPACE_VALUES)
          .optional()
          .describe(
            'Workspace context. "auto" (default) favors the auto-detected workspace\'s docs; ' +
              '"all" disables the preference; or name a type (cartridges, sfra, pwa-kit-v3, storefront-next).',
          ),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(`Maximum number of results to return. Defaults to ${DEFAULT_LIMIT}.`),
        offset: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe('Number of ranked results to skip (for pagination). Defaults to 0.'),
        verbose: z
          .boolean()
          .optional()
          .describe('Include keywords and canonical url on each result (larger payload). Defaults to false.'),
      },
      async execute(args) {
        const workspace = resolveWorkspace(args.workspace, detectedWorkspaces);
        const limit = args.limit ?? DEFAULT_LIMIT;
        const offset = args.offset ?? 0;
        // The SDK returns top-N search hits. Retrieve the complete ranked set here
        // so MCP can report a total and provide stable offset-based pagination.
        const ranked = searchDocs(args.query, {
          limit: Number.MAX_SAFE_INTEGER,
          category: args.category,
          workspace,
          enabledCategories,
        });
        const results = ranked.slice(offset, offset + limit);
        const end = offset + results.length;
        const truncated = end < ranked.length;
        return {
          query: args.query,
          ...(args.category && {category: args.category}),
          ...(workspace && {workspace}),
          total: ranked.length,
          offset,
          results: results.map((r) => leanResult(r.entry, r.score, args.verbose ?? false)),
          ...(truncated && {truncated: true, nextOffset: end}),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
