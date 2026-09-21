/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import type {DebugSessionManager} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {getSessionEntry} from './session-registry.js';

interface ControlInput {
  action: ControlAction;
  session_id: string;
  thread_id: number;
}

interface ControlOutput {
  thread_id: number;
  action: string;
}

type ControlAction = 'continue' | 'into' | 'out' | 'over';

const CONTROL_HANDLERS: Record<ControlAction, (manager: DebugSessionManager, threadId: number) => Promise<void>> = {
  continue: (m, id) => m.resume(id),
  into: (m, id) => m.stepInto(id),
  out: (m, id) => m.stepOut(id),
  over: (m, id) => m.stepOver(id),
};

export function createDebugControlTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<ControlInput, ControlOutput>(
    {
      name: 'debug_control',
      effect: 'write',
      idempotent: false,
      openWorld: true,
      description: 'Resume or step a halted thread. Follow with debug_wait_for_stop.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        action: z.enum(['continue', 'into', 'over', 'out']),
        session_id: z.string(),
        thread_id: z.number().int(),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);
        await CONTROL_HANDLERS[args.action](entry.manager, args.thread_id);
        return {thread_id: args.thread_id, action: args.action};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
