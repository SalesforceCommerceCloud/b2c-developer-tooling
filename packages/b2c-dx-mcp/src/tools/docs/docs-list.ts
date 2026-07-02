/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {listDocs, type DocCategory, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

/** Documentation categories a listing can be restricted to. */
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

interface ListInput {
  category?: DocCategory;
}

interface ListOutput {
  count: number;
  entries: DocEntry[];
}

export function createDocsListTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<ListInput, ListOutput>(
    {
      name: 'docs_list',
      description:
        'List available B2C Commerce documentation entries (id + title + category) across all corpora ' +
        '(Script API, job steps, Developer Center guides, tooling guides). Output is large; pass a ' +
        'category to narrow it, or prefer docs_search for targeted lookups.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        category: z.enum(CATEGORIES).optional().describe('Restrict the listing to one documentation category.'),
      },
      async execute(args) {
        const entries = listDocs(args.category);
        return {count: entries.length, entries};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
