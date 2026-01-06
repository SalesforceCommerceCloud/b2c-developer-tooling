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
 * - Inject B2CInstance for WebDAV/OCAPI operations (requiresInstance)
 * - Inject pre-resolved MRT auth for MRT API operations (requiresMrtAuth)
 * - Format output consistently (textResult, jsonResult, errorResult)
 *
 * ## Auth Resolution
 *
 * MRT authentication is resolved once at server startup via {@link Services.create}
 * and reused for all tool calls. Tools receive the pre-resolved auth in their
 * execution context when `requiresMrtAuth: true`.
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
 * // Services created with auth resolved at startup
 * const services = Services.create({
 *   mrtApiKey: flags['mrt-api-key'],
 *   mrtCloudOrigin: flags['mrt-cloud-origin'],
 * });
 *
 * const mrtTool = createToolAdapter({
 *   name: 'mrt_bundle_push',
 *   description: 'Push bundle to MRT',
 *   toolsets: ['MRT'],
 *   requiresMrtAuth: true,
 *   inputSchema: {
 *     projectSlug: z.string().describe('MRT project slug'),
 *   },
 *   execute: async (args, { mrtAuth }) => {
 *     const result = await pushBundle({ projectSlug: args.projectSlug }, mrtAuth);
 *     return result;
 *   },
 *   formatOutput: (output) => jsonResult(output),
 * }, services);
 * ```
 */

import {z, type ZodRawShape, type ZodObject, type ZodType} from 'zod';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {McpTool, ToolResult, Toolset} from '../utils/index.js';
import type {Services} from '../services.js';

/**
 * Context provided to tool execute functions.
 * Contains the B2CInstance and/or auth strategy based on tool requirements.
 */
export interface ToolExecutionContext {
  /**
   * B2CInstance configured with authentication from dw.json and environment variables.
   * Provides access to typed API clients (webdav, ocapi).
   * Only available when requiresInstance is true.
   */
  b2cInstance?: B2CInstance;

  /**
   * Auth strategy for MRT API operations.
   * Pre-resolved at server startup from --mrt-api-key, SFCC_MRT_API_KEY,
   * or ~/.mobify config file.
   * Only available when requiresMrtAuth is true.
   */
  mrtAuth?: AuthStrategy;

  /**
   * Services instance for file system access and other utilities.
   */
  services: Services;
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
   * When true, creates an ApiKeyStrategy from SFCC_MRT_API_KEY environment variable.
   * Defaults to false.
   */
  requiresMrtAuth?: boolean;

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

/**
 * Gets a non-empty environment variable value, or undefined if empty/missing.
 */
function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : undefined;
}

/**
 * Resolves environment variable overrides for B2CInstance configuration.
 * Environment variables take precedence over dw.json values.
 * Empty strings are treated as undefined (fall back to dw.json).
 */
function getEnvironmentOverrides(): Record<string, string | undefined> {
  return {
    hostname: getEnv('SFCC_HOSTNAME'),
    username: getEnv('SFCC_USERNAME'),
    password: getEnv('SFCC_PASSWORD'),
    clientId: getEnv('SFCC_CLIENT_ID'),
    clientSecret: getEnv('SFCC_CLIENT_SECRET'),
    codeVersion: getEnv('SFCC_CODE_VERSION'),
  };
}

/**
 * Creates a B2CInstance from configuration with environment variable overrides.
 *
 * @param services - Services instance containing optional configPath
 * @returns Configured B2CInstance
 * @throws Error if configuration is missing or invalid
 */
function createInstance(services: Services): B2CInstance {
  const envOverrides = getEnvironmentOverrides();

  return B2CInstance.fromEnvironment({
    configPath: services.configPath,
    hostname: envOverrides.hostname,
    username: envOverrides.username,
    password: envOverrides.password,
    clientId: envOverrides.clientId,
    clientSecret: envOverrides.clientSecret,
    codeVersion: envOverrides.codeVersion,
  });
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
 * @param services - Services instance for dependency injection
 * @returns An McpTool ready for registration
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createToolAdapter, jsonResult, errorResult } from './adapter.js';
 *
 * const listCodeVersionsTool = createToolAdapter({
 *   name: 'code_version_list',
 *   description: 'List all code versions on the instance',
 *   toolsets: ['CARTRIDGES'],
 *   inputSchema: {},
 *   execute: async (_args, { instance }) => {
 *     const result = await instance.ocapi.GET('/code_versions', {});
 *     if (result.error) throw new Error(result.error.message);
 *     return result.data;
 *   },
 *   formatOutput: (data) => jsonResult(data),
 * }, services);
 * ```
 */
export function createToolAdapter<TInput, TOutput>(
  options: ToolAdapterOptions<TInput, TOutput>,
  services: Services,
): McpTool {
  const {
    name,
    description,
    inputSchema,
    toolsets,
    isGA = true,
    requiresInstance = false,
    requiresMrtAuth = false,
    execute,
    formatOutput,
  } = options;

  // Create Zod schema from inputSchema definition
  const zodSchema = z.object(inputSchema) as ZodObject<ZodRawShape, 'strip', ZodType, TInput>;

  return {
    name,
    description,
    inputSchema,
    toolsets,
    isGA,

    async handler(rawArgs: Record<string, unknown>): Promise<ToolResult> {
      // 1. Validate input with Zod
      const parseResult = zodSchema.safeParse(rawArgs);
      if (!parseResult.success) {
        return errorResult(`Invalid input: ${formatZodErrors(parseResult.error)}`);
      }
      const args = parseResult.data as TInput;

      try {
        // 2. Create B2CInstance if required (for WebDAV/OCAPI operations)
        let b2cInstance: B2CInstance | undefined;
        if (requiresInstance) {
          try {
            b2cInstance = createInstance(services);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return errorResult(`Configuration error: ${message}`);
          }
        }

        // 3. Get MRT auth if required (pre-resolved at startup)
        let mrtAuth: AuthStrategy | undefined;
        if (requiresMrtAuth) {
          if (!services.mrtAuth) {
            return errorResult(
              'MRT auth error: MRT API key required. Provide --mrt-api-key, set SFCC_MRT_API_KEY environment variable, or configure ~/.mobify',
            );
          }
          mrtAuth = services.mrtAuth;
        }

        // 4. Execute the operation
        const context: ToolExecutionContext = {
          b2cInstance,
          mrtAuth,
          services,
        };
        const output = await execute(args, context);

        // 5. Format output
        return formatOutput(output);
      } catch (error) {
        // Handle execution errors
        const message = error instanceof Error ? error.message : String(error);
        return errorResult(`Execution error: ${message}`);
      }
    },
  };
}
