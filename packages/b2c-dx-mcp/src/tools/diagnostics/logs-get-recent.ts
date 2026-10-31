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
  listLogFiles,
  parseSinceTime,
  unreadCustomPrefixes,
  type GetRecentLogsOptions,
  type ListLogsOptions,
  type LogEntry,
  type LogFile,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

export interface LogsGetRecentInjections {
  getRecentLogs?: (instance: B2CInstance, options?: GetRecentLogsOptions) => Promise<LogEntry[]>;
  listLogFiles?: (instance: B2CInstance, options?: ListLogsOptions) => Promise<LogFile[]>;
}

const DEFAULT_PREFIXES = ['error', 'customerror'];
const DEFAULT_COUNT = 50;
const DEFAULT_MAX_MESSAGE_LENGTH = 2000;

interface GetRecentInput {
  count?: number;
  level?: string[];
  maxMessageLength?: number;
  prefixes?: string[];
  search?: string;
  since?: string;
}

/** Entries omit `raw`; it repeats `message` with the timestamp and level already parsed out. */
type RecentLogEntry = Omit<LogEntry, 'raw'> & {truncatedChars?: number};

interface GetRecentOutput {
  count: number;
  entries: RecentLogEntry[];
  /** On an empty result: custom logger categories that the prefixes did not read. */
  unreadCustomLogs?: string[];
  hint?: string;
}

function toRecentEntry({raw: _raw, ...entry}: LogEntry, maxMessageLength: number): RecentLogEntry {
  if (maxMessageLength === 0 || entry.message.length <= maxMessageLength) return entry;
  return {
    ...entry,
    message: entry.message.slice(0, maxMessageLength),
    truncatedChars: entry.message.length - maxMessageLength,
  };
}

export function createLogsGetRecentTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  injections?: LogsGetRecentInjections,
): McpTool {
  const getRecentLogsFn = injections?.getRecentLogs ?? getRecentLogs;
  const listLogFilesFn = injections?.listLogFiles ?? listLogFiles;
  return createToolAdapter<GetRecentInput, GetRecentOutput>(
    {
      name: 'logs_get_recent',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      description:
        'Fetch recent B2C instance logs. Use for quick lookups; start a log watch before actions whose entries must not be missed.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      requiresInstance: true,
      inputSchema: {
        prefixes: z
          .array(z.string())
          .optional()
          .describe(
            'Log prefixes. Default: ["error", "customerror"]; use ["custom-"] for custom logger files; paths may be subdirs.',
          ),
        count: z.number().int().positive().optional().describe('Maximum entries. Default: 50.'),
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
        maxMessageLength: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe(
            `Truncate each message to this many characters; truncatedChars reports the remainder. Default: ${DEFAULT_MAX_MESSAGE_LENGTH}; 0 disables.`,
          ),
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

        const maxMessageLength = args.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH;
        const recent = entries.slice(0, count).map((entry) => toRecentEntry(entry, maxMessageLength));

        if (recent.length > 0) return {count: recent.length, entries: recent};

        // Like `b2c logs get`: point to custom logger files the prefixes skipped.
        let unreadCustomLogs: string[] = [];
        try {
          unreadCustomLogs = unreadCustomPrefixes(await listLogFilesFn(context.b2cInstance!), prefixes);
        } catch {
          // Optional; the read itself already succeeded.
        }
        if (unreadCustomLogs.length === 0) return {count: 0, entries: []};
        return {
          count: 0,
          entries: [],
          unreadCustomLogs,
          hint: 'These custom logger files were not read; pass prefixes ["custom-"] (all) or a specific one.',
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
