/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Salesforce Commerce API (SCAPI) discovery and exploration.
 *
 * @module tools/scapi
 */

import {z} from 'zod';
import type {McpTool, Toolset} from '../../utils/index.js';
import type {Services} from '../../services.js';

/**
 * Creates a placeholder tool that logs and returns a mock response.
 */
function createPlaceholderTool(name: string, description: string, toolsets: Toolset[], _services: Services): McpTool {
  return {
    name,
    description: `[PLACEHOLDER] ${description}`,
    inputSchema: {
      message: z.string().optional().describe('Optional message to echo'),
    },
    toolsets,
    isGA: false,
    async handler(args) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] SCAPI tool '${name}' called with:`, args);

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
 * Creates all tools for the SCAPI toolset.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createScapiTools(services: Services): McpTool[] {
  return [
    createPlaceholderTool(
      'scapi_discovery',
      'Discover available SCAPI endpoints and capabilities',
      ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      services,
    ),
    createPlaceholderTool('scapi_customapi_scaffold', 'Scaffold a new custom SCAPI API', ['SCAPI'], services),
    createPlaceholderTool(
      'scapi_custom_api_discovery',
      'Discover custom SCAPI API endpoints',
      ['PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      services,
    ),
  ];
}
