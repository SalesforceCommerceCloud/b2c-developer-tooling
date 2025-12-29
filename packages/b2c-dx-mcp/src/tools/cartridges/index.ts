/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Cartridges toolset for B2C Commerce code operations.
 *
 * This toolset provides MCP tools for cartridge and code version management.
 *
 * @module tools/cartridges
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';

/**
 * Creates a placeholder tool that logs and returns a mock response.
 */
function createPlaceholderTool(name: string, description: string, _services: Services): McpTool {
  return {
    name,
    description: `[PLACEHOLDER] ${description}`,
    inputSchema: {
      message: z.string().optional().describe('Optional message to echo'),
    },
    toolsets: ['CARTRIDGES'],
    isGA: false,
    async handler(args) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] CARTRIDGES tool '${name}' called with:`, args);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                tool: name,
                status: 'placeholder',
                message: `This is a placeholder implementation for '${name}'. The actual implementation is coming soon.`,
                input: args,
                timestamp,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  };
}

/**
 * Creates all tools for the CARTRIDGES toolset.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createCartridgesTools(services: Services): McpTool[] {
  return [createPlaceholderTool('cartridge_deploy', 'Deploy cartridges to a B2C Commerce instance', services)];
}
