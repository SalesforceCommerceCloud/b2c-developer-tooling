/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {listDocs, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

interface ListOutput {
  count: number;
  entries: DocEntry[];
}

export function createDocsListTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<Record<string, never>, ListOutput>(
    {
      name: 'docs_list',
      description:
        'List every available Script API documentation entry (id + title). ' +
        'Output is large; prefer docs_search for targeted lookups.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {},
      async execute() {
        const entries = listDocs();
        return {count: entries.length, entries};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
