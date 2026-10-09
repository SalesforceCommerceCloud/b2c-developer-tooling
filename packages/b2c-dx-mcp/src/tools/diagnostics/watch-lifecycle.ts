/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import {errorResult, jsonResult} from '../adapter.js';

/** Dispatch before loading configuration: existing watches retain their original target. */
export function createWatchLifecycleTool(
  start: McpTool,
  list: () => unknown,
  stop: (watchId: string) => Promise<unknown>,
): McpTool {
  const actionSchema = z.enum(['start', 'list', 'stop']);
  const schemas = {
    start: z.object(start.inputSchema).strict(),
    list: z.object({}).strict(),
    stop: z.object({watch_id: z.string().min(1)}).strict(),
  };
  return {
    ...start,
    inputSchema: {
      action: actionSchema.describe('start uses configuration/filters; stop needs watch_id; list takes only action.'),
      ...start.inputSchema,
      watch_id: z.string().min(1).optional().describe('Required for stop only.'),
    },
    async handler({action, ...args}) {
      const parsedAction = actionSchema.safeParse(action);
      if (!parsedAction.success) return errorResult('action must be start, list, or stop.');
      const parsed = schemas[parsedAction.data].safeParse(args);
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'arguments'}: ${issue.message}`)
          .join('; ');
        return errorResult(`Invalid ${parsedAction.data} input: ${detail}`);
      }
      try {
        if (parsedAction.data === 'start') return await start.handler(args);
        if (parsedAction.data === 'list') return jsonResult(list());
        return jsonResult(await stop(args.watch_id as string));
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : String(error));
      }
    },
  };
}
