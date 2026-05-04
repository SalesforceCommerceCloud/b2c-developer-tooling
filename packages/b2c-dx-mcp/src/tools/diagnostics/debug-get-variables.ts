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

const MAX_VALUE_LENGTH = 200;
const PRIMITIVE_TYPES = new Set(['boolean', 'Boolean', 'null', 'number', 'Number', 'string', 'String', 'undefined']);

interface GetVariablesInput {
  session_id: string;
  thread_id: number;
  frame_index?: number;
  scope?: string;
  object_path?: string;
}

interface GetVariablesOutput {
  variables: Array<{
    name: string;
    type: string;
    value: string;
    scope?: string;
    has_children: boolean;
  }>;
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
        'By default returns top-frame local variables. ' +
        'Use scope to filter (local, closure, global). ' +
        'Use object_path to drill into nested objects.',
      toolsets: ['CARTRIDGES', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        thread_id: z.number().int().describe('Thread ID from debug_wait_for_stop.'),
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
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);
        const frameIndex = args.frame_index ?? 0;

        if (args.object_path) {
          const result = await entry.manager.client.getMembers(args.thread_id, frameIndex, args.object_path);
          return {
            variables: result.object_members.map((m) => ({
              name: m.name,
              type: m.type,
              value: truncateValue(m.value),
              has_children: !PRIMITIVE_TYPES.has(m.type),
            })),
          };
        }

        const result = await entry.manager.client.getVariables(args.thread_id, frameIndex);
        let members = result.object_members;

        if (args.scope) {
          members = members.filter((m) => m.scope === args.scope);
        }

        return {
          variables: members.map((m) => ({
            name: m.name,
            type: m.type,
            value: truncateValue(m.value),
            scope: m.scope,
            has_children: !PRIMITIVE_TYPES.has(m.type),
          })),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}

function truncateValue(value: string): string {
  if (value.length <= MAX_VALUE_LENGTH) return value;
  return value.slice(0, MAX_VALUE_LENGTH) + '...';
}
