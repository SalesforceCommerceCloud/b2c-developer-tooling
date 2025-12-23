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
 * Cartridges toolset for B2C Commerce code operations.
 *
 * This toolset provides MCP tools for cartridge and code version management.
 *
 * @module tools/cartridges
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
    toolsets: ["CARTRIDGES"],
    isGA: false,
    handler: async (args) => {
      const timestamp = new Date().toISOString();
      console.error(
        `[${timestamp}] CARTRIDGES tool '${name}' called with:`,
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
 * Creates all tools for the CARTRIDGES toolset.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createCartridgesTools(services: Services): McpTool[] {
  return [
    createPlaceholderTool(
      "cartridge_deploy",
      "Deploy cartridges to a B2C Commerce instance",
      services,
    ),
  ];
}
