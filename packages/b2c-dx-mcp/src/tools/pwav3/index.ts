/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * PWA Kit v3 toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for PWA Kit v3 development.
 * PWA Kit-specific tools are planned for future releases.
 * mrt_bundle_push (from MRT toolset) is available for PWAV3 projects.
 *
 * @module tools/pwav3
 */

import type {McpTool, Toolset} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {createDeveloperGuidelinesTool} from './pwa-kit-development-guidelines.js';
import {z} from 'zod';

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
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns The configured MCP tool
 */
function createPlaceholderTool(
  name: string,
  description: string,
  toolsets: Toolset[],
  loadServices: () => Services,
): McpTool {
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
    loadServices,
  );
}

/**
 * Creates all tools for the PWAV3 toolset.
 *
 * PWA Kit-specific tools are not yet implemented. mrt_bundle_push is defined
 * in the MRT toolset with toolsets: ["MRT", "PWAV3", "STOREFRONTNEXT"] and
 * automatically appears in PWAV3 for bundle deployment.
 *
 * @param _loadServices - Function that loads configuration and returns Services instance
 * @returns Array of MCP tools (empty until PWA Kit tools are implemented)
 */
export function createPwav3Tools(loadServices: () => Services): McpTool[] {
  return [
    // PWA Kit development tools
    createDeveloperGuidelinesTool(loadServices),
    createPlaceholderTool(
      'pwakit_create_storefront',
      'Create a new PWA Kit storefront project',
      ['PWAV3'],
      loadServices,
    ),
    createPlaceholderTool(
      'pwakit_create_page',
      'Create a new page component in PWA Kit project',
      ['PWAV3'],
      loadServices,
    ),
    createPlaceholderTool(
      'pwakit_create_component',
      'Create a new React component in PWA Kit project',
      ['PWAV3'],
      loadServices,
    ),
    createPlaceholderTool(
      'pwakit_recommend_hooks',
      'Recommend appropriate React hooks for PWA Kit use cases',
      ['PWAV3'],
      loadServices,
    ),
    createPlaceholderTool('pwakit_run_site_test', 'Run site tests for PWA Kit project', ['PWAV3'], loadServices),
    createPlaceholderTool(
      'pwakit_install_agent_rules',
      'Install AI agent rules for PWA Kit development',
      ['PWAV3'],
      loadServices,
    ),
    createPlaceholderTool(
      'pwakit_explore_scapi_shop_api',
      'Explore SCAPI Shop API endpoints and capabilities',
      ['PWAV3'],
      loadServices,
    ),
  ];
}
