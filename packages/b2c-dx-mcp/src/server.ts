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

/**
 * Extended server options.
 */
export type B2CDxMcpServerOptions = ServerOptions;

/**
 * A server implementation that extends the base MCP server.
 *
 *
 * @augments {McpServer}
 */
export class B2CDxMcpServer extends McpServer {
  /**
   * Creates a new B2CDxMcpServer instance
   *
   * @param serverInfo - The server implementation details
   * @param options - Optional server configuration
   */
  public constructor(serverInfo: Implementation, options?: B2CDxMcpServerOptions) {
    super(serverInfo, options);

    // Set up oninitialized handler
    this.server.oninitialized = (): void => {
      const clientInfo = this.server.getClientVersion();
      if (clientInfo) {
        // TODO: Telemetry - Add client info attributes
        // telemetry.addAttributes({ clientName: clientInfo.name, clientVersion: clientInfo.version });
      }
      // TODO: Telemetry - Send SERVER_START_SUCCESS event
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
    inputSchema: Record<string, unknown>,
    handler: (args: Record<string, unknown>) => Promise<CallToolResult>,
  ): void {
    const wrappedHandler = async (
      args: Record<string, unknown>,
      _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    ): Promise<CallToolResult> => {
      const startTime = Date.now();
      const result = await handler(args);
      // TODO: Telemetry - Send TOOL_CALLED event with { name, _runtimeMs, isError: result.isError }
      // @ts-expect-error Ignore unused variable
      const _runtimeMs = Date.now() - startTime;

      return result;
    };

    // Use the base server.tool method which handles the registration
    this.tool(name, description, inputSchema, wrappedHandler);
  }

  /**
   * Connect to a transport.
   */
  public override async connect(transport: Transport): Promise<void> {
    await super.connect(transport);
    if (!this.isConnected()) {
      // TODO: Telemetry - Send SERVER_START_ERROR event with "Server not connected"
    }
    // TODO: Telemetry - wrap with try/catch to send SERVER_START_ERROR event with error details
  }
}
