/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {searchSchemas, type SchemaSearchResult} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

interface SearchInput {
  limit?: number;
  query: string;
}

interface SearchOutput {
  query: string;
  results: SchemaSearchResult[];
}

export function createDocsSchemaSearchTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<SearchInput, SearchOutput>(
    {
      name: 'docs_schema_search',
      description:
        'Search bundled B2C Commerce (SFCC/Demandware) XSD schemas by ID. ' +
        'Returns matching IDs and scores; use docs_schema_read for content.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z.string().min(1).describe('Schema name or partial match (e.g., "catalog", "order").'),
        limit: z.number().int().positive().optional().describe('Maximum number of results to return. Defaults to 20.'),
      },
      async execute(args) {
        const results = searchSchemas(args.query, args.limit ?? 20);
        return {query: args.query, results};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
