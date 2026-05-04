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
import {resolveBreakpointPath, type BreakpointInput} from '@salesforce/b2c-tooling-sdk/operations/debug';

interface SetBreakpointsInput {
  session_id: string;
  breakpoints: Array<{file: string; line: number; condition?: string}>;
}

interface SetBreakpointsOutput {
  breakpoints: Array<{
    id: number;
    file: null | string;
    line: number;
    script_path: string;
    verified: boolean;
    condition?: string;
  }>;
}

export function createDebugSetBreakpointsTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<SetBreakpointsInput, SetBreakpointsOutput>(
    {
      name: 'debug_set_breakpoints',
      description:
        'Set breakpoints in a debug session. Replaces all previously set breakpoints. ' +
        'Accepts local file paths which are mapped to server script paths via cartridge mappings. ' +
        'You can also pass server paths directly (starting with /).',
      toolsets: ['CARTRIDGES', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        breakpoints: z
          .array(
            z.object({
              file: z
                .string()
                .describe(
                  'Local file path or server script path (e.g. /app_storefront/cartridge/controllers/Cart.js).',
                ),
              line: z.number().int().positive().describe('Line number for the breakpoint.'),
              condition: z
                .string()
                .optional()
                .describe('Optional conditional expression. Breakpoint only triggers when this evaluates to true.'),
            }),
          )
          .describe('Array of breakpoints to set. Replaces all existing breakpoints.'),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);

        const bpInputs: BreakpointInput[] = args.breakpoints.map((bp) => ({
          script_path: resolveBreakpointPath(bp.file, entry.sourceMapper, entry.cartridges),
          line_number: bp.line,
          condition: bp.condition,
        }));

        const result = await entry.manager.setBreakpoints(bpInputs);
        entry.breakpoints = result;

        return {
          breakpoints: result.map((bp) => ({
            id: bp.id,
            file: entry.sourceMapper.toLocalPath(bp.script_path) ?? null,
            line: bp.line_number,
            script_path: bp.script_path,
            verified: true,
            condition: bp.condition,
          })),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
