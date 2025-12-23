/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Storefront Next toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Storefront Next development.
 *
 * @module tools/storefrontnext
 */

import { z } from "zod";
import type { McpTool } from "../../utils/index.js";
import type { Services } from "../../services.js";

/**
 * Creates a placeholder tool that logs and returns a mock response.
 */
function createPlaceholderTool(
  name: string,
  description: string,
  _services: Services,
): McpTool {
  return {
    name,
    description: `[PLACEHOLDER] ${description}`,
    inputSchema: {
      message: z.string().optional().describe("Optional message to echo"),
    },
    toolsets: ["STOREFRONTNEXT"],
    isGA: false,
    handler: async (args) => {
      const timestamp = new Date().toISOString();
      console.error(
        `[${timestamp}] STOREFRONTNEXT tool '${name}' called with:`,
        args,
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                tool: name,
                status: "placeholder",
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
      "sfnext_development_guidelines",
      "Get Storefront Next development guidelines and best practices",
      services,
    ),
    createPlaceholderTool(
      "sfnext_site_theming",
      "Configure and manage site theming for Storefront Next",
      services,
    ),
    createPlaceholderTool(
      "sfnext_figma_to_component_workflow",
      "Convert Figma designs to Storefront Next components",
      services,
    ),
    createPlaceholderTool(
      "sfnext_generate_component",
      "Generate a new Storefront Next component",
      services,
    ),
    createPlaceholderTool(
      "sfnext_map_tokens_to_theme",
      "Map design tokens to Storefront Next theme configuration",
      services,
    ),
    createPlaceholderTool(
      "sfnext_design_decorator",
      "Apply design decorators to Storefront Next components",
      services,
    ),
    createPlaceholderTool(
      "sfnext_generate_page_designer_metadata",
      "Generate Page Designer metadata for Storefront Next components",
      services,
    ),
  ];
}
