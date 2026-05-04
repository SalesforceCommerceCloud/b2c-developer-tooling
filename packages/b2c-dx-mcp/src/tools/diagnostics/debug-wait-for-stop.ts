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
import type {SdapiScriptThread} from '@salesforce/b2c-tooling-sdk/operations/debug';

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
  location?: {
    file: null | string;
    line: number;
    function_name: string;
    script_path: string;
  };
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
        'Returns immediately if a thread is already halted. ' +
        'Otherwise BLOCKS until a halt occurs or the timeout expires. ' +
        'Preferred non-blocking alternative: after debug_set_breakpoints, trigger the request yourself, then use debug_list_sessions to check if halted_threads is non-empty before calling debug_get_stack/debug_get_variables.',
      toolsets: ['CARTRIDGES', 'SCAPI', 'STOREFRONTNEXT'],
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
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);
        const timeout = Math.min(args.timeout_ms ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

        // Check if any thread is already halted
        const haltedThread = entry.manager.getKnownThreads().find((t) => t.status === 'halted');
        if (haltedThread) {
          return formatHaltResult(haltedThread, entry.sourceMapper);
        }

        // Wait for a halt via the callback mechanism
        const thread = await new Promise<null | SdapiScriptThread>((resolve, reject) => {
          const timer = setTimeout(() => {
            const idx = entry.haltWaiters.findIndex((w) => w.timer === timer);
            if (idx !== -1) entry.haltWaiters.splice(idx, 1);
            resolve(null);
          }, timeout);

          entry.haltWaiters.push({resolve: (t) => resolve(t), reject, timer});
        });

        if (!thread) {
          return {halted: false, timed_out: true};
        }

        return formatHaltResult(thread, entry.sourceMapper);
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}

function formatHaltResult(
  thread: SdapiScriptThread,
  sourceMapper: {toLocalPath: (path: string) => string | undefined},
): WaitForStopOutput {
  const topFrame = thread.call_stack?.[0];
  const loc = topFrame?.location;
  return {
    halted: true,
    thread_id: thread.id,
    location: loc
      ? {
          file: sourceMapper.toLocalPath(loc.script_path) ?? null,
          line: loc.line_number,
          function_name: loc.function_name,
          script_path: loc.script_path,
        }
      : undefined,
  };
}
