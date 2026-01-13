/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {detectWorkspaceType, type ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import type {McpTool, Toolset, StartupFlags} from './utils/index.js';
import {ALL_TOOLSETS, TOOLSETS, VALID_TOOLSET_NAMES} from './utils/index.js';
import type {B2CDxMcpServer} from './server.js';
import type {Services} from './services.js';
import {createCartridgesTools} from './tools/cartridges/index.js';
import {createMrtTools} from './tools/mrt/index.js';
import {createPwav3Tools} from './tools/pwav3/index.js';
import {createScapiTools} from './tools/scapi/index.js';
import {createStorefrontNextTools} from './tools/storefrontnext/index.js';

/**
 * Maps a single project type to its associated MCP toolsets.
 */
function getToolsetsForProjectType(projectType: ProjectType): Toolset[] {
  switch (projectType) {
    case 'custom-api': {
      return ['CARTRIDGES', 'SCAPI'];
    }
    case 'headless': {
      return ['SCAPI'];
    }
    case 'pwa-kit-v3': {
      return ['PWAV3', 'MRT', 'SCAPI'];
    }
    case 'sfra': {
      return ['CARTRIDGES', 'SCAPI'];
    }
    case 'storefront-next': {
      return ['STOREFRONTNEXT', 'MRT', 'SCAPI'];
    }
    default: {
      // Fallback: provide basic SCAPI tools
      return ['SCAPI'];
    }
  }
}

/**
 * Maps multiple detected project types to a union of MCP toolsets.
 *
 * Combines toolsets from all matched project types, enabling hybrid
 * project support (e.g., SFRA + Custom API gets both CARTRIDGES and SCAPI).
 *
 * @param projectTypes - Array of detected project types
 * @returns Union of all toolsets for the detected project types
 */
function getToolsetsForProjectTypes(projectTypes: ProjectType[]): Toolset[] {
  // Fallback to SCAPI when no project types detected
  if (projectTypes.length === 0) {
    return ['SCAPI'];
  }

  const toolsetSet = new Set<Toolset>();

  for (const projectType of projectTypes) {
    for (const toolset of getToolsetsForProjectType(projectType)) {
      toolsetSet.add(toolset);
    }
  }

  return [...toolsetSet];
}

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
 * 1. If neither --toolsets nor --tools are provided, perform auto-discovery
 * 2. Start with all tools from --toolsets (or auto-discovered toolsets)
 * 3. Add individual tools from --tools (can be from any toolset)
 *
 * Example:
 *   --toolsets STOREFRONTNEXT,MRT --tools cartridge_deploy
 *   This enables STOREFRONTNEXT and MRT toolsets, plus adds cartridge_deploy from CARTRIDGES.
 *
 * @param flags - Startup flags from CLI
 * @param server - B2CDxMcpServer instance
 * @param services - Services instance
 */
export async function registerToolsets(flags: StartupFlags, server: B2CDxMcpServer, services: Services): Promise<void> {
  let toolsets = flags.toolsets ?? [];
  const individualTools = flags.tools ?? [];
  const allowNonGaTools = flags.allowNonGaTools ?? false;
  const logger = getLogger();

  // Auto-discovery: When no --toolsets or --tools flags are provided,
  // detect project type and enable appropriate toolsets automatically.
  if (toolsets.length === 0 && individualTools.length === 0) {
    // Working directory from --working-directory flag or SFCC_WORKING_DIRECTORY env var
    const workingDirectory = flags.workingDirectory ?? process.cwd();

    // Warn if working directory wasn't explicitly configured
    if (!flags.workingDirectory) {
      logger.warn(
        {cwd: workingDirectory},
        'No --working-directory flag or SFCC_WORKING_DIRECTORY env var provided. ' +
          'MCP clients like Cursor and Claude Desktop often spawn servers from ~ instead of the project directory. ' +
          'Set --working-directory or SFCC_WORKING_DIRECTORY for reliable auto-discovery.',
      );
    }

    const detectionResult = await detectWorkspaceType(workingDirectory);

    // Map all detected project types to MCP toolsets (union)
    const mappedToolsets = getToolsetsForProjectTypes(detectionResult.projectTypes);

    logger.info(
      {
        projectTypes: detectionResult.projectTypes,
        matchedPatterns: detectionResult.matchedPatterns,
        enabledToolsets: mappedToolsets,
      },
      `Auto-discovered project types: ${detectionResult.projectTypes.join(', ') || 'none'}`,
    );

    toolsets = mappedToolsets;
  }

  // Create the tool registry (all available tools)
  const toolRegistry = createToolRegistry(services);

  // Build flat list of all tools for lookup
  const allTools = Object.values(toolRegistry).flat();
  const allToolsByName = new Map(allTools.map((tool) => [tool.name, tool]));
  const existingToolNames = new Set(allToolsByName.keys());

  // Warn about invalid --tools names (but continue with valid ones)
  const invalidTools = individualTools.filter((name) => !existingToolNames.has(name));
  if (invalidTools.length > 0) {
    logger.warn(
      {invalidTools, validTools: [...existingToolNames]},
      `Ignoring invalid tool name(s): "${invalidTools.join('", "')}"`,
    );
  }

  // Warn about invalid --toolsets names (but continue with valid ones)
  const invalidToolsets = toolsets.filter(
    (t) => !VALID_TOOLSET_NAMES.includes(t as (typeof VALID_TOOLSET_NAMES)[number]),
  );
  if (invalidToolsets.length > 0) {
    logger.warn(
      {invalidToolsets, validToolsets: VALID_TOOLSET_NAMES},
      `Ignoring invalid toolset(s): "${invalidToolsets.join('", "')}"`,
    );
  }

  // Determine which toolsets to enable
  const validToolsets = toolsets.filter((t): t is Toolset => TOOLSETS.includes(t as Toolset));
  const toolsetsToEnable = new Set<Toolset>(toolsets.includes(ALL_TOOLSETS) ? TOOLSETS : validToolsets);

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
async function registerTools(tools: McpTool[], server: B2CDxMcpServer, allowNonGaTools: boolean): Promise<void> {
  for (const tool of tools) {
    // Skip non-GA tools if not allowed
    if (tool.isGA === false && !allowNonGaTools) {
      continue;
    }

    // Register the tool
    // TODO: Telemetry - Tool registration includes timing/error tracking
    server.addTool(tool.name, tool.description, tool.inputSchema, async (args) => tool.handler(args));
  }
}
