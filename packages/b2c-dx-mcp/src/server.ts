/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  CallToolResult,
  Implementation,
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import type {ServerOptions} from '@modelcontextprotocol/sdk/server/index.js';
import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {Transport} from '@modelcontextprotocol/sdk/shared/transport.js';
import type {ZodRawShape} from 'zod';
import type {Telemetry} from '@salesforce/b2c-tooling-sdk/telemetry';

/**
 * Extended server options.
 */
export interface B2CDxMcpServerOptions extends ServerOptions {
  /**
   * Telemetry instance for tracking server and tool events.
   * If not provided, telemetry is disabled.
   */
  telemetry?: Telemetry;
}

/**
 * A server implementation that extends the base MCP server.
 *
 * @augments {McpServer}
 */
export class B2CDxMcpServer extends McpServer {
  private telemetry?: Telemetry;

  /**
   * Creates a new B2CDxMcpServer instance
   *
   * @param serverInfo - The server implementation details
   * @param options - Optional server configuration
   */
  public constructor(serverInfo: Implementation, options?: B2CDxMcpServerOptions) {
    super(serverInfo, options);
    this.telemetry = options?.telemetry;

    // Set up oninitialized handler
    this.server.oninitialized = (): void => {
      const clientInfo = this.server.getClientVersion();
      if (clientInfo) {
        this.telemetry?.addAttributes({
          clientName: clientInfo.name,
          clientVersion: clientInfo.version,
        });
      }
    };
  }

  /**
   * Register a tool with the server.
   *
   * This method provides a convenient way to register tools.
   *
   * @param name - Tool name
   * @param description - Tool description
   * @param inputSchema - Zod schema for input validation
   * @param handler - Function to handle tool invocations
   */
  public addTool(
    name: string,
    description: string,
    inputSchema: ZodRawShape,
    handler: (args: Record<string, unknown>) => Promise<CallToolResult>,
  ): void {
    const wrappedHandler = async (
      args: Record<string, unknown>,
      _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    ): Promise<CallToolResult> => {
      const startTime = Date.now();
      try {
        const result = await handler(args);
        const runTimeMs = Date.now() - startTime;

        this.telemetry?.sendEvent('TOOL_CALLED', {
          toolName: name,
          runTimeMs,
          isError: result.isError ?? false,
        });

        // Flush telemetry after each tool call to ensure events are sent promptly
        // in long-running server processes (don't await to avoid blocking the response)
        this.telemetry?.flush().catch(() => {});

        return result;
      } catch (error) {
        const runTimeMs = Date.now() - startTime;

        this.telemetry?.sendEvent('TOOL_CALLED', {
          toolName: name,
          runTimeMs,
          isError: true,
        });

        // Flush telemetry on error as well
        this.telemetry?.flush().catch(() => {});

        throw error;
      }
    };

    // Use the new registerTool API (tool() is deprecated)
    this.registerTool(name, {description, inputSchema}, wrappedHandler);
  }

  /**
   * Connect to a transport.
   */
  public override async connect(transport: Transport): Promise<void> {
    try {
      await super.connect(transport);
      if (this.isConnected()) {
        this.telemetry?.sendEvent('SERVER_STATUS', {status: 'started'});
      } else {
        this.telemetry?.sendEvent('SERVER_STATUS', {
          status: 'error',
          errorMessage: 'Server not connected after connect() call',
        });
      }
    } catch (error) {
      this.telemetry?.sendEvent('SERVER_STATUS', {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
