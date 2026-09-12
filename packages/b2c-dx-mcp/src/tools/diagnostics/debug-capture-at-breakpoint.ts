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
  resolveBreakpointPath,
  type BreakpointInput,
  type MappedFrame,
  type MappedVariable,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {getRegistry, getSessionEntry} from './session-registry.js';
import {MCP_SKILL_REFERENCES, type SkillReference} from '../../skill-references.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;

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
  stack?: MappedFrame[];
  variables?: MappedVariable[];
  evaluations?: Array<{expression: string; result: string}>;
  auto_continued: boolean;
  trigger_status?: number;
  trigger_pending?: boolean;
  warnings?: string[];
  skillReferences?: SkillReference[];
}

export function createDebugCaptureAtBreakpointTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<CaptureInput, CaptureOutput>(
    {
      name: 'debug_capture_at_breakpoint',
      effect: 'write',
      idempotent: false,
      openWorld: true,
      description:
        'Add a breakpoint and wait for a halt; return stack, variables, and evaluations. ' +
        'Trigger a GET here or an external request concurrently. Capture does not resume by default. ' +
        'Workflow: skill://mcp/debugger/SKILL.md.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        session_id: z.string(),
        file: z.string().describe('Local file path or server script path for the breakpoint.'),
        line: z.number().int().positive().describe('1-based line number.'),
        condition: z.string().optional().describe('Optional conditional expression for the breakpoint.'),
        expressions: z
          .array(z.string())
          .optional()
          .describe('Expressions evaluated when halted; may change remote state.'),
        timeout_ms: z
          .number()
          .int()
          .positive()
          .max(MAX_TIMEOUT_MS)
          .optional()
          .describe(`Wait timeout in milliseconds. Default: ${DEFAULT_TIMEOUT_MS}; max: ${MAX_TIMEOUT_MS}.`),
        auto_continue: z
          .boolean()
          .optional()
          .describe('Resume after capture; default false leaves the request halted. Use true for snapshots.'),
        trigger_url: z
          .string()
          .optional()
          .describe('GET after arming; no custom headers. May remain pending while halted.'),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);
        const registry = getRegistry(context);
        const timeout = Math.min(args.timeout_ms ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

        const scriptPath = resolveBreakpointPath(args.file, entry.sourceMapper, entry.cartridges);

        // Add breakpoint to existing set
        const allBps: BreakpointInput[] = [
          ...entry.breakpoints.map((bp) => ({
            script_path: bp.script_path,
            line_number: bp.line_number,
            condition: bp.condition,
          })),
          {script_path: scriptPath, line_number: args.line, condition: args.condition},
        ];
        entry.breakpoints = await entry.manager.setBreakpoints(allBps);

        const breakpointInfo = {
          file: entry.sourceMapper.toLocalPath(scriptPath) ?? null,
          line: args.line,
          script_path: scriptPath,
        };

        // Fire trigger URL in the background (it will hang when the breakpoint halts the thread)
        let triggerStatus: number | undefined;
        let triggerPending = Boolean(args.trigger_url);
        const triggerPromise = args.trigger_url
          ? fetch(args.trigger_url, {redirect: 'follow'})
              .then((r) => {
                triggerStatus = r.status;
              })
              .catch(() => {})
              .finally(() => {
                triggerPending = false;
              })
          : undefined;

        const thread = await registry.waitForHalt(entry, timeout);

        if (!thread) {
          return {
            breakpoint: breakpointInfo,
            halted: false,
            timed_out: true,
            auto_continued: false,
            trigger_pending: args.trigger_url ? triggerPending : undefined,
            warnings: [
              'No halt observed before timeout. Check deployed code, cartridge path, and trigger. The breakpoint remains armed; end the session with clear_breakpoints when finished.',
            ],
            skillReferences: [MCP_SKILL_REFERENCES.debuggerRecovery],
          };
        }

        const threadDetail = await entry.manager.client.getThread(thread.id);
        const stack = threadDetail.call_stack.map((frame) => projectFrame(frame, entry.sourceMapper));

        const varsResult = await entry.manager.client.getVariables(thread.id, 0);
        const variables = varsResult.object_members.map((m) => projectVariable(m));

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

        // A halted request cannot finish until the caller resumes it in another tool call.
        if (autoContinued && triggerPromise) await triggerPromise;

        return {
          breakpoint: breakpointInfo,
          halted: true,
          thread_id: thread.id,
          stack,
          variables,
          evaluations: evaluations.length > 0 ? evaluations : undefined,
          auto_continued: autoContinued,
          trigger_status: triggerStatus,
          trigger_pending: args.trigger_url ? triggerPending : undefined,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
