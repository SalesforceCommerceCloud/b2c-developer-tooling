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
      effect: 'read',
      idempotent: true,
      openWorld: false,
      description:
        'Drain buffered MRT logs, blocking up to timeout_ms when empty. Repeat if truncated=true. ' +
        'stopped=true means the stream closed; inspect errors.',
      toolsets: ['DIAGNOSTICS', 'MRT', 'PWAV3', 'STOREFRONTNEXT'],
      inputSchema: {
        watch_id: z.string(),
        timeout_ms: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Wait when empty, in milliseconds. Default: 5000; 0 returns immediately.'),
        max_entries: z.number().int().positive().optional().describe('Maximum entries. Default: 200.'),
      },
      async execute(args, context) {
        const {watch} = getMrtLogWatchRegistry(context).getWatchOrThrow(args.watch_id);
        const batch = await watch.poll({
          timeoutMs: args.timeout_ms ?? DEFAULT_TIMEOUT_MS,
          maxEntries: args.max_entries ?? DEFAULT_MAX_ENTRIES,
        });
        return {
          buffered_remaining: batch.bufferedRemaining,
          dropped_entries: batch.droppedEntries,
          entries: batch.entries,
          errors: batch.errors,
          stopped: batch.stopped,
          truncated: batch.truncated,
          watch_id: args.watch_id,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
