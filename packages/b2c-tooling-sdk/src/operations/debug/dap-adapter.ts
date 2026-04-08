/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * DAP (Debug Adapter Protocol) adapter for B2C Commerce Script Debugger.
 *
 * Extends `@vscode/debugadapter`'s LoggingDebugSession and maps DAP requests
 * to SDAPI operations. Works over stdio (CLI) or inline (VSCode extension).
 *
 * @module operations/debug/dap-adapter
 */
import {
  LoggingDebugSession,
  InitializedEvent,
  StoppedEvent,
  TerminatedEvent,
  ThreadEvent,
  OutputEvent,
  Thread,
  StackFrame as DAPStackFrame,
  Scope,
  Variable,
  Breakpoint as DAPBreakpoint,
  Source,
} from '@vscode/debugadapter';
import type {DebugProtocol} from '@vscode/debugprotocol';

import {DebugSessionManager} from './debug-session.js';
import {SdapiError} from './sdapi-client.js';
import {createSourceMapper, type SourceMapper} from './source-mapping.js';
import {VariableStore} from './variable-store.js';
import type {
  BreakpointInput,
  DebugSessionCallbacks,
  DebugSessionConfig,
  SdapiObjectMember,
  SdapiScriptThread,
} from './types.js';

/** Frame IDs encode threadId and frameIndex: threadId * 10000 + frameIndex */
const FRAME_ID_MULTIPLIER = 10000;

function encodeFrameId(threadId: number, frameIndex: number): number {
  return threadId * FRAME_ID_MULTIPLIER + frameIndex;
}

function decodeFrameId(frameId: number): {threadId: number; frameIndex: number} {
  return {
    threadId: Math.floor(frameId / FRAME_ID_MULTIPLIER),
    frameIndex: frameId % FRAME_ID_MULTIPLIER,
  };
}

/**
 * Primitive SDAPI types that should not get a variablesReference for expansion.
 */
const PRIMITIVE_TYPES = new Set(['string', 'number', 'boolean', 'undefined', 'null', 'String', 'Number', 'Boolean']);

/**
 * Launch request arguments (received via launch.json or CLI config).
 */
interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  hostname?: string;
  username?: string;
  password?: string;
  clientId?: string;
  cartridgePath?: string;
  pollInterval?: number;
  keepaliveInterval?: number;
}

/**
 * B2C Script Debug Adapter.
 *
 * Can be used in two modes:
 * 1. **Pre-configured**: Pass a `DebugSessionConfig` to the constructor (for inline VSCode use)
 * 2. **Launch-configured**: Config comes from DAP launch request arguments (for CLI stdio use)
 */
export class B2CScriptDebugAdapter extends LoggingDebugSession {
  private session?: DebugSessionManager;
  private sourceMapper?: SourceMapper;
  private variableStore = new VariableStore();
  private preConfig?: DebugSessionConfig;
  private externalCallbacks: DebugSessionCallbacks;

  /** Breakpoints keyed by server script_path (merged across all files) */
  private breakpointsBySource = new Map<string, BreakpointInput[]>();

  /** Logpoint messages keyed by "script_path:line_number" */
  private logpoints = new Map<string, string>();

  constructor(config?: DebugSessionConfig, callbacks: DebugSessionCallbacks = {}) {
    super();
    this.preConfig = config;
    this.externalCallbacks = callbacks;

    // SDAPI uses 1-based lines (same as DAP default)
    this.setDebuggerLinesStartAt1(true);
    this.setDebuggerColumnsStartAt1(true);
  }

  /**
   * Override shutdown to prevent the base class from calling process.exit().
   * Process lifecycle is managed by the CLI command, not the adapter.
   */
  override shutdown(): void {
    // No-op — base class would call process.exit() after a timeout
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  protected override initializeRequest(
    response: DebugProtocol.InitializeResponse,
    _args: DebugProtocol.InitializeRequestArguments,
  ): void {
    response.body = {
      ...response.body,
      supportsConditionalBreakpoints: true,
      supportsEvaluateForHovers: true,
      supportTerminateDebuggee: true,
      supportsConfigurationDoneRequest: true,
      supportsTerminateRequest: true,
      supportsLogPoints: true,
    };
    this.sendResponse(response);
    // InitializedEvent is deferred to launchRequest — the SDAPI requires a
    // client to exist before breakpoints can be set, and DAP clients send
    // setBreakpoints immediately after receiving InitializedEvent.
  }

  protected override async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: LaunchRequestArguments,
  ): Promise<void> {
    try {
      const config = this.resolveConfig(args);
      this.sourceMapper = createSourceMapper(config.cartridgeRoots);

      this.session = new DebugSessionManager(config, {
        onConnected: (hostname) => {
          this.sendEvent(new OutputEvent(`Connected to ${hostname}\n`, 'console'));
          this.externalCallbacks.onConnected?.(hostname);
        },
        onDisconnected: () => {
          this.sendEvent(new OutputEvent('Debugger disconnected\n', 'console'));
          this.externalCallbacks.onDisconnected?.();
        },
        onThreadStopped: (thread) => {
          this.handleThreadStopped(thread);
          this.externalCallbacks.onThreadStopped?.(thread);
        },
        onThreadContinued: (threadId) => {
          this.handleThreadContinued(threadId);
          this.externalCallbacks.onThreadContinued?.(threadId);
        },
        onThreadExited: (threadId) => {
          this.handleThreadExited(threadId);
          this.externalCallbacks.onThreadExited?.(threadId);
        },
        onDebuggerDisabled: () => {
          this.sendEvent(new OutputEvent('Debugger was disabled externally\n', 'important'));
          this.sendEvent(new TerminatedEvent());
          this.externalCallbacks.onDebuggerDisabled?.();
        },
        onError: (error) => {
          this.sendEvent(new OutputEvent(`Debug error: ${error.message}\n`, 'stderr'));
          this.externalCallbacks.onError?.(error);
        },
      });

      await this.session.connect();
      this.sendResponse(response);
      // Signal ready for configuration now that the SDAPI client exists
      this.sendEvent(new InitializedEvent());
    } catch (error) {
      const msg = this.friendlyErrorMessage(error);
      this.sendEvent(new OutputEvent(`Failed to connect: ${msg}\n`, 'important'));
      this.sendErrorResponse(response, 1001, `Failed to connect: ${msg}`);
    }
  }

  protected override configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse,
    _args: DebugProtocol.ConfigurationDoneArguments,
  ): void {
    this.sendResponse(response);
  }

  protected override async disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    _args: DebugProtocol.DisconnectArguments,
  ): Promise<void> {
    try {
      await this.session?.disconnect();
    } catch {
      // Best-effort cleanup
    }
    this.sendResponse(response);
  }

  protected override async terminateRequest(
    response: DebugProtocol.TerminateResponse,
    _args: DebugProtocol.TerminateArguments,
  ): Promise<void> {
    try {
      await this.session?.disconnect();
    } catch {
      // Best-effort cleanup
    }
    this.sendEvent(new TerminatedEvent());
    this.sendResponse(response);
  }

  // -----------------------------------------------------------------------
  // Breakpoints
  // -----------------------------------------------------------------------

  protected override async setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments,
  ): Promise<void> {
    if (!this.session || !this.sourceMapper) {
      response.body = {breakpoints: []};
      this.sendResponse(response);
      return;
    }

    const sourcePath = args.source.path ?? '';
    const serverPath = this.sourceMapper.toServerPath(sourcePath);

    if (!serverPath) {
      // Can't map this source — return unverified breakpoints
      const unverified = (args.breakpoints ?? []).map((bp) => {
        const dapBp = new DAPBreakpoint(false, bp.line);
        dapBp.setId(this.allocateBreakpointId());
        return dapBp;
      });
      response.body = {breakpoints: unverified};
      this.sendResponse(response);
      return;
    }

    // Clear logpoints for this source before rebuilding
    for (const key of this.logpoints.keys()) {
      if (key.startsWith(`${serverPath}:`)) {
        this.logpoints.delete(key);
      }
    }

    // Update our local map for this source file
    const inputs: BreakpointInput[] = (args.breakpoints ?? []).map((bp) => {
      if (bp.logMessage) {
        this.logpoints.set(`${serverPath}:${bp.line}`, bp.logMessage);
      }
      return {
        line_number: bp.line,
        script_path: serverPath,
        ...(bp.condition ? {condition: bp.condition} : {}),
      };
    });

    if (inputs.length > 0) {
      this.breakpointsBySource.set(serverPath, inputs);
    } else {
      this.breakpointsBySource.delete(serverPath);
    }

    // Merge all breakpoints and send to server
    const allBreakpoints = [...this.breakpointsBySource.values()].flat();

    try {
      const serverBps = await this.session.setBreakpoints(allBreakpoints);
      const verified = serverBps.filter((bp) => bp.script_path === serverPath).length;
      this.sendEvent(new OutputEvent(`Set ${verified}/${inputs.length} breakpoint(s) in ${serverPath}\n`, 'console'));

      // Match server-returned breakpoints back to this file's breakpoints
      const fileBps = serverBps.filter((bp) => bp.script_path === serverPath);
      const result = inputs.map((input) => {
        const match = fileBps.find((sbp) => sbp.line_number === input.line_number);
        if (match) {
          const bp = new DAPBreakpoint(true, match.line_number);
          bp.setId(match.id);
          return bp;
        }
        return new DAPBreakpoint(false, input.line_number);
      });

      response.body = {breakpoints: result};
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.sendEvent(new OutputEvent(`Breakpoint error: ${msg}\n`, 'stderr'));
      response.body = {breakpoints: inputs.map((i) => new DAPBreakpoint(false, i.line_number))};
    }

    this.sendResponse(response);
  }

  // -----------------------------------------------------------------------
  // Threads
  // -----------------------------------------------------------------------

  protected override threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    const threads = this.session?.getKnownThreads() ?? [];

    // Always return at least a "main" thread so the UI has something
    if (threads.length === 0) {
      response.body = {threads: [new Thread(0, 'Main Thread')]};
    } else {
      response.body = {
        threads: threads.map((t) => new Thread(t.id, `Thread ${t.id}`)),
      };
    }
    this.sendResponse(response);
  }

  // -----------------------------------------------------------------------
  // Stack trace
  // -----------------------------------------------------------------------

  protected override async stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
  ): Promise<void> {
    if (!this.session || !this.sourceMapper) {
      response.body = {stackFrames: [], totalFrames: 0};
      this.sendResponse(response);
      return;
    }

    try {
      const thread = await this.session.client.getThread(args.threadId);
      const frames: DAPStackFrame[] = (thread.call_stack ?? []).map((frame) => {
        const loc = frame.location;
        const localPath = this.sourceMapper!.toLocalPath(loc.script_path);
        const source = localPath
          ? new Source(loc.script_path.split('/').pop() ?? loc.script_path, localPath)
          : new Source(loc.script_path);

        return new DAPStackFrame(
          encodeFrameId(args.threadId, frame.index),
          loc.function_name || '<anonymous>',
          source,
          loc.line_number,
          0,
        );
      });

      response.body = {stackFrames: frames, totalFrames: frames.length};
    } catch {
      response.body = {stackFrames: [], totalFrames: 0};
    }

    this.sendResponse(response);
  }

  // -----------------------------------------------------------------------
  // Scopes & variables
  // -----------------------------------------------------------------------

  protected override scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
    const {threadId, frameIndex} = decodeFrameId(args.frameId);

    const localRef = this.variableStore.getOrCreateReference(threadId, frameIndex, '', 'local');
    const closureRef = this.variableStore.getOrCreateReference(threadId, frameIndex, '', 'closure');
    const globalRef = this.variableStore.getOrCreateReference(threadId, frameIndex, '', 'global');

    response.body = {
      scopes: [
        new Scope('Local', localRef, false),
        new Scope('Closure', closureRef, false),
        new Scope('Global', globalRef, true),
      ],
    };
    this.sendResponse(response);
  }

  protected override async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
  ): Promise<void> {
    if (!this.session) {
      response.body = {variables: []};
      this.sendResponse(response);
      return;
    }

    const ref = this.variableStore.resolve(args.variablesReference);
    if (!ref) {
      response.body = {variables: []};
      this.sendResponse(response);
      return;
    }

    try {
      let members: SdapiObjectMember[];

      if (ref.scope && !ref.objectPath) {
        // Scope request: get all variables, filter by scope
        const result = await this.session.client.getVariables(ref.threadId, ref.frameIndex);
        members = result.object_members.filter((m) => m.scope === ref.scope);
      } else {
        // Object member request: navigate to object_path
        const result = await this.session.client.getMembers(ref.threadId, ref.frameIndex, ref.objectPath || undefined);
        members = result.object_members;
      }

      const variables = members
        .filter((m) => m.name !== 'arguments')
        .map((m) => this.memberToVariable(m, ref.threadId, ref.frameIndex, ref.objectPath));

      response.body = {variables};
    } catch {
      response.body = {variables: []};
    }

    this.sendResponse(response);
  }

  // -----------------------------------------------------------------------
  // Evaluation
  // -----------------------------------------------------------------------

  protected override async evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments,
  ): Promise<void> {
    if (!this.session || args.frameId === undefined) {
      this.sendErrorResponse(response, 1002, 'No active debug session or frame');
      return;
    }

    const {threadId, frameIndex} = decodeFrameId(args.frameId);

    try {
      const result = await this.session.client.evaluate(threadId, frameIndex, args.expression);

      // Try to make the result expandable by checking if it has members
      let variablesReference = 0;
      try {
        const members = await this.session.client.getMembers(threadId, frameIndex, args.expression);
        if (members.object_members.length > 0) {
          variablesReference = this.variableStore.getOrCreateReference(threadId, frameIndex, args.expression);
        }
      } catch {
        // Not expandable — leave variablesReference as 0
      }

      response.body = {
        result: result.result,
        variablesReference,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      response.body = {result: msg, variablesReference: 0};
    }

    this.sendResponse(response);
  }

  // -----------------------------------------------------------------------
  // Execution control
  // -----------------------------------------------------------------------

  protected override async continueRequest(
    response: DebugProtocol.ContinueResponse,
    args: DebugProtocol.ContinueArguments,
  ): Promise<void> {
    this.variableStore.clear();
    try {
      await this.session?.resume(args.threadId);
      this.sendEvent(new OutputEvent(`Thread ${args.threadId} continued\n`, 'console'));
      response.body = {allThreadsContinued: false};
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.sendEvent(new OutputEvent(`Continue error: ${msg}\n`, 'stderr'));
    }
    this.sendResponse(response);
  }

  protected override async nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments,
  ): Promise<void> {
    this.variableStore.clear();
    try {
      await this.session?.stepOver(args.threadId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.sendEvent(new OutputEvent(`Step over error: ${msg}\n`, 'stderr'));
    }
    this.sendResponse(response);
  }

  protected override async stepInRequest(
    response: DebugProtocol.StepInResponse,
    args: DebugProtocol.StepInArguments,
  ): Promise<void> {
    this.variableStore.clear();
    try {
      await this.session?.stepInto(args.threadId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.sendEvent(new OutputEvent(`Step in error: ${msg}\n`, 'stderr'));
    }
    this.sendResponse(response);
  }

  protected override async stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    args: DebugProtocol.StepOutArguments,
  ): Promise<void> {
    this.variableStore.clear();
    try {
      await this.session?.stepOut(args.threadId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.sendEvent(new OutputEvent(`Step out error: ${msg}\n`, 'stderr'));
    }
    this.sendResponse(response);
  }

  // -----------------------------------------------------------------------
  // Thread event handlers (called by DebugSessionManager)
  // -----------------------------------------------------------------------

  private handleThreadStopped(thread: SdapiScriptThread): void {
    this.variableStore.clear();
    const topFrame = thread.call_stack?.[0];

    // Check if this is a logpoint hit
    if (topFrame) {
      const loc = topFrame.location;
      const logMessage = this.logpoints.get(`${loc.script_path}:${loc.line_number}`);
      if (logMessage) {
        void this.handleLogpoint(thread.id, topFrame.index, logMessage);
        return;
      }
    }

    if (topFrame) {
      const loc = topFrame.location;
      const fn = loc.function_name || '<anonymous>';
      const localPath = this.sourceMapper?.toLocalPath(loc.script_path);
      const displayPath = localPath ?? `${loc.script_path} (unmapped cartridge)`;
      this.sendEvent(
        new OutputEvent(`Thread ${thread.id} halted at ${displayPath}:${loc.line_number} (${fn})\n`, 'console'),
      );
    }
    this.sendEvent(new StoppedEvent('breakpoint', thread.id));
  }

  private async handleLogpoint(threadId: number, frameIndex: number, logMessage: string): Promise<void> {
    // Interpolate {expression} placeholders by evaluating each on the server
    let output = logMessage;
    const placeholders = logMessage.match(/\{[^}]+\}/g);
    if (placeholders && this.session) {
      for (const placeholder of placeholders) {
        const expr = placeholder.slice(1, -1);
        try {
          const result = await this.session.client.evaluate(threadId, frameIndex, expr);
          output = output.replace(placeholder, result.result);
        } catch {
          output = output.replace(placeholder, `<${expr}: error>`);
        }
      }
    }

    this.sendEvent(new OutputEvent(output + '\n', 'console'));

    // Auto-resume — logpoints don't stop
    try {
      await this.session?.resume(threadId);
    } catch {
      // If resume fails, fall through to a normal stop
      this.sendEvent(new StoppedEvent('breakpoint', threadId));
    }
  }

  private handleThreadContinued(_threadId: number): void {
    this.variableStore.clear();
    // ContinuedEvent is optional — the client infers it from step/continue responses
  }

  private handleThreadExited(threadId: number): void {
    this.sendEvent(new ThreadEvent('exited', threadId));
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private resolveConfig(args: LaunchRequestArguments): DebugSessionConfig {
    if (this.preConfig) return this.preConfig;

    const hostname = args.hostname;
    const username = args.username;
    const password = args.password;

    if (!hostname || !username || !password) {
      throw new Error('hostname, username, and password are required for the debug session');
    }

    // Cartridge roots will be populated by the CLI command before creating the adapter
    return {
      hostname,
      username,
      password,
      clientId: args.clientId,
      cartridgeRoots: [],
      pollInterval: args.pollInterval,
      keepaliveInterval: args.keepaliveInterval,
    };
  }

  private memberToVariable(
    member: SdapiObjectMember,
    threadId: number,
    frameIndex: number,
    parentPath: string,
  ): Variable {
    const isPrimitive = PRIMITIVE_TYPES.has(member.type);
    let childRef = 0;

    if (!isPrimitive) {
      // Build the object path for drilling down
      const childPath = parentPath ? `${parentPath}.${member.name}` : member.name;
      childRef = this.variableStore.getOrCreateReference(threadId, frameIndex, childPath);
    }

    const displayValue = member.value.length > 200 ? member.value.slice(0, 200) + '...' : member.value;

    return new Variable(member.name, displayValue, childRef);
  }

  private friendlyErrorMessage(error: unknown): string {
    if (error instanceof SdapiError) {
      if (error.status === 401) {
        return 'Authentication failed — check that username and password (access key) are correct in your configuration (dw.json).';
      }
      if (error.status === 412) {
        return 'Script debugger is not enabled on this instance. Enable it in Business Manager > Administration > Development Configuration.';
      }
    }
    return error instanceof Error ? error.message : String(error);
  }

  private _nextBreakpointId = 1;
  private allocateBreakpointId(): number {
    return this._nextBreakpointId++;
  }
}
