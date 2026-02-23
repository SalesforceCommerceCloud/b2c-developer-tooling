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
 * **Implemented Tools:**
 * - `storefront_next_development_guidelines` - Get development guidelines and best practices (GA)
 *
 * **Placeholder Tools (Use `--allow-non-ga-tools` flag to enable):**
 * - `storefront_next_site_theming` - Configure site theming
 * - `storefront_next_figma_to_component_workflow` - Convert Figma to components
 * - `storefront_next_generate_component` - Generate new components
 * - `storefront_next_map_tokens_to_theme` - Map design tokens
 * - `storefront_next_generate_page_designer_metadata` - Generate Page Designer metadata
 *
 * @module tools/storefrontnext
 */

import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, jsonResult} from '../adapter.js';
import {createDeveloperGuidelinesTool} from './developer-guidelines.js';
import {createPageDesignerDecoratorTool} from './page-designer-decorator/index.js';

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
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns The configured MCP tool
 */
function createPlaceholderTool(name: string, description: string, loadServices: () => Services): McpTool {
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
    loadServices,
  );
}

/**
 * Creates all tools for the STOREFRONTNEXT toolset.
 *
 * Note: mrt_bundle_push is defined in the MRT toolset with
 * toolsets: ["MRT", "PWAV3", "STOREFRONTNEXT"] and will
 * automatically appear in STOREFRONTNEXT.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns Array of MCP tools
 */
export function createStorefrontNextTools(loadServices: () => Services): McpTool[] {
  return [
    createDeveloperGuidelinesTool(loadServices),
    createPageDesignerDecoratorTool(loadServices),
    createPlaceholderTool(
      'storefront_next_site_theming',
      'Configure and manage site theming for Storefront Next',
      loadServices,
    ),
    createPlaceholderTool(
      'storefront_next_figma_to_component_workflow',
      'Convert Figma designs to Storefront Next components',
      loadServices,
    ),
    createPlaceholderTool(
      'storefront_next_generate_component',
      'Generate a new Storefront Next component',
      loadServices,
    ),
    createPlaceholderTool(
      'storefront_next_map_tokens_to_theme',
      'Map design tokens to Storefront Next theme configuration',
      loadServices,
    ),
    createPlaceholderTool(
      'storefront_next_generate_page_designer_metadata',
      'Generate Page Designer metadata for Storefront Next components',
      loadServices,
    ),
  ];
}
