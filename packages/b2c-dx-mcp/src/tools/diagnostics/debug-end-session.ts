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

interface EndSessionInput {
  session_id: string;
  clear_breakpoints?: boolean;
}

interface EndSessionOutput {
  session_id: string;
  status: string;
}

export function createDebugEndSessionTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<EndSessionInput, EndSessionOutput>(
    {
      name: 'debug_end_session',
      description:
        'End a script debugger session. ' +
        'Disconnects from the SDAPI, stops polling, and cleans up resources. ' +
        'Optionally clears all breakpoints before disconnecting.',
      toolsets: ['CARTRIDGES', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        session_id: z.string().describe('Session ID returned by debug_start_session.'),
        clear_breakpoints: z
          .boolean()
          .optional()
          .describe('If true, delete all breakpoints before disconnecting. Defaults to false.'),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entry = registry.getSessionOrThrow(args.session_id);

        if (args.clear_breakpoints) {
          try {
            await entry.manager.client.deleteBreakpoints();
          } catch {
            // Best-effort
          }
        }

        await registry.destroySession(args.session_id);

        return {
          session_id: args.session_id,
          status: 'disconnected',
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
