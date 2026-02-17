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
    handler: (
      args: Record<string, unknown>,
      context: RequestHandlerExtra<ServerRequest, ServerNotification>,
    ) => Promise<CallToolResult>,
  ): void {
    const wrappedHandler = async (
      args: Record<string, unknown>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    ): Promise<CallToolResult> => {
      const startTime = Date.now();
      try {
        const result = await handler(args, extra);
        const runTimeMs = Date.now() - startTime;

        await this.telemetry
          ?.sendEventAndFlush('TOOL_CALLED', {
            toolName: name,
            runTimeMs,
            isError: result.isError ?? false,
          })
          .catch(() => {});

        return result;
      } catch (error) {
        const runTimeMs = Date.now() - startTime;

        await this.telemetry
          ?.sendEventAndFlush('TOOL_CALLED', {
            toolName: name,
            runTimeMs,
            isError: true,
          })
          .catch(() => {});

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
      const statusPromise = this.isConnected()
        ? this.telemetry?.sendEventAndFlush('SERVER_STATUS', {status: 'started'})
        : this.telemetry?.sendEventAndFlush('SERVER_STATUS', {
            status: 'error',
            errorMessage: 'Server not connected after connect() call',
          });
      await (statusPromise ?? Promise.resolve()).catch(() => {});
    } catch (error) {
      const errorPromise = this.telemetry?.sendEventAndFlush('SERVER_STATUS', {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      await (errorPromise ?? Promise.resolve()).catch(() => {});
      throw error;
    }
  }
}
