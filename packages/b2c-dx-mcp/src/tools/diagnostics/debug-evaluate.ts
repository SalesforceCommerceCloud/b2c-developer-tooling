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

interface EvaluateInput {
  session_id: string;
  thread_id: number;
  frame_index?: number;
  expression: string;
}

interface EvaluateOutput {
  expression: string;
  result: string;
}

export function createDebugEvaluateTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<EvaluateInput, EvaluateOutput>(
    {
      name: 'debug_evaluate',
      description:
        'Evaluate an expression in the context of a halted thread and stack frame. ' +
        'WARNING: Expressions can have side effects (modify variables, call functions). ' +
        'Use with care on production-like instances.',
      toolsets: ['CARTRIDGES', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        thread_id: z.number().int().describe('Thread ID from debug_wait_for_stop.'),
        frame_index: z.number().int().min(0).optional().describe('Stack frame index (0 = top frame). Defaults to 0.'),
        expression: z.string().describe('JavaScript expression to evaluate in the frame context.'),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);
        const frameIndex = args.frame_index ?? 0;

        const result = await entry.manager.client.evaluate(args.thread_id, frameIndex, args.expression);

        return {
          expression: result.expression,
          result: result.result,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
