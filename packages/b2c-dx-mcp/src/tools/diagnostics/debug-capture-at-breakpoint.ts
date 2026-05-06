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
  resolveBreakpointPath,
  type BreakpointInput,
  type SdapiScriptThread,
} from '@salesforce/b2c-tooling-sdk/operations/debug';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_VALUE_LENGTH = 200;
const PRIMITIVE_TYPES = new Set(['boolean', 'Boolean', 'null', 'number', 'Number', 'string', 'String', 'undefined']);

interface CaptureInput {
  session_id: string;
  file: string;
  line: number;
  condition?: string;
  expressions?: string[];
  timeout_ms?: number;
  auto_continue?: boolean;
  trigger_url?: string;
}

interface CaptureOutput {
  breakpoint: {
    file: null | string;
    line: number;
    script_path: string;
  };
  halted: boolean;
  timed_out?: boolean;
  thread_id?: number;
  stack?: Array<{
    index: number;
    function_name: string;
    file: null | string;
    line: number;
    script_path: string;
  }>;
  variables?: Array<{
    name: string;
    type: string;
    value: string;
    scope?: string;
    has_children: boolean;
  }>;
  evaluations?: Array<{
    expression: string;
    result: string;
  }>;
  auto_continued: boolean;
  trigger_status?: number;
}

export function createDebugCaptureAtBreakpointTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<CaptureInput, CaptureOutput>(
    {
      name: 'debug_capture_at_breakpoint',
      description:
        'Set a breakpoint, optionally trigger an HTTP request, wait for the breakpoint to be hit, and capture a diagnostic snapshot (stack, variables, expression results). ' +
        'Use trigger_url to have the tool fire the request itself (recommended) — this avoids needing to coordinate a separate request while the tool blocks. ' +
        'Without trigger_url, the tool BLOCKS until the breakpoint is hit or timeout expires and requires the user to trigger a request externally. ' +
        'For more control, use the non-blocking workflow: debug_set_breakpoints → trigger request → debug_list_sessions (check halted_threads) → debug_get_variables.',
      toolsets: ['CARTRIDGES', 'SCAPI'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        file: z.string().describe('Local file path or server script path for the breakpoint.'),
        line: z.number().int().positive().describe('Line number for the breakpoint.'),
        condition: z.string().optional().describe('Optional conditional expression for the breakpoint.'),
        expressions: z.array(z.string()).optional().describe('Expressions to evaluate when the breakpoint is hit.'),
        timeout_ms: z
          .number()
          .int()
          .positive()
          .max(MAX_TIMEOUT_MS)
          .optional()
          .describe(
            `Timeout in milliseconds waiting for the breakpoint to be hit (default: ${DEFAULT_TIMEOUT_MS}, max: ${MAX_TIMEOUT_MS}).`,
          ),
        auto_continue: z
          .boolean()
          .optional()
          .describe('If true, resume the thread after capturing the snapshot. Defaults to false.'),
        trigger_url: z
          .string()
          .optional()
          .describe(
            'URL to request after arming the breakpoint. The tool fires this HTTP GET in the background, then waits for the breakpoint to halt. ' +
              'This is the recommended approach — it avoids needing to coordinate a separate request while the tool blocks.',
          ),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);
        const timeout = Math.min(args.timeout_ms ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

        const scriptPath = resolveBreakpointPath(args.file, entry.sourceMapper, entry.cartridges);

        const bpInput: BreakpointInput = {
          script_path: scriptPath,
          line_number: args.line,
          condition: args.condition,
        };

        const existingBps = entry.breakpoints.map((bp) => ({
          script_path: bp.script_path,
          line_number: bp.line_number,
          condition: bp.condition,
        }));
        const allBps = [...existingBps, bpInput];
        const bpResult = await entry.manager.setBreakpoints(allBps);
        entry.breakpoints = bpResult;

        const breakpointInfo = {
          file: entry.sourceMapper.toLocalPath(scriptPath) ?? null,
          line: args.line,
          script_path: scriptPath,
        };

        // Fire trigger URL in the background (it will hang when the breakpoint halts the thread)
        let triggerPromise: Promise<number | undefined> | undefined;
        if (args.trigger_url) {
          triggerPromise = fetch(args.trigger_url, {redirect: 'follow'})
            .then((r) => r.status)
            .catch((): undefined => undefined);
        }

        // Wait for halt
        const haltedThread = entry.manager.getKnownThreads().find((t) => t.status === 'halted');
        let thread: null | SdapiScriptThread = haltedThread ?? null;

        if (!thread) {
          thread = await new Promise<null | SdapiScriptThread>((resolve, reject) => {
            const timer = setTimeout(() => {
              const idx = entry.haltWaiters.findIndex((w) => w.timer === timer);
              if (idx !== -1) entry.haltWaiters.splice(idx, 1);
              resolve(null);
            }, timeout);
            entry.haltWaiters.push({resolve: (t) => resolve(t), reject, timer});
          });
        }

        if (!thread) {
          return {
            breakpoint: breakpointInfo,
            halted: false,
            timed_out: true,
            auto_continued: false,
          };
        }

        const threadDetail = await entry.manager.client.getThread(thread.id);
        const stack = threadDetail.call_stack.map((frame) => ({
          index: frame.index,
          function_name: frame.location.function_name,
          file: entry.sourceMapper.toLocalPath(frame.location.script_path) ?? null,
          line: frame.location.line_number,
          script_path: frame.location.script_path,
        }));

        const varsResult = await entry.manager.client.getVariables(thread.id, 0);
        const variables = varsResult.object_members.map((m) => ({
          name: m.name,
          type: m.type,
          value: m.value.length > MAX_VALUE_LENGTH ? m.value.slice(0, MAX_VALUE_LENGTH) + '...' : m.value,
          scope: m.scope,
          has_children: !PRIMITIVE_TYPES.has(m.type),
        }));

        const evaluations: Array<{expression: string; result: string}> = [];
        if (args.expressions) {
          for (const expr of args.expressions) {
            try {
              // eslint-disable-next-line no-await-in-loop -- sequential: each eval must complete before the next
              const evalResult = await entry.manager.client.evaluate(thread.id, 0, expr);
              evaluations.push({expression: evalResult.expression, result: evalResult.result});
            } catch (error) {
              evaluations.push({
                expression: expr,
                result: `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
            }
          }
        }

        let autoContinued = false;
        if (args.auto_continue) {
          await entry.manager.resume(thread.id);
          autoContinued = true;
        }

        const triggerStatus = triggerPromise ? await triggerPromise : undefined;

        return {
          breakpoint: breakpointInfo,
          halted: true,
          thread_id: thread.id,
          stack,
          variables,
          evaluations: evaluations.length > 0 ? evaluations : undefined,
          auto_continued: autoContinued,
          trigger_status: triggerStatus,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
