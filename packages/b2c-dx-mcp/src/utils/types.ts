/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {CallToolResult} from '@modelcontextprotocol/server';
import type {z, ZodRawShape} from 'zod';
import type {Toolset} from './constants.js';

/**
 * Result returned from MCP tool execution.
 * Matches the MCP SDK's CallToolResult type.
 */
export type ToolResult = CallToolResult;

/** Effects of advertised operations; annotations are derived at registration. */
export interface ToolEffects {
  effect: 'destructive' | 'read' | 'write';
  /** Repeating the same arguments causes no additional effects, even if results differ. */
  idempotent: boolean;
  /** Interacts with external entities rather than only a bounded local domain. */
  openWorld: boolean;
}

/**
 * Configuration for an MCP tool.
 */
export interface McpToolConfig<T extends ZodRawShape = ZodRawShape> extends ToolEffects {
  /** Tool name (used in MCP protocol) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Optional display title and object-root result schema. */
  title?: string;
  outputSchema?: ZodRawShape;
  /** Zod schema for input validation */
  inputSchema: T;
  /** Toolsets this tool belongs to */
  toolsets: Toolset[];
  /** Whether this tool is GA (generally available) */
  isGA?: boolean;
}

/**
 * MCP Tool definition with handler.
 */
export interface McpTool<T extends ZodRawShape = ZodRawShape> extends McpToolConfig<T> {
  /** Handler function that executes the tool */
  handler: (args: z.infer<z.ZodObject<T>>) => Promise<ToolResult>;
}

/**
 * Startup flags passed to the MCP server.
 */
export interface StartupFlags {
  /** Comma-separated list of toolsets to enable */
  toolsets?: string[];
  /** Specific individual tools to enable */
  tools?: string[];
  /** Allow non-GA (experimental) tools */
  allowNonGaTools?: boolean;
  /** Path to config file (dw.json format) */
  configPath?: string;
  /** Default project directory for configuration and project operations. */
  projectDirectory?: string;
  /**
   * Comma-separated allowlist of documentation categories the docs tools may
   * expose (from `--docs-topics` / `SFCC_DOCS_TOPICS`). Bounds the whole docs
   * corpus at startup; unset means all categories.
   */
  docsTopics?: string;
}
