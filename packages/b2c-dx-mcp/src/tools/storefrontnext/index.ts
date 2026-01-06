/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Storefront Next toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Storefront Next development.
 *
 * @module tools/storefrontnext
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
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
 * Creates a placeholder tool for Storefront Next development.
 *
 * Placeholder tools log invocations and return mock responses until
 * the actual implementation is available.
 *
 * @param name - Tool name
 * @param description - Tool description
 * @param services - MCP services
 * @returns The configured MCP tool
 */
function createPlaceholderTool(name: string, description: string, services: Services): McpTool {
  return createToolAdapter<PlaceholderInput, PlaceholderOutput>(
    {
      name,
      description: `[PLACEHOLDER] ${description}`,
      toolsets: ['STOREFRONTNEXT'],
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
 * Creates all tools for the STOREFRONTNEXT toolset.
 *
 * Note: mrt_bundle_push is defined in the MRT toolset with
 * toolsets: ["MRT", "PWAV3", "STOREFRONTNEXT"] and will
 * automatically appear in STOREFRONTNEXT.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createStorefrontNextTools(services: Services): McpTool[] {
  return [
    createPlaceholderTool(
      'sfnext_development_guidelines',
      'Get Storefront Next development guidelines and best practices',
      services,
    ),
    createPlaceholderTool('sfnext_site_theming', 'Configure and manage site theming for Storefront Next', services),
    createPlaceholderTool(
      'sfnext_figma_to_component_workflow',
      'Convert Figma designs to Storefront Next components',
      services,
    ),
    createPlaceholderTool('sfnext_generate_component', 'Generate a new Storefront Next component', services),
    createPlaceholderTool(
      'sfnext_map_tokens_to_theme',
      'Map design tokens to Storefront Next theme configuration',
      services,
    ),
    createPlaceholderTool('sfnext_design_decorator', 'Apply design decorators to Storefront Next components', services),
    createPlaceholderTool(
      'sfnext_generate_page_designer_metadata',
      'Generate Page Designer metadata for Storefront Next components',
      services,
    ),
  ];
}
