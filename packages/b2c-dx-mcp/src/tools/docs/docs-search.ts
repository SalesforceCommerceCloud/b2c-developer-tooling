/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {searchDocs, type DocCategory, type SearchResult} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

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

interface SearchInput {
  limit?: number;
  query: string;
  category?: DocCategory;
}

interface SearchOutput {
  query: string;
  category?: DocCategory;
  results: SearchResult[];
}

export function createDocsSearchTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<SearchInput, SearchOutput>(
    {
      name: 'docs_search',
      description:
        'Search bundled B2C Commerce documentation across multiple corpora: Script API reference ' +
        '(e.g. "ProductMgr", "dw.catalog"), standard job steps, Developer Center guides (conceptual / ' +
        'how-to prose for commerce-api, pwa-kit-managed-runtime, sfnext, sfra, b2c-commerce), and this ' +
        'tooling\'s own guides. Content-aware ranking — pass a natural-language query (e.g. "passwordless ' +
        'login", "configure multiple sites"). Optionally restrict to a category. Each result includes ' +
        'id, title, category, and (when available) a summary, keywords, and url so you can triage without ' +
        'reading the full doc. Use this BEFORE docs_read when you do not know the exact id.',
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
        limit: z.number().int().positive().optional().describe('Maximum number of results to return. Defaults to 20.'),
      },
      async execute(args) {
        const results = searchDocs(args.query, {limit: args.limit ?? 20, category: args.category});
        return {query: args.query, ...(args.category && {category: args.category}), results};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
