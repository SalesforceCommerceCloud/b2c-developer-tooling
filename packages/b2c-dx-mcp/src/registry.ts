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

import { EOL } from "node:os";
import type { McpTool, Toolset, StartupFlags } from "./utils/index.js";
import { ALL_TOOLSETS, TOOLSETS, VALID_TOOLSET_NAMES } from "./utils/index.js";
import type { B2CDxMcpServer } from "./server.js";
import type { Services } from "./services.js";
import { createCartridgesTools } from "./tools/cartridges/index.js";
import { createMrtTools } from "./tools/mrt/index.js";
import { createPwav3Tools } from "./tools/pwav3/index.js";
import { createScapiTools } from "./tools/scapi/index.js";
import { createStorefrontNextTools } from "./tools/storefrontnext/index.js";

/**
 * Registry of tools organized by toolset.
 * Tools can belong to multiple toolsets via their `toolsets` array.
 */
export type ToolRegistry = Record<Toolset, McpTool[]>;

/**
 * Creates the tool registry from all toolset providers.
 * Tools are organized by their declared `toolsets` array, allowing
 * a single tool to appear in multiple toolsets.
 *
 * @param services - Services instance for dependency injection
 * @returns Complete tool registry
 */
export function createToolRegistry(services: Services): ToolRegistry {
  const registry: ToolRegistry = {
    CARTRIDGES: [],
    MRT: [],
    PWAV3: [],
    SCAPI: [],
    STOREFRONTNEXT: [],
  };

  // Collect all tools from all factories
  const allTools: McpTool[] = [
    ...createCartridgesTools(services),
    ...createMrtTools(services),
    ...createPwav3Tools(services),
    ...createScapiTools(services),
    ...createStorefrontNextTools(services),
  ];

  // Organize tools by their declared toolsets (supports multi-toolset)
  for (const tool of allTools) {
    for (const toolset of tool.toolsets) {
      registry[toolset].push(tool);
    }
  }

  return registry;
}

/**
 * Register tools with the MCP server based on startup flags.
 *
 * Tool selection logic:
 * 1. Start with all tools from --toolsets
 * 2. Add individual tools from --tools (can be from any toolset)
 *
 * Example:
 *   --toolsets STOREFRONTNEXT,MRT --tools cartridge_deploy
 *   This enables STOREFRONTNEXT and MRT toolsets, plus adds cartridge_deploy from CARTRIDGES.
 *
 * @param flags - Startup flags from CLI
 * @param server - B2CDxMcpServer instance
 * @param services - Services instance
 */
export async function registerToolsets(
  flags: StartupFlags,
  server: B2CDxMcpServer,
  services: Services,
): Promise<void> {
  const toolsets = flags.toolsets ?? [];
  const individualTools = flags.tools ?? [];
  const allowNonGaTools = flags.allowNonGaTools ?? false;

  // NOTE: When no --toolsets or --tools flags are provided, auto-discovery
  // will detect project type and enable appropriate toolsets automatically.

  // Create the tool registry (all available tools)
  const toolRegistry = createToolRegistry(services);

  // Build flat list of all tools for validation and lookup
  const allTools = Object.values(toolRegistry).flat();
  const allToolsByName = new Map(allTools.map((tool) => [tool.name, tool]));
  const existingToolNames = new Set(allToolsByName.keys());

  // Warn about invalid --tools names (but continue with valid ones)
  const invalidTools = individualTools.filter(
    (name) => !existingToolNames.has(name),
  );
  if (invalidTools.length > 0) {
    console.error(
      `⚠️  Ignoring invalid tool name(s): "${invalidTools.join('", "')}"${EOL}` +
        `   Valid tools: ${Array.from(existingToolNames).join(", ")}`,
    );
  }

  // Validate --toolsets names
  const invalidToolsets = toolsets.filter(
    (t) =>
      !VALID_TOOLSET_NAMES.includes(t as (typeof VALID_TOOLSET_NAMES)[number]),
  );
  if (invalidToolsets.length > 0) {
    console.error(
      `⚠️  Ignoring invalid toolset(s): "${invalidToolsets.join('", "')}"\n` +
        `   Valid toolsets: ${VALID_TOOLSET_NAMES.join(", ")}`,
    );
  }

  // Determine which toolsets to enable
  const validToolsets = toolsets.filter((t): t is Toolset =>
    TOOLSETS.includes(t as Toolset),
  );
  const toolsetsToEnable = new Set<Toolset>(
    toolsets.includes(ALL_TOOLSETS) ? TOOLSETS : validToolsets,
  );

  // Build the set of tools to register:
  // 1. Start with tools from enabled toolsets
  // 2. Add individual tools from --tools
  const toolsToRegister: McpTool[] = [];
  const registeredToolNames = new Set<string>();

  // Step 1: Add tools from enabled toolsets
  for (const toolset of toolsetsToEnable) {
    for (const tool of toolRegistry[toolset]) {
      if (!registeredToolNames.has(tool.name)) {
        toolsToRegister.push(tool);
        registeredToolNames.add(tool.name);
      }
    }
  }

  // Step 2: Add individual tools from --tools (can be from any toolset)
  for (const toolName of individualTools) {
    const tool = allToolsByName.get(toolName);
    if (tool && !registeredToolNames.has(toolName)) {
      toolsToRegister.push(tool);
      registeredToolNames.add(toolName);
    }
  }

  // Register all selected tools
  await registerTools(toolsToRegister, server, allowNonGaTools);
}

/**
 * Register a list of tools with the server.
 */
async function registerTools(
  tools: McpTool[],
  server: B2CDxMcpServer,
  allowNonGaTools: boolean,
): Promise<void> {
  for (const tool of tools) {
    // Skip non-GA tools if not allowed
    if (tool.isGA === false && !allowNonGaTools) {
      continue;
    }

    // Register the tool
    // TODO: Telemetry - Tool registration includes timing/error tracking
    server.addTool(
      tool.name,
      tool.description,
      tool.inputSchema,
      async (args) => tool.handler(args),
    );
  }
}
