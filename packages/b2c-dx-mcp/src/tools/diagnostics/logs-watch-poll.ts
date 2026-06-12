/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import type {LogEntry, LogFile} from '@salesforce/b2c-tooling-sdk/operations/logs';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getLogWatchRegistry} from './log-watch-registry.js';

interface PollInput {
  max_entries?: number;
  timeout_ms?: number;
  watch_id: string;
}

interface PollOutput {
  buffered_remaining: number;
  dropped_entries: number;
  entries: LogEntry[];
  errors: Array<{at: string; message: string}>;
  files_discovered: LogFile[];
  files_rotated: LogFile[];
  stopped: boolean;
  truncated: boolean;
  watch_id: string;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_ENTRIES = 200;

export function createLogsWatchPollTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<PollInput, PollOutput>(
    {
      name: 'logs_watch_poll',
      description:
        'Drain buffered entries from a log watch. If the buffer is empty, blocks up to timeout_ms waiting for ' +
        'new entries. Returns immediately if entries are already buffered. Set truncated=true if there are more ' +
        'entries beyond max_entries — call again to get the rest.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        watch_id: z.string().describe('Watch id from logs_watch_start.'),
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
        const registry = getLogWatchRegistry(context);
        const watch = registry.getWatchOrThrow(args.watch_id);

        const timeoutMs = args.timeout_ms ?? DEFAULT_TIMEOUT_MS;
        const maxEntries = args.max_entries ?? DEFAULT_MAX_ENTRIES;

        if (
          watch.buffer.length === 0 &&
          watch.rotations.length === 0 &&
          watch.errors.length === 0 &&
          !watch.stopped &&
          timeoutMs > 0
        ) {
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
          files_discovered: drained.filesDiscovered,
          files_rotated: drained.rotations,
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
