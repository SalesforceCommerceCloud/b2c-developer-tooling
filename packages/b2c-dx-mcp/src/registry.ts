/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import {DOC_CATEGORIES, resolveEnabledCategories, type DocCategory} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool, Toolset, StartupFlags} from './utils/index.js';
import {ALL_TOOLSETS, TOOLSETS, VALID_TOOLSET_NAMES, toToolAnnotations} from './utils/index.js';
import type {B2CDxMcpServer} from './server.js';
import type {ServerContext} from './server-context.js';
import type {ServicesLoader} from './tools/adapter.js';
import {createCartridgesTools} from './tools/cartridges/index.js';
import {createDiagnosticsTools} from './tools/diagnostics/index.js';
import {createDocsTools} from './tools/docs/index.js';
import {createMrtTools} from './tools/mrt/index.js';
import {createScapiTools} from './tools/scapi/index.js';
import {createGuidanceTool, registerGuidanceResources} from './guidance.js';

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
export function createToolRegistry(
  loadServices: ServicesLoader,
  serverContext?: ServerContext,
  detectedWorkspaces: readonly ProjectType[] = [],
  enabledDocCategories?: readonly DocCategory[],
  allowNonGaTools = false,
): ToolRegistry {
  const registry: ToolRegistry = {
    CARTRIDGES: [],
    DIAGNOSTICS: [],
    MRT: [],
    PWAV3: [],
    SCAPI: [],
    STOREFRONTNEXT: [],
  };

  // Collect all tools from all factories
  const allTools: McpTool[] = [
    ...createCartridgesTools(loadServices),
    ...createDiagnosticsTools(loadServices, serverContext),
    ...createDocsTools(loadServices, {detectedWorkspaces, enabledCategories: enabledDocCategories}),
    ...createMrtTools(loadServices),
    ...createScapiTools(loadServices),
    createGuidanceTool(allowNonGaTools),
  ];

  // Organize tools by their declared toolsets (supports multi-toolset)
  for (const tool of allTools) {
    for (const toolset of tool.toolsets) {
      registry[toolset].push(tool);
    }
  }

  return registry;
}

// Guards against accidental double-registration. The MCP SDK throws on duplicate
// `addTool` names, but tracking servers we've already populated lets callers fail
// fast with an explicit message instead of a cryptic SDK error.
const REGISTERED_SERVERS = new WeakSet<B2CDxMcpServer>();

/** Register all toolsets by default, or only explicitly selected toolsets/tools. */
export async function registerToolsets(
  flags: StartupFlags,
  server: B2CDxMcpServer,
  loadServices: ServicesLoader,
  serverContext?: ServerContext,
): Promise<void> {
  if (REGISTERED_SERVERS.has(server)) {
    throw new Error('registerToolsets() was called more than once for the same server instance');
  }
  REGISTERED_SERVERS.add(server);
  const toolsets = flags.toolsets ?? [];
  const individualTools = flags.tools ?? [];
  const allowNonGaTools = flags.allowNonGaTools ?? false;
  const logger = getLogger();

  // Resolve the launch-time docs topic allowlist (bounds the whole docs corpus).
  const enabledDocCategories = resolveEnabledCategories(flags.docsTopics, (invalid) =>
    logger.warn(
      {invalidTopics: invalid, validTopics: DOC_CATEGORIES},
      `Ignoring unknown documentation topic(s) in --docs-topics: "${invalid.join('", "')}"`,
    ),
  );
  if (enabledDocCategories) {
    logger.info(
      {docsTopics: enabledDocCategories},
      `Documentation restricted to topics: ${enabledDocCategories.join(', ')}`,
    );
  }

  // Tool availability is independent of the workspace. Explicit selection customizes the default catalog.
  const toolRegistry = createToolRegistry(loadServices, serverContext, [], enabledDocCategories, allowNonGaTools);
  const existingToolNames = new Set(
    Object.values(toolRegistry)
      .flat()
      .map((tool) => tool.name),
  );

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

  // Determine which toolsets to enable. `ALL` expands to every toolset.
  const validToolsets = toolsets.filter((t): t is Toolset => TOOLSETS.includes(t as Toolset));
  const toolsetsToEnable = new Set<Toolset>(toolsets.includes(ALL_TOOLSETS) ? TOOLSETS : validToolsets);

  if (toolsetsToEnable.size === 0 && validIndividualTools.length === 0) {
    for (const toolset of TOOLSETS) toolsetsToEnable.add(toolset);
    logger.info('No valid tool selection provided; enabling all toolsets.');
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

  // Step 2: Add individual tools from --tools (can be from any toolset).
  // Individual tools can be selected without enabling their entire toolset.
  const allToolsByName = new Map(
    Object.values(toolRegistry)
      .flat()
      .map((tool) => [tool.name, tool]),
  );
  for (const toolName of validIndividualTools) {
    const tool = allToolsByName.get(toolName);
    if (tool && !registeredToolNames.has(toolName)) {
      toolsToRegister.push(tool);
      registeredToolNames.add(toolName);
    }
  }

  // Register all selected tools
  await registerTools(toolsToRegister, server, allowNonGaTools);
  registerGuidanceResources(server, allowNonGaTools, registeredToolNames.has('skills_read'));
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
    server.addTool(tool.name, tool.description, tool.inputSchema, async (args) => tool.handler(args), {
      title: tool.title,
      annotations: toToolAnnotations(tool),
      outputSchema: tool.outputSchema,
    });
  }
}
