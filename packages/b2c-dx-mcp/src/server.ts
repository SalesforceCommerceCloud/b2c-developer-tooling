/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {
  McpServer,
  ProtocolError,
  ProtocolErrorCode,
  CLIENT_INFO_META_KEY,
  PROTOCOL_VERSION_META_KEY,
  CLIENT_CAPABILITIES_META_KEY,
} from '@modelcontextprotocol/server';
import type {
  CallToolResult,
  Implementation,
  ReadResourceResult,
  ToolAnnotations,
  ServerOptions,
  Transport,
  ServerContext,
  ClientCapabilities,
} from '@modelcontextprotocol/server';

import {z, type ZodRawShape} from 'zod';
import type {Telemetry} from '@salesforce/b2c-tooling-sdk/telemetry';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {redactAccessTokens} from '@salesforce/b2c-tooling-sdk/clients';
import {BrowserLoginContinuations} from './utils/browser-login.js';
import {ProjectDirectoryGate} from './utils/project-directory-gate.js';
import type {ContentRead, McpToolConfig, ToolContext} from './utils/types.js';

/** MCP skills extension identifier (SEP-2640). */
export const SKILLS_EXTENSION = 'io.modelcontextprotocol/skills';

/**
 * Agent ids, matching environment agent detection, for MCP clients that name
 * themselves in `clientInfo`. Keys are lowercase. Clients spawned with no
 * agent environment markers (Codex, for one) are only identifiable this way.
 */
const CLIENT_AGENTS: Record<string, string> = {
  'claude-code': 'claude-code',
  'codex-mcp-client': 'codex',
  'copilot-cli': 'copilot-cli',
  cursor: 'cursor-agent',
  'cursor-vscode': 'cursor-agent',
  'gemini-cli-mcp-client': 'gemini-cli',
  opencode: 'opencode',
  pi: 'pi',
  'q dev cli': 'amazon-q',
  'visual studio code': 'vscode-copilot-agent',
};

/** Telemetry instances that already sent CLIENT_CONNECTED; stdio may build more than one server per process. */
const reportedClients = new WeakSet<Telemetry>();

/**
 * Extended server options.
 */
export interface B2CDxMcpServerOptions extends ServerOptions {
  /** Release debugger sessions and log watches owned by this server instance. */
  cleanup?: () => Promise<void>;
  /** Configured `--project-directory`; bounds the per-call `projectDirectory` argument with client roots. */
  projectDirectory?: string;
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
  private readonly browserLogins = new BrowserLoginContinuations();
  private readonly cleanup?: () => Promise<void>;
  private clientLogged = false;
  private closePromise?: Promise<void>;
  /** The 2025-era client's `roots/list` result, refreshed when the client reports a change. */
  private legacyRoots?: Promise<unknown>;
  private readonly projectDirectories: ProjectDirectoryGate;
  private readonly resourceReaders = new Map<string, (uri: string) => Promise<ReadResourceResult>>();
  private telemetry?: Telemetry;

  /**
   * Creates a new B2CDxMcpServer instance
   *
   * @param serverInfo - The server implementation details
   * @param options - Optional server configuration
   */
  public constructor(serverInfo: Implementation, options?: B2CDxMcpServerOptions) {
    const {cleanup, projectDirectory, telemetry, ...serverOptions} = options ?? {};
    // The bundled SDK patch supports zero for human-paced approval with no server deadline.
    super(serverInfo, {
      ...serverOptions,
      inputRequired: {maxRounds: 20, roundTimeoutMs: 0, ...serverOptions.inputRequired},
    });
    this.cleanup = cleanup;
    this.telemetry = telemetry;
    this.projectDirectories = new ProjectDirectoryGate(projectDirectory);

    // Set up oninitialized handler
    this.server.oninitialized = (): void => {
      this.recordClient(this.server.getClientVersion());
      // Prime roots so the first call that passes projectDirectory does not wait on them.
      if (this.server.getClientCapabilities()?.roots) this.fetchLegacyRoots();
    };
    this.server.setNotificationHandler('notifications/roots/list_changed', () => {
      this.legacyRoots = undefined;
    });
  }

  /** Register after resource metadata. Resolve raw URIs before URL dot-segment normalization. */
  public addResourceReader(prefix: string, read: (uri: string) => Promise<ReadResourceResult>): void {
    this.resourceReaders.set(prefix, read);
    this.server.setRequestHandler('resources/read', async (request, context) => {
      this.recordRequestClient(context);
      const uri = request.params.uri;
      for (const [registeredPrefix, reader] of this.resourceReaders) {
        if (uri.startsWith(registeredPrefix)) return reader(uri);
      }
      throw new ProtocolError(ProtocolErrorCode.InvalidParams, 'Resource URI is not available.');
    });
  }

  /**
   * Serve the MCP skills extension (SEP-2640): `skills/list` and `skills/get`.
   * Register before connecting. `get` throws a ProtocolError for unknown skills.
   */
  public addSkillsExtension(skills: {list: () => unknown[]; get: (uri: string) => unknown}): void {
    this.server.registerCapabilities({extensions: {[SKILLS_EXTENSION]: {}}});
    this.server.setRequestHandler(
      'skills/list',
      {params: z.object({cursor: z.string().optional()}).loose().optional()},
      async (params, context) => {
        this.recordRequestClient(context);
        // One page: an issued cursor never exists, so any cursor is invalid.
        if (params?.cursor !== undefined) throw new ProtocolError(ProtocolErrorCode.InvalidParams, 'Invalid cursor.');
        const modern = Boolean(
          (context.mcpReq?.envelope as Record<string, unknown> | undefined)?.[PROTOCOL_VERSION_META_KEY],
        );
        return {skills: skills.list(), ...(modern && {ttlMs: 300_000, cacheScope: 'private'})};
      },
    );
    this.server.setRequestHandler(
      'skills/get',
      {params: z.object({uri: z.string()}).loose()},
      async (params, context) => {
        this.recordRequestClient(context);
        return {skill: skills.get(params.uri)};
      },
    );
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
    handler: (args: Record<string, unknown>, context?: ToolContext) => Promise<CallToolResult>,
    metadata: Pick<McpToolConfig, 'outputSchema' | 'title'> & {annotations?: ToolAnnotations} = {},
  ): void {
    const wrappedHandler = async (args: Record<string, unknown>, context: ServerContext): Promise<CallToolResult> => {
      this.recordRequestClient(context);
      const startTime = Date.now();
      try {
        const envelope = context.mcpReq?.envelope as
          | undefined
          | {[CLIENT_CAPABILITIES_META_KEY]?: ClientCapabilities; [PROTOCOL_VERSION_META_KEY]?: string};
        const capabilities = envelope?.[CLIENT_CAPABILITIES_META_KEY] ?? this.server.getClientCapabilities();
        const elicitation = capabilities?.elicitation;
        const contentReads: ContentRead[] = [];
        let toolContext: ToolContext = {
          signal: context.mcpReq?.signal,
          requestState: context.mcpReq?.requestState?.(),
          inputResponses: context.mcpReq?.inputResponses,
          supportsElicitation:
            elicitation !== undefined && (elicitation.form !== undefined || Object.keys(elicitation).length === 0),
          keepCancellation: !envelope?.[PROTOCOL_VERSION_META_KEY],
          recordContentRead: (read) => contentReads.push(read),
        };
        if (typeof args.projectDirectory === 'string') {
          const decision = await this.projectDirectories.check(args.projectDirectory, toolContext, {
            declared: capabilities?.roots !== undefined,
            fetch: envelope?.[PROTOCOL_VERSION_META_KEY] ? undefined : () => this.fetchLegacyRoots(),
          });
          if (!decision.ok) return decision.result;
          toolContext = decision.context;
        }
        // A retry after a browser login resumes the original call instead of running the handler again.
        const result = this.browserLogins.isContinuation(toolContext.requestState)
          ? await this.browserLogins.resume(toolContext.requestState, toolContext.inputResponses, toolContext.signal)
          : await this.browserLogins.run(elicitation?.url !== undefined, () => handler(args, toolContext));
        const runTimeMs = Date.now() - startTime;

        // Extract error message from CallToolResult content when isError is true
        const errorMessage = result.isError ? result.content?.find((c) => c.type === 'text')?.text : undefined;
        if (!result.isError) {
          for (const read of contentReads) this.telemetry?.sendEvent('CONTENT_READ', {...read, via: name});
        }

        await this.telemetry
          ?.sendEventAndFlush('TOOL_CALLED', {
            toolName: name,
            runTimeMs,
            isError: result.isError ?? false,
            ...(errorMessage ? {errorMessage} : {}),
          })
          .catch((error_: unknown) => {
            getLogger().debug({err: error_, toolName: name}, '[mcp] telemetry sendEventAndFlush failed');
          });

        return result;
      } catch (error) {
        const runTimeMs = Date.now() - startTime;

        await this.telemetry
          ?.sendEventAndFlush('TOOL_CALLED', {
            toolName: name,
            runTimeMs,
            isError: true,
            errorMessage: redactAccessTokens(error instanceof Error ? error.message : String(error)),
            ...(error instanceof Error && error.cause ? {errorCause: redactAccessTokens(String(error.cause))} : {}),
          })
          .catch((error_: unknown) => {
            getLogger().debug({err: error_, toolName: name}, '[mcp] telemetry sendEventAndFlush failed');
          });

        throw error;
      }
    };

    // Use the new registerTool API (tool() is deprecated)
    this.registerTool(
      name,
      {
        description,
        inputSchema: z.object(inputSchema).strict(),
        ...metadata,
        outputSchema: metadata.outputSchema ? z.object(metadata.outputSchema) : undefined,
      },
      wrappedHandler,
    );
  }

  public override close(): Promise<void> {
    this.closePromise ??= (async () => {
      try {
        await this.cleanup?.();
      } finally {
        await super.close();
      }
    })();
    return this.closePromise;
  }

  /**
   * Connect to a transport.
   */
  public override async connect(transport: Transport): Promise<void> {
    try {
      if (this.isConnected()) throw new Error('Already connected to a transport. Create a new server instance.');
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

  /**
   * Record skill or doc content returned outside a tool call. `via` names the
   * avenue (`resources/read`, `skills/get`) so dashboards can compare them.
   */
  public recordContentRead(via: string, read: ContentRead): void {
    this.telemetry?.sendEventAndFlush('CONTENT_READ', {...read, via}).catch((error: unknown) => {
      getLogger().debug({err: error, via}, '[mcp] telemetry sendEventAndFlush failed');
    });
  }

  /**
   * Request `roots/list` from a 2025-era client, once per change. Some clients
   * send bare paths where the spec requires `file://` URIs, so the result is
   * parsed leniently rather than with the SDK's strict schema.
   */
  private fetchLegacyRoots(): Promise<unknown> {
    this.legacyRoots ??= this.server
      .request({method: 'roots/list'}, z.object({roots: z.array(z.looseObject({uri: z.string()}))}).loose())
      .catch((error: unknown) => {
        getLogger().debug({err: error}, '[mcp] roots/list failed');
        return null;
      });
    return this.legacyRoots;
  }

  /**
   * Record the client's identity once it is known, from `initialize` (legacy
   * protocol) or any request envelope (modern protocol). Every later event
   * carries the client name, and the first identification per process sends
   * CLIENT_CONNECTED, so sessions that never call a tool still report which
   * client and agent started them.
   */
  private recordClient(clientInfo?: Implementation, protocolVersion?: string): void {
    const protocolEra = protocolVersion ? 'modern' : 'legacy';
    if (!this.clientLogged) {
      getLogger().debug(
        {protocolEra, protocolVersion, clientName: clientInfo?.name, clientVersion: clientInfo?.version},
        'MCP client connected',
      );
      this.clientLogged = true;
    }
    const {telemetry} = this;
    if (!clientInfo?.name || !telemetry) return;
    telemetry.addAttributes({clientName: clientInfo.name, clientVersion: clientInfo.version});
    if (reportedClients.has(telemetry)) return;
    reportedClients.add(telemetry);
    const agent = CLIENT_AGENTS[clientInfo.name.toLowerCase()];
    if (agent) telemetry.setAgentFallback(agent);
    telemetry
      .sendEventAndFlush('CLIENT_CONNECTED', {protocolEra, ...(protocolVersion && {protocolVersion})})
      .catch((error_) => getLogger().debug({err: error_}, '[mcp] telemetry sendEventAndFlush failed'));
  }

  private recordRequestClient(context: ServerContext): void {
    const envelope = context.mcpReq?.envelope as
      | undefined
      | {
          [CLIENT_INFO_META_KEY]?: Implementation;
          [PROTOCOL_VERSION_META_KEY]?: string;
        };
    if (envelope) this.recordClient(envelope[CLIENT_INFO_META_KEY], envelope[PROTOCOL_VERSION_META_KEY]);
  }
}
