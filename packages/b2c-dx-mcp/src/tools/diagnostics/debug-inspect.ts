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
import {
  projectFrame,
  projectVariable,
  type MappedFrame,
  type MappedVariable,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {getSessionEntry} from './session-registry.js';

interface InspectInput {
  include?: ('stack' | 'variables')[];
  session_id: string;
  thread_id: number;
  frame_index?: number;
  scope?: string;
  object_path?: string;
}

interface InspectOutput {
  thread_id: number;
  stack?: MappedFrame[];
  variables?: MappedVariable[];
}

export function createDebugInspectTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<InspectInput, InspectOutput>(
    {
      name: 'debug_inspect',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      description: 'Inspect a halted thread: stack and frame variables. Expand objects with object_path.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        include: z
          .array(z.enum(['stack', 'variables']))
          .min(1)
          .optional()
          .describe('Default: both. Object expansion requires variables.'),
        session_id: z.string(),
        thread_id: z.number().int(),
        frame_index: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Variable frame; ignored for stack-only reads. Default: 0.'),
        scope: z
          .enum(['local', 'closure', 'global'])
          .optional()
          .describe('Default: all scopes. Not used for object expansion.'),
        object_path: z.string().optional().describe('Object path, e.g. request.httpParameters; returns child members.'),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);
        const frameIndex = args.frame_index ?? 0;

        const include = args.include ?? ['stack', 'variables'];
        if (!include.includes('variables') && (args.object_path || args.scope)) {
          throw new Error('scope and object_path require variables in include.');
        }
        if (args.object_path && args.scope) throw new Error('Use scope or object_path, not both.');
        const output: InspectOutput = {thread_id: args.thread_id};
        if (include.includes('stack')) {
          const thread = await entry.manager.client.getThread(args.thread_id);
          output.stack = thread.call_stack.map((frame) => projectFrame(frame, entry.sourceMapper));
        }
        if (include.includes('variables')) {
          if (args.object_path) {
            const result = await entry.manager.client.getMembers(args.thread_id, frameIndex, args.object_path);
            output.variables = result.object_members.map((m) => projectVariable(m, {includeScope: false}));
          } else {
            const result = await entry.manager.client.getVariables(args.thread_id, frameIndex);
            const members = args.scope
              ? result.object_members.filter((m) => m.scope === args.scope)
              : result.object_members;
            output.variables = members.map((m) => projectVariable(m));
          }
        }
        return output;
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
