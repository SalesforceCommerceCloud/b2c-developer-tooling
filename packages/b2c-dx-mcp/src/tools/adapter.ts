/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Tool Adapter for wrapping b2c-tooling-sdk functions as MCP tools.
 *
 * This module provides utilities for creating standardized MCP tools that:
 * - Validate input using Zod schemas
 * - Inject loaded B2CInstance for WebDAV/OCAPI operations (requiresInstance)
 * - Inject loaded MRT auth for MRT API operations (requiresMrtAuth)
 * - Format output consistently (textResult, jsonResult, errorResult)
 *
 * ## Configuration Resolution
 *
 * Both B2C instance and MRT auth are loaded before each tool call via
 * a loader function that calls {@link Services.fromResolvedConfig}:
 *
 * - **B2CInstance**: Loaded from flags + dw.json on each call. Available when `requiresInstance: true`.
 * - **MRT Auth**: Loaded from --api-key → MRT_API_KEY → ~/.mobify on each call. Available when `requiresMrtAuth: true`.
 *
 * This "load on each call" pattern provides:
 * - Fresh configuration on each tool invocation (picks up changes to config files)
 * - Consistent mental model (both loaded the same way)
 * - Tools can respond to configuration changes without server restart
 *
 * @module tools/adapter
 *
 * @example B2C Instance tool (WebDAV/OCAPI)
 * ```typescript
 * const myTool = createToolAdapter({
 *   name: 'my_tool',
 *   description: 'Does something useful',
 *   toolsets: ['CARTRIDGES'],
 *   requiresInstance: true,
 *   inputSchema: {
 *     cartridgeName: z.string().describe('Name of the cartridge'),
 *   },
 *   execute: async (args, { b2cInstance }) => {
 *     const result = await b2cInstance.webdav.get(`Cartridges/${args.cartridgeName}`);
 *     return result;
 *   },
 *   formatOutput: (output) => textResult(`Fetched: ${output}`),
 * }, services);
 * ```
 *
 * @example MRT tool (MRT API)
 * ```typescript
 * // Loader function that loads config and creates Services on each tool call
 * const loadServices = () => {
 *   const config = this.loadConfiguration();
 *   return Services.fromResolvedConfig(config);
 * };
 *
 * const mrtTool = createToolAdapter({
 *   name: 'mrt_bundle_push',
 *   description: 'Push bundle to MRT',
 *   toolsets: ['MRT'],
 *   requiresMrtAuth: true,
 *   inputSchema: {
 *     projectSlug: z.string().describe('MRT project slug'),
 *   },
 *   execute: async (args, { mrtConfig }) => {
 *     const result = await pushBundle({ projectSlug: args.projectSlug }, mrtConfig.auth);
 *     return result;
 *   },
 *   formatOutput: (output) => jsonResult(output),
 * }, loadServices);
 * ```
 */

import {z, type ZodRawShape, type ZodObject, type ZodType} from 'zod';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {McpTool, ToolResult, Toolset} from '../utils/index.js';
import type {Services, MrtConfig} from '../services.js';
import type {ServerContext} from '../server-context.js';
import {
  createProjectContextInputSchema,
  type DirectoryResolutionInfo,
  type ProjectContextInput,
  type ProjectContextKind,
  type ToolResolution,
} from './project-context.js';

/** Services loader enriched with registration-time project fallback provenance. */
export interface ServicesLoader {
  (projectContext?: ProjectContextInput): Promise<Services> | Services;
}

/**
 * Context provided to tool execute functions.
 * Contains the B2CInstance and/or MRT config based on tool requirements.
 */
export interface ToolExecutionContext {
  /**
   * B2CInstance configured with authentication from dw.json and flags.
   * Provides access to typed API clients (webdav, ocapi).
   * Only available when requiresInstance is true.
   */
  b2cInstance?: B2CInstance;

  /**
   * MRT configuration (auth, project, environment, origin).
   * Loaded before each tool call.
   * Only populated when requiresMrtAuth is true.
   */
  mrtConfig?: MrtConfig;

  /**
   * Services instance for file system access and other utilities.
   */
  services: Services;

  /**
   * Server-scoped persistent state (debug sessions, log watches, etc.).
   * Created once at server startup and shared across all tool invocations.
   */
  serverContext?: ServerContext;

  /** Compact resolution provenance that will be attached to this tool result. */
  resolution: ToolResolution;

  /** Record a specialized directory resolved by the tool. */
  setResolvedDirectory: (name: string, value: DirectoryResolutionInfo) => void;
}

/**
 * Options for creating a tool adapter.
 *
 * @template TInput - The validated input type (inferred from inputSchema)
 * @template TOutput - The output type from the execute function
 */
export interface ToolAdapterOptions<TInput, TOutput> {
  /** Tool name (used in MCP protocol) */
  name: string;

  /** Human-readable description */
  description: string;

  /** Zod schema for input validation */
  inputSchema: ZodRawShape;

  /** Toolsets this tool belongs to */
  toolsets: Toolset[];

  /** Whether this tool is GA (generally available). Defaults to true. */
  isGA?: boolean;

  /**
   * Whether this tool requires a B2CInstance.
   * Set to false for tools that don't need B2C instance connectivity (e.g., local scaffolding tools).
   * Defaults to false.
   */
  requiresInstance?: boolean;

  /**
   * Whether this tool requires MRT API authentication.
   * When true, creates an ApiKeyStrategy from MRT_API_KEY environment variable.
   * Defaults to false.
   */
  requiresMrtAuth?: boolean;

  /**
   * Whether this tool resolves configuration or files relative to a project.
   * Project-aware tools automatically expose a per-call `projectDirectory`
   * input and use it while loading Services.
   */
  usesProjectContext?: boolean;

  /**
   * Whether this tool selects project configuration without requiring a
   * B2CInstance or MRT auth object (for example config_inspect or SCAPI clients).
   * Adds projectDirectory, configPath, and instanceName to the public schema.
   */
  usesConfigurationContext?: boolean;

  /**
   * Execute function that performs the tool's operation.
   * Receives validated input and a context with B2CInstance and/or auth based on requirements.
   */
  execute: (args: TInput, context: ToolExecutionContext) => Promise<TOutput>;

  /**
   * Format function that converts the execute output to a ToolResult.
   * Use textResult(), jsonResult(), or errorResult() helpers.
   */
  formatOutput: (output: TOutput) => ToolResult;
}

/**
 * Creates a text-only success result.
 *
 * @param text - The text content to return
 * @returns A ToolResult with text content
 *
 * @example
 * ```typescript
 * return textResult('Operation completed successfully');
 * ```
 */
export function textResult(text: string): ToolResult {
  return {
    content: [{type: 'text', text}],
  };
}

/**
 * Creates an error result.
 *
 * @param message - The error message
 * @returns A ToolResult marked as an error
 *
 * @example
 * ```typescript
 * return errorResult('Failed to connect to instance');
 * ```
 */
export function errorResult(message: string): ToolResult {
  return {
    content: [{type: 'text', text: message}],
    isError: true,
  };
}

/**
 * Creates a JSON result with formatted output.
 *
 * @param data - The data to serialize as JSON
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns A ToolResult with JSON-formatted text content
 *
 * @example
 * ```typescript
 * return jsonResult({ status: 'success', items: ['a', 'b', 'c'] });
 * ```
 */
export function jsonResult(data: unknown, indent = 2): ToolResult {
  return {
    content: [{type: 'text', text: JSON.stringify(data, null, indent)}],
  };
}

/** Attach compact resolution provenance while preserving existing tool output. */
export function attachResolution(result: ToolResult, resolution: ToolResolution): ToolResult {
  let content = result.content;
  let structuredContent: Record<string, unknown> = {...result.structuredContent, resolution};

  if (content.length === 1 && content[0]?.type === 'text') {
    try {
      const parsed = JSON.parse(content[0].text) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const output = {...(parsed as Record<string, unknown>), resolution};
        content = [{...content[0], text: JSON.stringify(output, null, 2)}];
        structuredContent = {...output, ...result.structuredContent, resolution};
      }
    } catch {
      // Plain-text tools expose resolution through structuredContent only.
    }
  }

  return {...result, content, structuredContent};
}

/**
 * Formats Zod validation errors into a human-readable string.
 *
 * @param error - The Zod error object
 * @returns Formatted error message
 */
function formatZodErrors(error: z.ZodError): string {
  return error.errors.map((e) => `${e.path.join('.') || 'input'}: ${e.message}`).join('; ');
}

/**
 * Creates an MCP tool from a b2c-tooling function.
 *
 * This adapter provides:
 * - Input validation via Zod schemas
 * - B2CInstance creation from dw.json with environment variable overrides
 * - Consistent error handling
 * - Output formatting utilities
 *
 * @template TInput - The validated input type (inferred from inputSchema)
 * @template TOutput - The output type from the execute function
 * @param options - Tool adapter configuration
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns An McpTool ready for registration
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createToolAdapter, jsonResult, errorResult } from './adapter.js';
 *
 * const loadServices = () => {
 *   const config = this.loadConfiguration();
 *   return Services.fromResolvedConfig(config);
 * };
 *
 * const listCodeVersionsTool = createToolAdapter({
 *   name: 'code_version_list',
 *   description: 'List all code versions on the instance',
 *   toolsets: ['CARTRIDGES'],
 *   inputSchema: {},
 *   execute: async (_args, { b2cInstance }) => {
 *     const result = await b2cInstance.ocapi.GET('/code_versions', {});
 *     if (result.error) throw new Error(result.error.message);
 *     return result.data;
 *   },
 *   formatOutput: (data) => jsonResult(data),
 * }, loadServices);
 * ```
 */
export function createToolAdapter<TInput, TOutput>(
  options: ToolAdapterOptions<TInput, TOutput>,
  loadServices: ServicesLoader,
  serverContext?: ServerContext,
): McpTool {
  const {
    name,
    description,
    inputSchema,
    toolsets,
    isGA = true,
    requiresInstance = false,
    requiresMrtAuth = false,
    usesProjectContext = false,
    usesConfigurationContext = false,
    execute,
    formatOutput,
  } = options;

  const projectContextKind: ProjectContextKind | undefined =
    requiresInstance || requiresMrtAuth || usesConfigurationContext
      ? 'configuration'
      : usesProjectContext
        ? 'project'
        : undefined;
  const effectiveInputSchema = projectContextKind
    ? {
        ...createProjectContextInputSchema(projectContextKind),
        ...inputSchema,
      }
    : inputSchema;

  // Create Zod schema from inputSchema definition
  const zodSchema = z.object(effectiveInputSchema) as ZodObject<ZodRawShape, 'strip', ZodType, TInput>;

  return {
    name,
    description,
    inputSchema: effectiveInputSchema,
    toolsets,
    isGA,

    async handler(rawArgs: Record<string, unknown>): Promise<ToolResult> {
      // 1. Validate input with Zod
      const parseResult = zodSchema.safeParse(rawArgs);
      if (!parseResult.success) {
        return errorResult(`Invalid input: ${formatZodErrors(parseResult.error)}`);
      }
      const args = parseResult.data as TInput;
      let resolution: ToolResolution | undefined;

      try {
        // 2. Load Services to get fresh configuration (re-reads config files)
        const projectContext = projectContextKind ? (args as ProjectContextInput) : undefined;
        const services = await loadServices(projectContext);
        const executionResolution = services.getResolution();
        if (projectContextKind === 'project') {
          delete executionResolution.configuration;
        }
        resolution = projectContextKind ? executionResolution : undefined;

        // 3. Get B2CInstance if required (loaded on each call)
        let b2cInstance: B2CInstance | undefined;
        if (requiresInstance) {
          if (!services.b2cInstance) {
            return attachResolution(
              errorResult(
                'B2C instance error: Instance configuration required. Provide --server flag, set SFCC_SERVER environment variable, or configure dw.json',
              ),
              executionResolution,
            );
          }
          b2cInstance = services.b2cInstance;
        }

        // 4. Get MRT config if required (loaded on each call)
        let mrtConfig: ToolExecutionContext['mrtConfig'];
        if (requiresMrtAuth) {
          if (!services.mrtConfig.auth) {
            return attachResolution(
              errorResult(
                'MRT auth error: MRT API key required. Provide --api-key, set MRT_API_KEY environment variable, or configure ~/.mobify',
              ),
              executionResolution,
            );
          }
          mrtConfig = {
            auth: services.mrtConfig.auth,
            project: services.mrtConfig.project,
            environment: services.mrtConfig.environment,
            origin: services.mrtConfig.origin,
          };
        }

        // 5. Execute the operation
        const context: ToolExecutionContext = {
          b2cInstance,
          mrtConfig,
          services,
          serverContext,
          resolution: executionResolution,
          setResolvedDirectory(name, value) {
            executionResolution.directories ??= {};
            executionResolution.directories[name] = value;
          },
        };
        const output = await execute(args, context);

        // 6. Format output
        const result = formatOutput(output);
        return resolution ? attachResolution(result, executionResolution) : result;
      } catch (error) {
        // Handle execution errors
        const message = error instanceof Error ? error.message : String(error);
        const result = errorResult(`Execution error: ${message}`);
        return resolution ? attachResolution(result, resolution) : result;
      }
    },
  };
}
