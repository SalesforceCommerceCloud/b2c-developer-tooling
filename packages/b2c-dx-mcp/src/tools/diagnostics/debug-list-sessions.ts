/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {projectBreakpoint, type MappedBreakpoint} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {getRegistry} from './session-registry.js';

interface ListSessionsOutput {
  sessions: Array<{
    session_id: string;
    hostname: string;
    client_id: string;
    halted_threads: number[];
    breakpoints: MappedBreakpoint[];
    session_cookie: null | {name: string; value: string};
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
        'List active script debugger sessions with their breakpoints and any halted threads. ' +
        'Use this to discover orphaned sessions, check whether breakpoints are armed, and poll for halted threads in the non-blocking debug workflow.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {},
      async execute(_args, context) {
        const registry = getRegistry(context);
        const entries = registry.listSessions();
        return {
          sessions: entries.map((entry) => {
            const dwsid = entry.manager.getSessionCookie();
            return {
              session_id: entry.sessionId,
              hostname: entry.hostname,
              client_id: entry.clientId,
              halted_threads: entry.manager
                .getKnownThreads()
                .filter((t) => t.status === 'halted')
                .map((t) => t.id),
              breakpoints: entry.breakpoints.map((bp) => projectBreakpoint(bp, entry.sourceMapper)),
              session_cookie: dwsid ? {name: 'dwsid', value: dwsid} : null,
              created_at: new Date(entry.createdAt).toISOString(),
              last_activity_at: new Date(entry.lastActivityAt).toISOString(),
            };
          }),
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
