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
import {createToolAdapter, jsonResult} from '../adapter.js';

/**
 * Common input type for placeholder tools.
 */
interface PlaceholderInput {
  message?: string;
}

/**
 * Common output type for placeholder tools.
 */
interface PlaceholderOutput {
  tool: string;
  status: string;
  message: string;
  input: PlaceholderInput;
  timestamp: string;
}

/**
 * Creates a placeholder tool for SCAPI operations.
 *
 * Placeholder tools log invocations and return mock responses until
 * the actual implementation is available.
 *
 * @param name - Tool name
 * @param description - Tool description
 * @param toolsets - Toolsets this tool belongs to
 * @param services - MCP services
 * @returns The configured MCP tool
 */
function createPlaceholderTool(name: string, description: string, toolsets: Toolset[], services: Services): McpTool {
  return createToolAdapter<PlaceholderInput, PlaceholderOutput>(
    {
      name,
      description: `[PLACEHOLDER] ${description}`,
      toolsets,
      isGA: false,
      requiresInstance: true,
      inputSchema: {
        message: z.string().optional().describe('Optional message to echo'),
      },
      async execute(args) {
        // Placeholder implementation
        const timestamp = new Date().toISOString();

        return {
          tool: name,
          status: 'placeholder',
          message: `This is a placeholder implementation for '${name}'. The actual implementation is coming soon.`,
          input: args,
          timestamp,
        };
      },
      formatOutput: (output) => jsonResult(output),
    },
    services,
  );
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
