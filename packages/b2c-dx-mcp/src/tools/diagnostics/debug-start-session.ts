/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import type {ServerContext} from '../../server-context.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import type {ProjectContextInput} from '../project-context.js';
import {
  DebugSessionManager,
  createSourceMapper,
  type DebugSessionCallbacks,
  type SdapiScriptThread,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import {getRegistry} from './session-registry.js';

interface StartSessionInput extends ProjectContextInput {
  /** Optional source-mapping root when cartridges are outside the project directory. */
  cartridgeDirectory?: string;
}

interface StartSessionOutput {
  session_id: string;
  hostname: string;
  cartridges: string[];
  cartridge_mappings: Record<string, string>;
  session_cookie: null | {name: string; value: string};
  warnings: string[];
  cartridgeDirectory: string;
}

export function createDebugStartSessionTool(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
): McpTool {
  return createToolAdapter<StartSessionInput, StartSessionOutput>(
    {
      name: 'debug_start_session',
      description:
        'Start a B2C script debugger session and discover cartridge mappings. Returns session_id for follow-up tools. ' +
        'Debugging halts remote request threads; always call debug_end_session.',
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'SCAPI'],
      inputSchema: {
        cartridgeDirectory: z
          .string()
          .optional()
          .describe('Cartridge discovery and source-mapping root; relative to projectDirectory.'),
      },
      usesConfigurationContext: true,
      async execute(args, context) {
        const registry = getRegistry(context);

        const credentials = context.services.getBasicAuthCredentials();
        if (!credentials) {
          throw new Error(
            'Basic auth credentials (username/password) are required for the script debugger. ' +
              'Set via SFCC_SERVER/SFCC_USERNAME/SFCC_PASSWORD env vars, or dw.json.',
          );
        }

        const {hostname, username, password} = credentials;
        const clientId = `b2c-dx-mcp-${randomUUID()}`;
        const cartridgeDir = context.services.resolveWithProjectDirectory(
          args.cartridgeDirectory,
          args.projectDirectory,
        );
        context.setResolvedDirectory('cartridgeDirectory', {
          path: cartridgeDir,
          source: args.cartridgeDirectory ? 'argument' : 'projectDirectory',
        });
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

        const entry = registry.registerSession({
          hostname,
          clientId,
          manager,
          sourceMapper,
          cartridges,
          resolution: structuredClone(context.resolution),
        });

        const cartridgeMappings: Record<string, string> = {};
        for (const c of cartridges) cartridgeMappings[c.name] = c.src;

        const dwsid = manager.getSessionCookie();
        if (!dwsid) {
          warnings.push(
            'No session cookie (dwsid) was returned by the debugger. Requests cannot be pinned to this app server; breakpoints may not be hit on multi-app-server instances.',
          );
        }

        return {
          session_id: entry.sessionId,
          hostname,
          cartridges: cartridges.map((c) => c.name),
          cartridge_mappings: cartridgeMappings,
          session_cookie: dwsid ? {name: 'dwsid', value: dwsid} : null,
          warnings,
          cartridgeDirectory: cartridgeDir,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    loadServices,
    serverContext,
  );
}
