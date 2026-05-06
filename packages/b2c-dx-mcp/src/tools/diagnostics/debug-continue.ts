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

interface ContinueInput {
  session_id: string;
  thread_id: number;
}

interface ContinueOutput {
  thread_id: number;
  status: string;
}

export function createDebugContinueTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<ContinueInput, ContinueOutput>(
    {
      name: 'debug_continue',
      description:
        'Resume execution of a halted thread. The thread continues until the next breakpoint or request completion.',
      toolsets: ['CARTRIDGES', 'SCAPI'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        thread_id: z.number().int().describe('Thread ID of the halted thread to resume.'),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);
        await entry.manager.resume(args.thread_id);

        return {
          thread_id: args.thread_id,
          status: 'resumed',
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
