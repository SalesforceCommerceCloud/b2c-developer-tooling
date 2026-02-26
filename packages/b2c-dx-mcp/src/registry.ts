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
 * Base toolset that is always enabled.
 * Provides SCAPI discovery and custom API scaffolding tools.
 */
const BASE_TOOLSET: Toolset = 'SCAPI';

/**
 * Toolset mapping by project type.
 * Each project type enables specific toolsets IN ADDITION to the base toolset.
 */
const PROJECT_TYPE_TOOLSETS: Record<ProjectType, Toolset[]> = {
  cartridges: ['CARTRIDGES'],
  'pwa-kit-v3': ['PWAV3', 'MRT'],
  'storefront-next': ['STOREFRONTNEXT', 'MRT', 'CARTRIDGES'],
};

/**
 * Gets toolsets for a project type, always including the base toolset.
 */
function getToolsetsForProjectType(projectType: ProjectType): Toolset[] {
  const additionalToolsets = PROJECT_TYPE_TOOLSETS[projectType] ?? [];
  return [...additionalToolsets, BASE_TOOLSET];
}

/**
 * Maps multiple detected project types to a union of MCP toolsets.
 *
 * Combines toolsets from all matched project types, enabling hybrid
 * project support (e.g., cartridges + pwa-kit-v3 gets CARTRIDGES + PWAV3 + MRT + SCAPI).
 *
 * @param projectTypes - Array of detected project types
 * @returns Union of all toolsets for the detected project types (always includes base toolset)
 */
function getToolsetsForProjectTypes(projectTypes: ProjectType[]): Toolset[] {
  const toolsetSet = new Set<Toolset>();

  // Always include base toolset
  toolsetSet.add(BASE_TOOLSET);

  // Add toolsets for each detected project type
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
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns Complete tool registry
 */
export function createToolRegistry(loadServices: () => Services): ToolRegistry {
  const registry: ToolRegistry = {
    CARTRIDGES: [],
    MRT: [],
    PWAV3: [],
    SCAPI: [],
    STOREFRONTNEXT: [],
  };

  // Collect all tools from all factories
  const allTools: McpTool[] = [
    ...createCartridgesTools(loadServices),
    ...createMrtTools(loadServices),
    ...createPwav3Tools(loadServices),
    ...createScapiTools(loadServices),
    ...createStorefrontNextTools(loadServices),
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
 * Performs workspace auto-discovery and returns appropriate toolsets.
 * Always includes BASE_TOOLSET even if no project types are detected.
 *
 * @param flags - Startup flags containing projectDirectory
 * @param reason - Reason for triggering auto-discovery (for logging)
 * @returns Array of toolsets to enable
 */
async function performAutoDiscovery(flags: StartupFlags, reason: string): Promise<Toolset[]> {
  const logger = getLogger();

  // Project directory from --project-directory flag or SFCC_PROJECT_DIRECTORY env var
  const projectDirectory = flags.projectDirectory ?? process.cwd();

  // Warn if project directory wasn't explicitly configured
  if (!flags.projectDirectory) {
    logger.warn(
      {cwd: projectDirectory},
      'No --project-directory flag or SFCC_PROJECT_DIRECTORY env var provided. ' +
        'MCP clients like Cursor and Claude Desktop often spawn servers from ~ instead of the project directory. ' +
        'Set --project-directory or SFCC_PROJECT_DIRECTORY for reliable auto-discovery.',
    );
  }

  const detectionResult = await detectWorkspaceType(projectDirectory);

  // Map all detected project types to MCP toolsets (union)
  // Note: getToolsetsForProjectTypes always includes BASE_TOOLSET
  const mappedToolsets = getToolsetsForProjectTypes(detectionResult.projectTypes);

  logger.info(
    {
      reason,
      projectTypes: detectionResult.projectTypes,
      matchedPatterns: detectionResult.matchedPatterns,
      enabledToolsets: mappedToolsets,
    },
    `Auto-discovery (${reason}): project types: ${detectionResult.projectTypes.join(', ') || 'none'}`,
  );

  return mappedToolsets;
}

/**
 * Register tools with the MCP server based on startup flags.
 *
 * Tool selection logic:
 * 1. If no valid tools result from --toolsets and --tools, perform auto-discovery
 * 2. Start with all tools from --toolsets (or auto-discovered toolsets)
 * 3. Add individual tools from --tools (can be from any toolset)
 *
 * Auto-discovery always enables at least the BASE_TOOLSET (SCAPI), even if no
 * project types are detected in the workspace.
 *
 * Example:
 *   --toolsets STOREFRONTNEXT,MRT --tools cartridge_deploy
 *   This enables STOREFRONTNEXT and MRT toolsets, plus adds cartridge_deploy from CARTRIDGES.
 *
 * @param flags - Startup flags from CLI
 * @param server - B2CDxMcpServer instance
 * @param loadServices - Function that loads configuration and returns Services instance
 */
export async function registerToolsets(
  flags: StartupFlags,
  server: B2CDxMcpServer,
  loadServices: () => Services,
): Promise<void> {
  const toolsets = flags.toolsets ?? [];
  const individualTools = flags.tools ?? [];
  const allowNonGaTools = flags.allowNonGaTools ?? false;
  const logger = getLogger();

  // Create the tool registry (all available tools)
  const toolRegistry = createToolRegistry(loadServices);

  // Build flat list of all tools for lookup
  const allTools = Object.values(toolRegistry).flat();
  const allToolsByName = new Map(allTools.map((tool) => [tool.name, tool]));
  const existingToolNames = new Set(allToolsByName.keys());

  // Determine valid individual tools
  const invalidTools = individualTools.filter((name) => !existingToolNames.has(name));
  const validIndividualTools = individualTools.filter((name) => existingToolNames.has(name));

  // Warn about invalid --tools names (but continue with valid ones)
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

  // Auto-discovery: If no valid toolsets AND no valid individual tools, detect workspace type.
  // This handles both: (1) no flags provided, and (2) all provided flags are invalid.
  // Auto-discovery enables appropriate toolsets based on workspace type,
  // or at minimum BASE_TOOLSET if no project types are detected.
  if (toolsetsToEnable.size === 0 && validIndividualTools.length === 0) {
    const discoveredToolsets = await performAutoDiscovery(flags, 'no valid toolsets or tools');
    for (const toolset of discoveredToolsets) {
      toolsetsToEnable.add(toolset);
    }
  }

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
  for (const toolName of validIndividualTools) {
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
    // Register the tool (invocations are tracked by B2CDxMcpServer)
    server.addTool(tool.name, tool.description, tool.inputSchema, async (args) => tool.handler(args));
  }
}
