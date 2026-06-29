/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {listLogFiles, type ListLogsOptions, type LogFile} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

interface ListFilesInput {
  prefixes?: string[];
  sort_by?: 'date' | 'name' | 'size';
  sort_order?: 'asc' | 'desc';
}

interface ListFilesOutput {
  count: number;
  files: LogFile[];
}

export interface LogsListFilesInjections {
  listLogFiles?: (instance: B2CInstance, options?: ListLogsOptions) => Promise<LogFile[]>;
}

export function createLogsListFilesTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: LogsListFilesInjections,
): McpTool {
  const listLogFilesFn = injections?.listLogFiles ?? listLogFiles;
  return createToolAdapter<ListFilesInput, ListFilesOutput>(
    {
      name: 'logs_list_files',
      description:
        'List log files on the configured B2C Commerce instance via WebDAV. ' +
        'Use this to discover what log prefixes are active (error, customerror, debug, jobs, ...) before fetching entries with logs_get_recent or starting a watch.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      requiresInstance: true,
      inputSchema: {
        prefixes: z
          .array(z.string())
          .optional()
          .describe('Filter by log prefixes (e.g., ["error", "customerror"]). Returns all when omitted.'),
        sort_by: z.enum(['date', 'name', 'size']).optional().describe('Sort field. Defaults to "date".'),
        sort_order: z.enum(['asc', 'desc']).optional().describe('Sort order. Defaults to "desc".'),
      },
      async execute(args, context) {
        const files = await listLogFilesFn(context.b2cInstance!, {
          prefixes: args.prefixes,
          sortBy: args.sort_by ?? 'date',
          sortOrder: args.sort_order ?? 'desc',
        });
        return {count: files.length, files};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
