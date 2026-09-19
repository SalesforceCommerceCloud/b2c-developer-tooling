/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {z} from 'zod';
import type {McpTool} from '../utils/index.js';
import {TOOLSETS} from '../utils/constants.js';
import {errorResult, jsonResult} from './adapter.js';

export interface IdeContextConnection {
  url: string;
  token: string;
}

const contextSchema = z.object({
  status: z.enum(['ready', 'unconfigured', 'unavailable']),
  selectionMode: z.enum(['workspace', 'default']),
  projectDirectory: z.string().optional(),
  projectRootPinned: z.boolean(),
  configPath: z.string().optional(),
  instanceName: z.string().optional(),
  hostname: z.string().optional(),
  codeVersion: z.string().optional(),
  codeSync: z.object({
    available: z.boolean(),
    active: z.boolean(),
    hostname: z.string().optional(),
    codeVersion: z.string().optional(),
  }),
});

export function validateIdeContextConnection(connection: IdeContextConnection): void {
  const url = new URL(connection.url);
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    !url.port ||
    url.pathname !== '/context' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('IDE context must use the extension-provided http://127.0.0.1:<port>/context endpoint.');
  }
  if (!connection.token) throw new Error('SFCC_IDE_CONTEXT_TOKEN is required with --ide-context-url.');
}

/** Reads the editor's state independently of Commerce configuration resolution. */
export function createIdeContextTool(connection: IdeContextConnection): McpTool {
  validateIdeContextConnection(connection);
  return {
    name: 'b2c_get_ide_context',
    description:
      'Read the live B2C IDE selection and code-sync status. Unless the user specifies another target, ' +
      'pass its projectDirectory, configPath, and instanceName to configuration-dependent B2C tools. ' +
      'Refresh after selection changes; do not guess unavailable selections or retarget existing sessions. ' +
      'Does not expose credentials, inspect MCP-resolved configuration, or change the selected instance.',
    effect: 'read',
    idempotent: true,
    openWorld: false,
    toolsets: [...TOOLSETS],
    inputSchema: {},
    outputSchema: contextSchema.shape,
    async handler(_args, context) {
      const signal = AbortSignal.any([AbortSignal.timeout(5000), ...(context?.signal ? [context.signal] : [])]);
      try {
        const response = await fetch(connection.url, {
          headers: {Authorization: `Bearer ${connection.token}`},
          redirect: 'error',
          signal,
        });
        if (!response.ok) {
          response.body?.cancel().catch(() => {});
          throw new Error('IDE bridge unavailable');
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Empty IDE context');
        const chunks: Uint8Array[] = [];
        let length = 0;
        try {
          for (;;) {
            // A bounded streaming read must consume chunks in order.
            // eslint-disable-next-line no-await-in-loop
            const {done, value} = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > 64 * 1024) throw new Error('IDE context too large');
            chunks.push(value);
          }
        } finally {
          reader.cancel().catch(() => {});
        }
        // Strip unexpected fields, including any accidental credential fields.
        const selected = contextSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        return {...jsonResult(selected), structuredContent: selected};
      } catch {
        return errorResult(
          'Could not read live IDE context. Reconnect the MCP server from the editor or ask for an explicit target; do not assume the default instance matches the IDE.',
        );
      }
    },
  };
}
