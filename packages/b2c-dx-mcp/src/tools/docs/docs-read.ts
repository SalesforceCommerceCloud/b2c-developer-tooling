/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {readDocByQuery, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, errorResult, jsonResult} from '../adapter.js';

interface ReadInput {
  query: string;
}

interface ReadOutput {
  content: string;
  entry: DocEntry;
}

export function createDocsReadTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<ReadInput, null | ReadOutput>(
    {
      name: 'docs_read',
      description:
        'Read full Script API documentation (markdown) for a B2C Commerce class or module. ' +
        'Accepts an exact id (e.g., "dw.catalog.ProductMgr") or fuzzy query — best match wins. ' +
        'Content can be large; if you do not know the id, call docs_search first to narrow down.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z.string().min(1).describe('Exact id ("dw.catalog.ProductMgr") or fuzzy query ("ProductMgr").'),
      },
      async execute(args) {
        return readDocByQuery(args.query);
      },
      formatOutput: (output) =>
        output ? jsonResult(output) : errorResult('No documentation found. Try docs_search to find candidates.'),
    },
    loadServices,
  );
}
