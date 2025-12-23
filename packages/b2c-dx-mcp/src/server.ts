/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  Implementation,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

/**
 * Extended server options.
 */
export type B2CDxMcpServerOptions = ServerOptions;

/**
 * A server implementation that extends the base MCP server.
 *
 *
 * @extends {McpServer}
 */
export class B2CDxMcpServer extends McpServer {
  /**
   * Creates a new B2CDxMcpServer instance
   *
   * @param serverInfo - The server implementation details
   * @param options - Optional server configuration
   */
  public constructor(
    serverInfo: Implementation,
    options?: B2CDxMcpServerOptions,
  ) {
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
   * Connect to a transport.
   */
  public override async connect(transport: Transport): Promise<void> {
    await super.connect(transport);
    if (!this.isConnected()) {
      // TODO: Telemetry - Send SERVER_START_ERROR event with "Server not connected"
    }
    // TODO: Telemetry - wrap with try/catch to send SERVER_START_ERROR event with error details
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
      const runtimeMs = Date.now() - startTime;

      // TODO: Telemetry - Send TOOL_CALLED event with { name, runtimeMs, isError: result.isError }
      void runtimeMs; // Silence unused variable warning until telemetry is implemented

      return result;
    };

    // Use the base server.tool method which handles the registration
    this.tool(name, description, inputSchema, wrappedHandler);
  }
}
