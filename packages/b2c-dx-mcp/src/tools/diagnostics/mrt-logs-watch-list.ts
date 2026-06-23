/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getMrtLogWatchRegistry} from './mrt-log-watch-registry.js';

interface ListWatchesOutput {
  watches: Array<{
    buffered_entries: number;
    created_at: string;
    dropped_entries: number;
    environment: string;
    last_activity_at: string;
    origin?: string;
    project: string;
    stopped: boolean;
    total_entries_seen: number;
    watch_id: string;
  }>;
}

export function createMrtLogsWatchListTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<Record<string, never>, ListWatchesOutput>(
    {
      name: 'mrt_logs_watch_list',
      description:
        'List all active MRT log watches with their status. Use this to find an orphaned watch_id (e.g., after a ' +
        'crashed agent run) so you can resume polling or stop it.',
      toolsets: ['DIAGNOSTICS', 'PWAV3', 'STOREFRONTNEXT'],
      inputSchema: {},
      async execute(_args, context) {
        const registry = getMrtLogWatchRegistry(context);
        const entries = registry.listWatches();
        return {
          watches: entries.map((w) => ({
            buffered_entries: w.buffer.length,
            created_at: new Date(w.createdAt).toISOString(),
            dropped_entries: w.droppedEntries,
            environment: w.environment,
            last_activity_at: new Date(w.lastActivityAt).toISOString(),
            origin: w.origin,
            project: w.project,
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
