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
import {getSessionEntry} from './session-registry.js';

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
      effect: 'write',
      idempotent: false,
      openWorld: true,
      description:
        'Evaluate JavaScript in a halted thread/frame. Expressions can call functions and change remote state.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        session_id: z.string(),
        thread_id: z.number().int(),
        frame_index: z.number().int().min(0).optional().describe('Default: 0 (top frame).'),
        expression: z.string().describe('JavaScript expression.'),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);
        const frameIndex = args.frame_index ?? 0;
        const result = await entry.manager.client.evaluate(args.thread_id, frameIndex, args.expression);
        return {expression: result.expression, result: result.result};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
