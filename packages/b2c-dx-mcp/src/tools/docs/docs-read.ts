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
        'Read full B2C Commerce documentation (markdown) for a class, module, job step, or guide. ' +
        'Accepts an exact id (e.g. "dw.catalog.ProductMgr", "sfnext/sfnext-get-started") or a fuzzy ' +
        'query — best match wins. Script API / job-step content is bundled; Developer Center guide ' +
        'content is fetched from its published URL on demand (with a summary/headings fallback if the ' +
        'network is unavailable). Content can be large; if you do not know the id, call docs_search first. ' +
        'The returned entry includes the canonical url for citation.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('Exact id ("dw.catalog.ProductMgr", "sfnext/sfnext-get-started") or fuzzy query.'),
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
