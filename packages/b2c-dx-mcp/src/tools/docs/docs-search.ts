/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {TOOLSETS} from '../../utils/constants.js';
import {z} from 'zod';
import {searchDocs, type DocCategory, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {DOCS_CITATION_NOTE, categoryEnumValues, enabledCategoriesNote} from './topics.js';
import {
  workspaceInputSchema,
  detectedWorkspaceNote,
  resolveProjectWorkspace,
  type WorkspaceContextInput,
} from './storefront.js';

/** Default number of results returned when `limit` is not supplied. Kept small to bound payload size for agents. */
const DEFAULT_LIMIT = 5;

interface SearchInput extends WorkspaceContextInput {
  limit?: number;
  offset?: number;
  query: string;
  category?: DocCategory;
  verbose?: boolean;
}

/** A single search hit, trimmed for a compact default payload. */
interface LeanResult {
  id: string;
  title: string;
  category?: DocCategory;
  summary?: string;
  score: number;
  /** Canonical page to cite to users. */
  url?: string;
  // Only present in verbose mode:
  keywords?: string[];
  sourceUrl?: string;
}

interface SearchOutput {
  query: string;
  category?: DocCategory;
  workspace?: ProjectType[];
  total: number;
  offset: number;
  citation: string;
  results: LeanResult[];
  truncated?: boolean;
  nextOffset?: number;
}

/**
 * Projects a search hit to the payload returned to an agent. By default we keep
 * the triage-critical fields (id, title, category, summary, score) plus `url`,
 * so an agent can cite the page without exposing the id. `keywords`
 * (index-tuning metadata) and `sourceUrl` (Markdown twin) are verbose-only.
 */
function leanResult(entry: DocEntry, score: number, verbose: boolean): LeanResult {
  const base: LeanResult = {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    score,
  };
  if (entry.summary) base.summary = entry.summary;
  if (entry.url) base.url = entry.url;
  if (verbose) {
    if (entry.keywords && entry.keywords.length > 0) base.keywords = entry.keywords;
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
      effect: 'read',
      idempotent: true,
      openWorld: false,
      description:
        'Search B2C Commerce (SFCC/Demandware) Script API, job steps, developer guides, admin/merchant help, and tooling docs. ' +
        'Use for natural-language queries or unknown IDs; call docs_read with a result ID. ' +
        'Cite by url; never show doc IDs.' +
        enabledCategoriesNote(enabledCategories) +
        detectedWorkspaceNote(detectedWorkspaces),
      toolsets: [...TOOLSETS],
      inputSchema: {
        ...workspaceInputSchema,
        query: z.string().min(1).describe('Search query (class name, topic, or natural-language phrase).'),
        category: z.enum(categoryEnumValues(enabledCategories)).optional().describe('Restrict results to one corpus.'),
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
          .describe('Include keywords and the Markdown sourceUrl on each result (larger payload). Defaults to false.'),
      },
      async execute(args) {
        const workspace = await resolveProjectWorkspace(args, detectedWorkspaces);
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
          citation: DOCS_CITATION_NOTE,
          results: results.map((r) => leanResult(r.entry, r.score, args.verbose ?? false)),
          ...(truncated && {truncated: true, nextOffset: end}),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
