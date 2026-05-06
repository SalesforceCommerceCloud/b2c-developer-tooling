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
import {projectThreadLocation, type MappedLocation} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {getRegistry, getSessionEntry} from './session-registry.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;

interface WaitForStopInput {
  session_id: string;
  timeout_ms?: number;
}

interface WaitForStopOutput {
  halted: boolean;
  timed_out?: boolean;
  thread_id?: number;
  location?: MappedLocation;
}

export function createDebugWaitForStopTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<WaitForStopInput, WaitForStopOutput>(
    {
      name: 'debug_wait_for_stop',
      description:
        'Wait for a thread to halt at a breakpoint or step. ' +
        'Returns immediately if a thread is already halted; otherwise BLOCKS until a halt occurs or the timeout expires. ' +
        'Preferred non-blocking alternative: after debug_set_breakpoints, trigger the request yourself, then use debug_list_sessions to check halted_threads before calling debug_get_stack/debug_get_variables.',
      toolsets: ['CARTRIDGES', 'SCAPI'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        timeout_ms: z
          .number()
          .int()
          .positive()
          .max(MAX_TIMEOUT_MS)
          .optional()
          .describe(`Timeout in milliseconds (default: ${DEFAULT_TIMEOUT_MS}, max: ${MAX_TIMEOUT_MS}).`),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);
        const timeout = Math.min(args.timeout_ms ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

        const thread = await getRegistry(context).waitForHalt(entry, timeout);
        if (!thread) return {halted: false, timed_out: true};

        const location = projectThreadLocation(thread, entry.sourceMapper);
        return {
          halted: true,
          thread_id: thread.id,
          location: location ?? undefined,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
