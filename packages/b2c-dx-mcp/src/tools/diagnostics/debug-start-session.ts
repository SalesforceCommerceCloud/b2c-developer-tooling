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
  DebugSessionManager,
  createSourceMapper,
  type DebugSessionCallbacks,
  type SdapiScriptThread,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';

interface StartSessionInput {
  cartridge_directory?: string;
  client_id?: string;
}

interface StartSessionOutput {
  session_id: string;
  hostname: string;
  cartridges: string[];
  cartridge_mappings: Record<string, string>;
  warnings: string[];
}

export function createDebugStartSessionTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<StartSessionInput, StartSessionOutput>(
    {
      name: 'debug_start_session',
      description:
        'Start a new script debugger session on a B2C Commerce instance. ' +
        'Connects to the SDAPI, discovers cartridge mappings, and begins polling for halted threads. ' +
        'WARNING: Debug sessions can halt remote request threads on the instance. ' +
        'Use debug_end_session to cleanly disconnect when done. ' +
        'Requires Basic auth credentials (username/password).',
      toolsets: ['CARTRIDGES', 'SCAPI'],
      inputSchema: {
        cartridge_directory: z
          .string()
          .optional()
          .describe('Path to directory containing cartridges. Defaults to project directory.'),
        client_id: z
          .string()
          .optional()
          .describe(
            'Client ID for the debugger API. Defaults to "b2c-cli". Use a different ID to run concurrent sessions on the same host.',
          ),
      },
      async execute(args, context) {
        const registry = context.serverContext?.debugSessions;
        if (!registry) {
          throw new Error('Debug session registry not available');
        }

        const credentials = context.services.getBasicAuthCredentials();
        if (!credentials) {
          throw new Error(
            'Basic auth credentials (hostname, username, password) are required for the script debugger. ' +
              'Set via SFCC_SERVER/SFCC_USERNAME/SFCC_PASSWORD env vars, or configure in dw.json.',
          );
        }

        const {hostname, username, password} = credentials;

        const clientId = args.client_id ?? 'b2c-cli';
        const cartridgeDir = context.services.resolveWithProjectDirectory(args.cartridge_directory);
        const cartridges = findCartridges(cartridgeDir);
        const warnings: string[] = [];

        if (cartridges.length === 0) {
          warnings.push(`No cartridges found in ${cartridgeDir}. Breakpoints will use server paths only.`);
        }

        const sourceMapper = createSourceMapper(cartridges);

        const callbacks: DebugSessionCallbacks = {
          onThreadStopped(thread: SdapiScriptThread) {
            const entry = registry.findByHostAndClientId(hostname, clientId);
            if (!entry) return;

            // Resolve any pending halt waiters
            while (entry.haltWaiters.length > 0) {
              const waiter = entry.haltWaiters.shift()!;
              clearTimeout(waiter.timer);
              waiter.resolve(thread);
            }
          },
        };

        const manager = new DebugSessionManager(
          {hostname, username, password, clientId, cartridgeRoots: cartridges},
          callbacks,
        );

        await manager.connect();

        const entry = registry.registerSession(hostname, clientId, manager, sourceMapper, cartridges);

        const cartridgeMappings: Record<string, string> = {};
        for (const c of cartridges) {
          cartridgeMappings[c.name] = c.src;
        }

        return {
          session_id: entry.sessionId,
          hostname,
          cartridges: cartridges.map((c) => c.name),
          cartridge_mappings: cartridgeMappings,
          warnings,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
