/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getLogWatchRegistry} from './log-watch-registry.js';

interface StopInput {
  watch_id: string;
}

interface StopOutput {
  stopped_at: string;
  total_entries_seen: number;
  watch_id: string;
}

export function createLogsWatchStopTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<StopInput, StopOutput>(
    {
      name: 'logs_watch_stop',
      description:
        'Stop a log watch and release its resources. Idempotent on already-stopped watches (returns 200 with stopped_at). ' +
        'Always pair with logs_watch_start so polling state does not accumulate on the server.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        watch_id: z.string().describe('Watch id from logs_watch_start.'),
      },
      async execute(args, context) {
        const registry = getLogWatchRegistry(context);
        // Idempotent: a watch that was already stopped (and removed) returns a
        // success response rather than throwing, so retry/cleanup paths are safe.
        const watch = registry.getWatch(args.watch_id);
        const totalSeen = watch?.totalEntriesSeen ?? 0;
        if (watch) {
          await registry.destroyWatch(args.watch_id);
        }
        return {
          stopped_at: new Date().toISOString(),
          total_entries_seen: totalSeen,
          watch_id: args.watch_id,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
