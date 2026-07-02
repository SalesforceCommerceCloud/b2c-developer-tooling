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
import {STOREFRONT_VALUES, detectedStorefrontNote, resolveStorefront, type StorefrontParam} from './storefront.js';

/** Documentation categories a search can be restricted to. */
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

/** Default number of results returned when `limit` is not supplied. Kept small to bound payload size for agents. */
const DEFAULT_LIMIT = 5;

interface SearchInput {
  limit?: number;
  query: string;
  category?: DocCategory;
  storefront?: StorefrontParam;
  storefrontMode?: 'boost' | 'filter';
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
}

interface SearchOutput {
  query: string;
  category?: DocCategory;
  storefront?: ProjectType[];
  results: LeanResult[];
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
  }
  return base;
}

export function createDocsSearchTool(
  loadServices: () => Promise<Services> | Services,
  detectedStorefronts: readonly ProjectType[] = [],
): McpTool {
  return createToolAdapter<SearchInput, SearchOutput>(
    {
      name: 'docs_search',
      description:
        'PRIMARY entry point for B2C Commerce docs: Script API reference (e.g. "ProductMgr"), standard job steps, ' +
        'Developer Center guides (commerce-api, pwa-kit-managed-runtime, sfnext, sfra, b2c-commerce), and this ' +
        "tooling's own guides. Use for ANY B2C Commerce developer or admin question not already grounded in a " +
        'loaded skill or the current project. Content-aware ranking — pass a natural-language query (prefer this ' +
        'over docs_list, which only enumerates). Optionally restrict by category or storefront. Returns id, title, ' +
        'category, summary, and score for triage; pass verbose=true for keywords+url. Call this BEFORE docs_read ' +
        'when you do not know the exact id.' +
        detectedStorefrontNote(detectedStorefronts),
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z.string().min(1).describe('Search query (class name, topic, or natural-language phrase).'),
        category: z
          .enum(CATEGORIES)
          .optional()
          .describe(
            'Restrict results to one corpus: script-api, job-step, commerce-api, ' +
              'pwa-kit-managed-runtime, sfnext, sfra, b2c-commerce, or tooling.',
          ),
        storefront: z
          .enum(STOREFRONT_VALUES)
          .optional()
          .describe(
            'Storefront context. "current" (default) favors the auto-detected storefront\'s docs; ' +
              '"all" disables the preference; or name a type (cartridges, pwa-kit-v3, storefront-next).',
          ),
        storefrontMode: z
          .enum(['boost', 'filter'])
          .optional()
          .describe('"boost" (default) ranks the storefront higher but hides nothing; "filter" returns only its docs.'),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(`Maximum number of results to return. Defaults to ${DEFAULT_LIMIT}.`),
        verbose: z
          .boolean()
          .optional()
          .describe('Include keywords and canonical url on each result (larger payload). Defaults to false.'),
      },
      async execute(args) {
        const storefront = resolveStorefront(args.storefront, detectedStorefronts);
        const results = searchDocs(args.query, {
          limit: args.limit ?? DEFAULT_LIMIT,
          category: args.category,
          storefront,
          storefrontMode: args.storefrontMode,
        });
        return {
          query: args.query,
          ...(args.category && {category: args.category}),
          ...(storefront && {storefront}),
          results: results.map((r) => leanResult(r.entry, r.score, args.verbose ?? false)),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
