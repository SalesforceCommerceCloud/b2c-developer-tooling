/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * PWA Kit v3 toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for PWA Kit v3 development.
 *
 * @module tools/pwav3
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
 * Creates a placeholder tool for PWA Kit development.
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
      requiresInstance: false,
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
 * Creates all tools for the PWAV3 toolset.
 *
 * Note: mrt_bundle_push is defined in the MRT toolset with
 * toolsets: ["MRT", "PWAV3", "STOREFRONTNEXT"] and will
 * automatically appear in PWAV3.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createPwav3Tools(services: Services): McpTool[] {
  return [
    // PWA Kit development tools
    createPlaceholderTool('pwakit_create_storefront', 'Create a new PWA Kit storefront project', ['PWAV3'], services),
    createPlaceholderTool('pwakit_create_page', 'Create a new page component in PWA Kit project', ['PWAV3'], services),
    createPlaceholderTool(
      'pwakit_create_component',
      'Create a new React component in PWA Kit project',
      ['PWAV3'],
      services,
    ),
    createPlaceholderTool(
      'pwakit_get_dev_guidelines',
      'Get PWA Kit development guidelines and best practices',
      ['PWAV3'],
      services,
    ),
    createPlaceholderTool(
      'pwakit_recommend_hooks',
      'Recommend appropriate React hooks for PWA Kit use cases',
      ['PWAV3'],
      services,
    ),
    createPlaceholderTool('pwakit_run_site_test', 'Run site tests for PWA Kit project', ['PWAV3'], services),
    createPlaceholderTool(
      'pwakit_install_agent_rules',
      'Install AI agent rules for PWA Kit development',
      ['PWAV3'],
      services,
    ),
    createPlaceholderTool(
      'pwakit_explore_scapi_shop_api',
      'Explore SCAPI Shop API endpoints and capabilities',
      ['PWAV3'],
      services,
    ),
  ];
}
