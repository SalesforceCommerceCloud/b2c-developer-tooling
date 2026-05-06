/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';

interface ListSessionsOutput {
  sessions: Array<{
    session_id: string;
    hostname: string;
    client_id: string;
    halted_threads: number[];
    breakpoints: Array<{
      id: number;
      file: null | string;
      line: number;
      script_path: string;
    }>;
    created_at: string;
    last_activity_at: string;
  }>;
}

export function createDebugListSessionsTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<Record<string, never>, ListSessionsOutput>(
    {
      name: 'debug_list_sessions',
      description:
        'List all active script debugger sessions with their breakpoints and halted threads. ' +
        'Use this to check session state: whether breakpoints are armed, which threads are halted, and whether you need to call debug_get_variables or debug_continue. ' +
        'This is the recommended way to poll for halted threads in the non-blocking debug workflow.',
      toolsets: ['CARTRIDGES', 'SCAPI'],
      inputSchema: {},
      async execute(_args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const entries = registry.listSessions();
        return {
          sessions: entries.map((entry) => ({
            session_id: entry.sessionId,
            hostname: entry.hostname,
            client_id: entry.clientId,
            halted_threads: entry.manager
              .getKnownThreads()
              .filter((t) => t.status === 'halted')
              .map((t) => t.id),
            breakpoints: entry.breakpoints.map((bp) => ({
              id: bp.id,
              file: entry.sourceMapper.toLocalPath(bp.script_path) ?? null,
              line: bp.line_number,
              script_path: bp.script_path,
            })),
            created_at: new Date(entry.createdAt).toISOString(),
            last_activity_at: new Date(entry.lastActivityAt).toISOString(),
          })),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
