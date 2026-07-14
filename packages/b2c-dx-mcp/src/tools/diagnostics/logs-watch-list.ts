/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {LogFile} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getLogWatchRegistry} from './log-watch-registry.js';

interface ListWatchesOutput {
  watches: Array<{
    buffered_entries: number;
    created_at: string;
    dropped_entries: number;
    files_discovered: LogFile[];
    hostname: string;
    last_activity_at: string;
    prefixes: string[];
    stopped: boolean;
    total_entries_seen: number;
    watch_id: string;
  }>;
}

export function createLogsWatchListTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<Record<string, never>, ListWatchesOutput>(
    {
      name: 'logs_watch_list',
      description:
        'List all active log watches with their status. Use this to find an orphaned watch_id (e.g., after a ' +
        'crashed agent run) so you can resume polling or stop it.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {},
      async execute(_args, context) {
        const registry = getLogWatchRegistry(context);
        const entries = registry.listWatches();
        return {
          watches: entries.map((w) => ({
            buffered_entries: w.buffer.length,
            created_at: new Date(w.createdAt).toISOString(),
            dropped_entries: w.droppedEntries,
            files_discovered: w.filesDiscovered,
            hostname: w.hostname,
            last_activity_at: new Date(w.lastActivityAt).toISOString(),
            prefixes: w.prefixes,
            stopped: w.stopped,
            total_entries_seen: w.totalEntriesSeen,
            watch_id: w.watchId,
          })),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
