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
import {projectVariable, type MappedVariable} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {getSessionEntry} from './session-registry.js';

interface GetVariablesInput {
  session_id: string;
  thread_id: number;
  frame_index?: number;
  scope?: string;
  object_path?: string;
}

interface GetVariablesOutput {
  variables: MappedVariable[];
}

export function createDebugGetVariablesTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<GetVariablesInput, GetVariablesOutput>(
    {
      name: 'debug_get_variables',
      description:
        'Get variables for a stack frame in a halted thread. ' +
        'Defaults to top-frame locals. Use scope to filter (local/closure/global) or object_path to drill into nested objects.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        thread_id: z.number().int().describe('Thread ID from debug_wait_for_stop or debug_list_sessions.'),
        frame_index: z.number().int().min(0).optional().describe('Stack frame index (0 = top frame). Defaults to 0.'),
        scope: z
          .enum(['local', 'closure', 'global'])
          .optional()
          .describe('Filter variables by scope. If omitted, returns all scopes.'),
        object_path: z
          .string()
          .optional()
          .describe(
            'Dot-delimited path to drill into an object (e.g. "request.httpParameters"). Returns child members.',
          ),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);
        const frameIndex = args.frame_index ?? 0;

        if (args.object_path) {
          const result = await entry.manager.client.getMembers(args.thread_id, frameIndex, args.object_path);
          return {variables: result.object_members.map((m) => projectVariable(m, {includeScope: false}))};
        }

        const result = await entry.manager.client.getVariables(args.thread_id, frameIndex);
        const members = args.scope
          ? result.object_members.filter((m) => m.scope === args.scope)
          : result.object_members;
        return {variables: members.map((m) => projectVariable(m))};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
