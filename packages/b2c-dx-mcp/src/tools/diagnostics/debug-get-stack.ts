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

interface GetStackInput {
  session_id: string;
  thread_id: number;
}

interface GetStackOutput {
  thread_id: number;
  frames: Array<{
    index: number;
    function_name: string;
    file: null | string;
    line: number;
    script_path: string;
  }>;
}

export function createDebugGetStackTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<GetStackInput, GetStackOutput>(
    {
      name: 'debug_get_stack',
      description:
        'Get the call stack for a halted thread. ' +
        'Returns stack frames with mapped local file paths and server script paths.',
      toolsets: ['CARTRIDGES', 'SCAPI'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        thread_id: z.number().int().describe('Thread ID from debug_wait_for_stop.'),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);
        const thread = await entry.manager.client.getThread(args.thread_id);

        return {
          thread_id: thread.id,
          frames: thread.call_stack.map((frame) => ({
            index: frame.index,
            function_name: frame.location.function_name,
            file: entry.sourceMapper.toLocalPath(frame.location.script_path) ?? null,
            line: frame.location.line_number,
            script_path: frame.location.script_path,
          })),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
