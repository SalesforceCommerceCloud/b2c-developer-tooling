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
import {getRegistry, getSessionEntry} from './session-registry.js';

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
      effect: 'write',
      idempotent: true,
      openWorld: true,
      description:
        'Disconnect and free the instance debugger slot. Always end sessions when finished, including after errors.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        session_id: z.string(),
        clear_breakpoints: z.boolean().optional().describe('Clear breakpoints before disconnecting. Default: false.'),
      },
      async execute(args, context) {
        const entry = getSessionEntry(context, args.session_id);

        if (args.clear_breakpoints) {
          try {
            await entry.manager.client.deleteBreakpoints();
          } catch {
            // Best-effort
          }
        }

        await getRegistry(context).destroySession(args.session_id);

        return {session_id: args.session_id, status: 'disconnected'};
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
