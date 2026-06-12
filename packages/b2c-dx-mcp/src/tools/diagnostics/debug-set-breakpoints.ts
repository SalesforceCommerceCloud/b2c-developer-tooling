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
  projectBreakpoint,
  resolveBreakpointPath,
  type BreakpointInput,
  type MappedBreakpoint,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {getSessionEntry} from './session-registry.js';

interface SetBreakpointsInput {
  session_id: string;
  breakpoints: Array<{file: string; line: number; condition?: string}>;
}

interface BreakpointResult extends MappedBreakpoint {
  verified: boolean;
}

interface SetBreakpointsOutput {
  breakpoints: BreakpointResult[];
  warnings?: string[];
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
        'Accepts local file paths (mapped to server paths via cartridge discovery), cartridge-prefixed paths, or server paths starting with /. ' +
        'Check the "verified" field and "warnings" — unmapped paths are flagged.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
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
        const entry = getSessionEntry(context, args.session_id);
        const warnings: string[] = [];

        const bpInputs: BreakpointInput[] = args.breakpoints.map((bp) => {
          const scriptPath = resolveBreakpointPath(bp.file, entry.sourceMapper, entry.cartridges);
          if (!entry.sourceMapper.toLocalPath(scriptPath)) {
            warnings.push(
              `"${bp.file}" resolved to server path "${scriptPath}" but could not be mapped back to a local file. ` +
                `Verify this path exists on the instance.`,
            );
          }
          return {script_path: scriptPath, line_number: bp.line, condition: bp.condition};
        });

        const result = await entry.manager.setBreakpoints(bpInputs);
        entry.breakpoints = result;

        return {
          breakpoints: result.map((bp) => ({
            ...projectBreakpoint(bp, entry.sourceMapper),
            verified: entry.sourceMapper.toLocalPath(bp.script_path) !== undefined,
          })),
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
