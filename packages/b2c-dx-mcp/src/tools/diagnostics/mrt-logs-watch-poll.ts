/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import type {MrtLogEntry} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getMrtLogWatchRegistry} from './mrt-log-watch-registry.js';

interface PollInput {
  max_entries?: number;
  timeout_ms?: number;
  watch_id: string;
}

interface PollOutput {
  buffered_remaining: number;
  dropped_entries: number;
  entries: MrtLogEntry[];
  errors: Array<{at: string; message: string}>;
  stopped: boolean;
  truncated: boolean;
  watch_id: string;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_ENTRIES = 200;

export function createMrtLogsWatchPollTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<PollInput, PollOutput>(
    {
      name: 'mrt_logs_watch_poll',
      description:
        'Drain buffered entries from an MRT log watch. If the buffer is empty, blocks up to timeout_ms waiting for ' +
        'new entries. Returns immediately if entries are already buffered or the stream has stopped. Set ' +
        'truncated=true if there are more entries beyond max_entries — call again to get the rest. When ' +
        'stopped=true the underlying WebSocket has closed (stopped, idle-timed-out, or connection lost); check ' +
        'errors for the reason.',
      toolsets: ['DIAGNOSTICS', 'PWAV3', 'STOREFRONTNEXT'],
      inputSchema: {
        watch_id: z.string().describe('Watch id from mrt_logs_watch_start.'),
        timeout_ms: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Max time to block waiting for new entries when buffer is empty. Defaults to 5000ms.'),
        max_entries: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Maximum entries to return per call. Defaults to 200.'),
      },
      async execute(args, context) {
        const registry = getMrtLogWatchRegistry(context);
        const watch = registry.getWatchOrThrow(args.watch_id);

        const timeoutMs = args.timeout_ms ?? DEFAULT_TIMEOUT_MS;
        const maxEntries = args.max_entries ?? DEFAULT_MAX_ENTRIES;

        if (watch.buffer.length === 0 && watch.errors.length === 0 && !watch.stopped && timeoutMs > 0) {
          await registry.waitForActivity(args.watch_id, timeoutMs);
        }

        const drained = registry.drain(args.watch_id, maxEntries);
        const droppedSnapshot = watch.droppedEntries;
        watch.droppedEntries = 0;

        return {
          buffered_remaining: watch.buffer.length,
          dropped_entries: droppedSnapshot,
          entries: drained.entries,
          errors: drained.errors,
          stopped: watch.stopped,
          truncated: drained.truncated,
          watch_id: args.watch_id,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
