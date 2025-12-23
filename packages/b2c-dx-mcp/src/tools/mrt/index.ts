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
 * MRT (Managed Runtime) toolset for B2C Commerce.
 *
 * This toolset provides MCP tools for Managed Runtime operations.
 *
 * @module tools/mrt
 */

import { z } from "zod";
import type { McpTool } from "../../utils/index.js";
import type { Services } from "../../services.js";

/**
 * Creates the mrt_bundle_push tool.
 *
 * This tool deploys a bundle to Managed Runtime and is shared across
 * MRT, PWAV3, and STOREFRONTNEXT toolsets.
 *
 * @param _services - MCP services (unused in placeholder)
 * @returns The mrt_bundle_push tool
 */
function createMrtBundlePushTool(_services: Services): McpTool {
  return {
    name: "mrt_bundle_push",
    description: "[PLACEHOLDER] Build, push bundle (optionally deploy)",
    inputSchema: {
      projectId: z.string().optional().describe("MRT project ID"),
      environmentId: z.string().optional().describe("Target environment ID"),
      message: z.string().optional().describe("Deployment message"),
    },
    toolsets: ["MRT", "PWAV3", "STOREFRONTNEXT"],
    isGA: false,
    handler: async (args) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] mrt_bundle_push called with:`, args);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                tool: "mrt_bundle_push",
                status: "placeholder",
                message:
                  "This is a placeholder implementation for 'mrt_bundle_push'. The actual implementation is coming soon.",
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
 * Creates all tools for the MRT toolset.
 *
 * @param services - MCP services
 * @returns Array of MCP tools
 */
export function createMrtTools(services: Services): McpTool[] {
  return [createMrtBundlePushTool(services)];
}
