/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {searchDocs, type SearchResult} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

interface SearchInput {
  limit?: number;
  query: string;
}

interface SearchOutput {
  query: string;
  results: SearchResult[];
}

export function createDocsSearchTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<SearchInput, SearchOutput>(
    {
      name: 'docs_search',
      description:
        'Fuzzy-search the bundled B2C Commerce Script API documentation by class, module, or partial name ' +
        '(e.g., "ProductMgr", "dw.catalog", "Status"). Returns matching ids + relevance score. ' +
        'Use this BEFORE docs_read when you do not know the exact id.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z.string().min(1).describe('Search query (class name, module path, or partial match).'),
        limit: z.number().int().positive().optional().describe('Maximum number of results to return. Defaults to 20.'),
      },
      async execute(args) {
        const results = searchDocs(args.query, args.limit ?? 20);
        return {query: args.query, results};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
