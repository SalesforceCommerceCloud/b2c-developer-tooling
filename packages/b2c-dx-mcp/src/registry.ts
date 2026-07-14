/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import os from 'node:os';
import path from 'node:path';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {detectWorkspaceType, type ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import {DOC_CATEGORIES, resolveEnabledCategories, type DocCategory} from '@salesforce/b2c-tooling-sdk/docs';
import type {McpTool, Toolset, StartupFlags} from './utils/index.js';
import {ALL_TOOLSETS, DEPRECATED_TOOLSETS, TOOLSETS, VALID_TOOLSET_NAMES} from './utils/index.js';
import type {B2CDxMcpServer} from './server.js';
import type {Services} from './services.js';
import type {ServerContext} from './server-context.js';
import {createCartridgesTools} from './tools/cartridges/index.js';
import {createDiagnosticsTools} from './tools/diagnostics/index.js';
import {createDocsTools} from './tools/docs/index.js';
import {createMrtTools} from './tools/mrt/index.js';
import {createPwav3Tools} from './tools/pwav3/index.js';
import {createScapiTools} from './tools/scapi/index.js';
import {createStorefrontNextTools} from './tools/storefrontnext/index.js';

/**
 * Base toolsets that are always enabled regardless of detected project type.
 * - SCAPI: SCAPI discovery and custom API scaffolding tools.
 * - DIAGNOSTICS: script debugger, log inspection, and docs tools — useful in
 *   every project type, so they are always available.
 */
const BASE_TOOLSETS: Toolset[] = ['SCAPI', 'DIAGNOSTICS'];

/**
 * Toolset mapping by project type.
 * Each project type enables specific toolsets IN ADDITION to the base toolsets.
 */
const PROJECT_TYPE_TOOLSETS: Record<ProjectType, Toolset[]> = {
  cartridges: ['CARTRIDGES'],
  // SFRA is a cartridge project, so it enables the same toolset as `cartridges`.
  // (A SFRA workspace also matches the `cartridges` marker; the union dedupes.)
  sfra: ['CARTRIDGES'],
  'pwa-kit-v3': ['PWAV3', 'MRT'],
  // Note: STOREFRONTNEXT_DEPRECATED is intentionally NOT auto-activated. The
  // legacy sfnext_* tools are superseded by the storefront-next agent-skills
  // plugins and must be explicitly requested via --toolsets.
  'storefront-next': ['STOREFRONTNEXT', 'MRT', 'CARTRIDGES'],
};

/**
 * Gets toolsets for a project type, always including the base toolsets.
 */
function getToolsetsForProjectType(projectType: ProjectType): Toolset[] {
  const additionalToolsets = PROJECT_TYPE_TOOLSETS[projectType] ?? [];
  return [...additionalToolsets, ...BASE_TOOLSETS];
}

/**
 * Maps multiple detected project types to a union of MCP toolsets.
 *
 * Combines toolsets from all matched project types, enabling hybrid
 * project support (e.g., cartridges + pwa-kit-v3 gets CARTRIDGES + PWAV3 + MRT + SCAPI + DIAGNOSTICS).
 *
 * @param projectTypes - Array of detected project types
 * @returns Union of all toolsets for the detected project types (always includes base toolsets)
 */
function getToolsetsForProjectTypes(projectTypes: ProjectType[]): Toolset[] {
  const toolsetSet = new Set<Toolset>();

  // Always include base toolsets
  for (const base of BASE_TOOLSETS) {
    toolsetSet.add(base);
  }

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
export function createToolRegistry(
  loadServices: () => Promise<Services> | Services,
  serverContext?: ServerContext,
  detectedWorkspaces: readonly ProjectType[] = [],
  enabledDocCategories?: readonly DocCategory[],
): ToolRegistry {
  const registry: ToolRegistry = {
    CARTRIDGES: [],
    DIAGNOSTICS: [],
    MRT: [],
    PWAV3: [],
    SCAPI: [],
    STOREFRONTNEXT: [],
    STOREFRONTNEXT_DEPRECATED: [],
  };

  // Collect all tools from all factories
  const allTools: McpTool[] = [
    ...createCartridgesTools(loadServices),
    ...createDiagnosticsTools(loadServices, serverContext),
    ...createDocsTools(loadServices, {detectedWorkspaces, enabledCategories: enabledDocCategories}),
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
 * Maximum directory depth workspace auto-discovery recurses when scanning the
 * project directory. Bounding this is what keeps startup fast (and safe) when
 * the server is launched from a broad root: a full `**` walk of a home
 * directory can take many seconds and blocks the MCP handshake, since detection
 * runs before the server connects.
 *
 * Depth is counted in path segments relative to the project directory. 5 covers
 * the common layouts — a cartridge at `cartridges/<name>/.project` (depth 3) and
 * a monorepo cartridge at `packages/<app>/cartridges/<name>/.project` (depth 5) —
 * without descending into unrelated deep trees.
 */
const DISCOVERY_MAX_DEPTH = 5;

/**
 * Returns true when `dir` is a location that should never be recursively
 * scanned for a workspace: the user's home directory or a filesystem root.
 * These are the classic "MCP client spawned the server from ~" cases where an
 * unbounded (or even bounded) scan is both pointless and expensive.
 */
function isUnscannableRoot(dir: string): boolean {
  const resolved = path.resolve(dir);
  // Filesystem root: parent equals self (handles `/` and Windows drive roots).
  if (path.dirname(resolved) === resolved) {
    return true;
  }
  const home = os.homedir();
  return Boolean(home) && path.resolve(home) === resolved;
}

/**
 * Performs workspace auto-discovery and returns appropriate toolsets.
 * Always includes the BASE_TOOLSETS even if no project types are detected.
 *
 * The scan is depth-bounded ({@link DISCOVERY_MAX_DEPTH}) and skipped entirely
 * for home/root directories so it can never fan out across a whole home tree.
 *
 * @param flags - Startup flags containing projectDirectory
 * @returns Array of detected project types (empty if skipped or none found)
 */
async function detectProjectTypes(flags: StartupFlags): Promise<ProjectType[]> {
  const logger = getLogger();

  // Project directory from --project-directory flag or SFCC_PROJECT_DIRECTORY env
  // var, defaulting to cwd. We always attempt detection from cwd rather than
  // skipping it — the depth bound and home/root guard below make that safe.
  const projectDirectory = flags.projectDirectory ?? process.cwd();

  // Warn if project directory wasn't explicitly configured
  if (!flags.projectDirectory) {
    logger.warn(
      {cwd: projectDirectory},
      'No --project-directory flag or SFCC_PROJECT_DIRECTORY env var provided. ' +
        'MCP clients like Cursor and Claude Code often spawn servers from ~ instead of the project directory. ' +
        'Set --project-directory or SFCC_PROJECT_DIRECTORY for reliable auto-discovery.',
    );
  }

  // Never recursively scan a home directory or filesystem root — the scan would
  // be expensive and would not identify a meaningful workspace anyway.
  if (isUnscannableRoot(projectDirectory)) {
    logger.warn(
      {projectDirectory},
      'Project directory is a home or root directory; skipping workspace auto-discovery. ' +
        'Set --project-directory or SFCC_PROJECT_DIRECTORY to the project path to enable it.',
    );
    return [];
  }

  const detectionResult = await detectWorkspaceType(projectDirectory, {maxDepth: DISCOVERY_MAX_DEPTH});
  logger.info(
    {projectTypes: detectionResult.projectTypes, matchedPatterns: detectionResult.matchedPatterns},
    `Workspace detection: project types: ${detectionResult.projectTypes.join(', ') || 'none'}`,
  );
  return detectionResult.projectTypes;
}

/**
 * Register tools with the MCP server based on startup flags.
 *
 * Tool selection logic:
 * 1. If no valid tools result from --toolsets and --tools, perform auto-discovery
 * 2. Start with all tools from --toolsets (or auto-discovered toolsets)
 * 3. Add individual tools from --tools (can be from any toolset)
 *
 * Auto-discovery always enables at least the BASE_TOOLSETS (SCAPI + DIAGNOSTICS),
 * even if no project types are detected in the workspace.
 *
 * Example:
 *   --toolsets STOREFRONTNEXT,MRT --tools cartridge_deploy
 *   This enables STOREFRONTNEXT and MRT toolsets, plus adds cartridge_deploy from CARTRIDGES.
 *
 * @param flags - Startup flags from CLI
 * @param server - B2CDxMcpServer instance
 * @param loadServices - Function that loads configuration and returns Services instance
 */
// Guards against accidental double-registration. The MCP SDK throws on duplicate
// `addTool` names, but tracking servers we've already populated lets callers fail
// fast with an explicit message instead of a cryptic SDK error.
const REGISTERED_SERVERS = new WeakSet<B2CDxMcpServer>();

export async function registerToolsets(
  flags: StartupFlags,
  server: B2CDxMcpServer,
  loadServices: () => Promise<Services> | Services,
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

  // Build the tool registry to validate flag input. The set of available tools
  // (names, toolsets) does NOT depend on the detected workspace — only the docs
  // tool descriptions do — so we can resolve flag validity before deciding
  // whether workspace detection is even needed. If auto-discovery later runs,
  // we rebuild the registry with the detected workspaces so the docs tools pick
  // up the workspace hint.
  let toolRegistry = createToolRegistry(loadServices, serverContext, [], enabledDocCategories);
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

  // Determine which toolsets to enable.
  // `ALL` expands to every toolset EXCEPT deprecated ones — deprecated toolsets
  // must always be named explicitly.
  const validToolsets = toolsets.filter((t): t is Toolset => TOOLSETS.includes(t as Toolset));
  const allNonDeprecatedToolsets = TOOLSETS.filter(
    (t) => !DEPRECATED_TOOLSETS.includes(t as (typeof DEPRECATED_TOOLSETS)[number]),
  );
  const toolsetsToEnable = new Set<Toolset>(toolsets.includes(ALL_TOOLSETS) ? allNonDeprecatedToolsets : validToolsets);

  // Auto-discovery: only when no valid toolsets AND no valid individual tools
  // were provided. This handles both (1) no flags provided, and (2) all
  // provided flags are invalid. Skip workspace detection entirely otherwise —
  // when the user has explicitly chosen toolsets/tools, the filesystem scan
  // cannot change which tools are registered, so paying for it (and risking a
  // costly recursive walk) would be pointless.
  if (toolsetsToEnable.size === 0 && validIndividualTools.length === 0) {
    const detectedWorkspaces = await detectProjectTypes(flags);
    const discoveredToolsets = getToolsetsForProjectTypes(detectedWorkspaces);
    logger.info(
      {projectTypes: detectedWorkspaces, enabledToolsets: discoveredToolsets},
      `Auto-discovery: enabling toolsets ${discoveredToolsets.join(', ')}`,
    );
    for (const toolset of discoveredToolsets) {
      toolsetsToEnable.add(toolset);
    }
    // Rebuild so the docs tools reflect the detected workspace in their
    // descriptions and default workspace resolution.
    if (detectedWorkspaces.length > 0) {
      toolRegistry = createToolRegistry(loadServices, serverContext, detectedWorkspaces, enabledDocCategories);
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

  // Step 2: Add individual tools from --tools (can be from any toolset).
  // Look up against the final registry (which may have been rebuilt above).
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
