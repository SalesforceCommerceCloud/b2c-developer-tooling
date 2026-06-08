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
import {projectFrame, type MappedFrame} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {getSessionEntry} from './session-registry.js';

interface GetStackInput {
  session_id: string;
  thread_id: number;
}

interface GetStackOutput {
  thread_id: number;
  frames: MappedFrame[];
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
        'Returns frames with mapped local file paths and server script paths.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        thread_id: z.number().int().describe('Thread ID from debug_wait_for_stop or debug_list_sessions.'),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);
        const thread = await entry.manager.client.getThread(args.thread_id);
        return {
          thread_id: thread.id,
          frames: thread.call_stack.map((frame) => projectFrame(frame, entry.sourceMapper)),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
