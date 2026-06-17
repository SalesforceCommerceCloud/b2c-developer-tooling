/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {listSchemas, type SchemaEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

interface ListOutput {
  count: number;
  entries: SchemaEntry[];
}

export function createDocsSchemaListTool(loadServices: () => Promise<Services> | Services): McpTool {
  return createToolAdapter<Record<string, never>, ListOutput>(
    {
      name: 'docs_schema_list',
      description:
        'List every available B2C Commerce XSD schema id. Use to discover schema names for docs_schema_read.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {},
      async execute() {
        const entries = listSchemas();
        return {count: entries.length, entries};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
  );
}
