/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {readSchemaByQuery, type SchemaEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, errorResult, jsonResult} from '../adapter.js';

interface ReadInput {
  query: string;
}

interface ReadOutput {
  content: string;
  entry: SchemaEntry;
  path: string;
}

export function createDocsSchemaReadTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<ReadInput, null | ReadOutput>(
    {
      name: 'docs_schema_read',
      description:
        'Read a bundled B2C Commerce (SFCC/Demandware) XSD schema as XML by ID or fuzzy query. ' +
        'Use docs_schema_search to find IDs.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z.string().min(1).describe('Schema name or partial match.'),
      },
      async execute(args) {
        return readSchemaByQuery(args.query);
      },
      formatOutput: (output) =>
        output ? jsonResult(output) : errorResult('No schema found. Try docs_schema_search to find candidates.'),
    },
    loadServices,
  );
}
