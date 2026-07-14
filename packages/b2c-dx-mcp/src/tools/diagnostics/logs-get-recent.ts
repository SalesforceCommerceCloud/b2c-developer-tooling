/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {
  filterByLevel,
  filterBySearch,
  filterBySince,
  getRecentLogs,
  parseSinceTime,
  type GetRecentLogsOptions,
  type LogEntry,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

export interface LogsGetRecentInjections {
  getRecentLogs?: (instance: B2CInstance, options?: GetRecentLogsOptions) => Promise<LogEntry[]>;
}

const DEFAULT_PREFIXES = ['error', 'customerror'];
const DEFAULT_COUNT = 50;

interface GetRecentInput {
  count?: number;
  level?: string[];
  prefixes?: string[];
  search?: string;
  since?: string;
}

interface GetRecentOutput {
  count: number;
  entries: LogEntry[];
}

export function createLogsGetRecentTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: LogsGetRecentInjections,
): McpTool {
  const getRecentLogsFn = injections?.getRecentLogs ?? getRecentLogs;
  return createToolAdapter<GetRecentInput, GetRecentOutput>(
    {
      name: 'logs_get_recent',
      description:
        'Fetch recent log entries from the configured B2C Commerce instance in a single request/response. ' +
        'Best for quick lookups of the most recent errors. For monitoring across an action you trigger, ' +
        'use logs_watch_start + logs_watch_poll instead so entries are not missed between calls. ' +
        'Filters (since, level, search) are applied client-side after fetching.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      requiresInstance: true,
      inputSchema: {
        prefixes: z
          .array(z.string())
          .optional()
          .describe(
            'Log prefixes to read. Defaults to ["error", "customerror"]. Use a path like "internal/server" to read logs from a subdirectory.',
          ),
        count: z.number().int().positive().optional().describe('Maximum number of entries to return. Defaults to 50.'),
        since: z
          .string()
          .optional()
          .describe('Only entries after this time. Accepts relative ("5m", "1h", "2d") or ISO 8601.'),
        level: z
          .array(z.string())
          .optional()
          .describe('Filter by log level (ERROR, WARN, INFO, DEBUG, FATAL, TRACE). Case-insensitive.'),
        search: z
          .string()
          .optional()
          .describe('Case-insensitive substring filter applied to entry message and raw text.'),
      },
      async execute(args, context) {
        const prefixes = args.prefixes ?? DEFAULT_PREFIXES;
        const count = args.count ?? DEFAULT_COUNT;

        let sinceDate: Date | undefined;
        if (args.since) {
          sinceDate = parseSinceTime(args.since);
        }

        const needsClientFilter = Boolean(sinceDate || args.level?.length || args.search);
        const fetchCount = needsClientFilter ? Math.max(count * 5, 500) : count;

        let entries = await getRecentLogsFn(context.b2cInstance!, {
          prefixes,
          maxEntries: fetchCount,
        });

        if (sinceDate) {
          entries = filterBySince(entries, sinceDate);
        }
        if (args.level && args.level.length > 0) {
          entries = filterByLevel(entries, args.level);
        }
        if (args.search) {
          entries = filterBySearch(entries, args.search);
        }

        entries = entries.slice(0, count);

        return {count: entries.length, entries};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
