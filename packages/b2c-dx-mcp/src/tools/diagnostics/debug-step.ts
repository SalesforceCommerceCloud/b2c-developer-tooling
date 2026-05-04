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

interface StepInput {
  session_id: string;
  thread_id: number;
}

interface StepOutput {
  thread_id: number;
  action: string;
}

type StepAction = 'step_into' | 'step_out' | 'step_over';

function createStepTool(
  action: StepAction,
  description: string,
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<StepInput, StepOutput>(
    {
      name: `debug_${action}`,
      description: description + ' Follow with debug_wait_for_stop to see where execution landed.',
      toolsets: ['CARTRIDGES', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        thread_id: z.number().int().describe('Thread ID of the halted thread to step.'),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);
        const manager = entry.manager;

        switch (action) {
          case 'step_into': {
            await manager.stepInto(args.thread_id);
            break;
          }
          case 'step_out': {
            await manager.stepOut(args.thread_id);
            break;
          }
          case 'step_over': {
            await manager.stepOver(args.thread_id);
            break;
          }
        }

        return {
          thread_id: args.thread_id,
          action,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}

export function createDebugStepTools(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool[] {
  return [
    createStepTool('step_over', 'Step to the next line in the current function.', loadServices, serverContext),
    createStepTool('step_into', 'Step into the function call on the current line.', loadServices, serverContext),
    createStepTool(
      'step_out',
      'Step out of the current function, returning to the caller.',
      loadServices,
      serverContext,
    ),
  ];
}
