/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import readline from 'node:readline';
import type {
  BreakpointInput,
  DebugSessionManager,
  SdapiScriptThread,
  SourceMapper,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import {resolveBreakpointPath} from '@salesforce/b2c-tooling-sdk/operations/debug';

const MAX_VALUE_LENGTH = 200;

interface RpcRequest {
  id?: number | string;
  command: string;
  args?: Record<string, unknown>;
}

interface RpcResponse {
  id?: number | string;
  result?: unknown;
  error?: string;
}

interface RpcEvent {
  event: string;
  data: unknown;
}

export interface DebugRpcOptions {
  cartridges: CartridgeMapping[];
  input: NodeJS.ReadableStream;
  manager: DebugSessionManager;
  output: NodeJS.WritableStream;
  sourceMapper: SourceMapper;
}

export class DebugRpc {
  private readonly cartridges: CartridgeMapping[];
  private currentFrameIndex = 0;
  private currentThreadId?: number;
  private readonly input: NodeJS.ReadableStream;
  private readonly manager: DebugSessionManager;
  private readonly output: NodeJS.WritableStream;
  private resolveRun?: () => void;
  private readonly sourceMapper: SourceMapper;

  constructor(options: DebugRpcOptions) {
    this.manager = options.manager;
    this.sourceMapper = options.sourceMapper;
    this.cartridges = options.cartridges;
    this.output = options.output;
    this.input = options.input;
  }

  onThreadStopped(thread: SdapiScriptThread): void {
    this.currentThreadId = thread.id;
    this.currentFrameIndex = 0;

    const topFrame = thread.call_stack?.[0];
    const loc = topFrame?.location;
    this.emitEvent('thread_stopped', {
      thread_id: thread.id,
      location: loc
        ? {
            file: this.sourceMapper.toLocalPath(loc.script_path) ?? null,
            line: loc.line_number,
            function_name: loc.function_name,
            script_path: loc.script_path,
          }
        : null,
    });
  }

  async run(): Promise<void> {
    const rl = readline.createInterface({input: this.input, terminal: false});

    this.emitEvent('ready', {});

    rl.on('line', (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      this.handleMessage(trimmed).catch(() => {});
    });

    rl.on('close', () => {
      this.resolveRun?.();
    });

    return new Promise<void>((resolve) => {
      this.resolveRun = resolve;
    });
  }

  private emitEvent(event: string, data: unknown): void {
    const msg: RpcEvent = {event, data};
    this.output.write(JSON.stringify(msg) + '\n');
  }

  private getThread(): number {
    if (this.currentThreadId === undefined) {
      throw new Error('No thread selected. Wait for a thread_stopped event.');
    }
    return this.currentThreadId;
  }

  private async handleCommand(command: string, args: Record<string, unknown>): Promise<unknown> {
    switch (command) {
      case 'continue': {
        const threadId = (args.thread_id as number) ?? this.getThread();
        await this.manager.resume(threadId);
        return {thread_id: threadId, status: 'resumed'};
      }

      case 'evaluate': {
        const threadId = (args.thread_id as number) ?? this.getThread();
        const frameIndex = (args.frame_index as number) ?? this.currentFrameIndex;
        const expression = args.expression as string;
        if (!expression) throw new Error('Missing required arg: expression');
        const evalResult = await this.manager.client.evaluate(threadId, frameIndex, expression);
        return {expression: evalResult.expression, result: evalResult.result};
      }

      case 'get_stack': {
        const threadId = (args.thread_id as number) ?? this.getThread();
        const thread = await this.manager.client.getThread(threadId);
        return {
          thread_id: thread.id,
          frames: thread.call_stack.map((frame) => ({
            index: frame.index,
            function_name: frame.location.function_name,
            file: this.sourceMapper.toLocalPath(frame.location.script_path) ?? null,
            line: frame.location.line_number,
            script_path: frame.location.script_path,
          })),
        };
      }

      case 'get_variables': {
        const threadId = (args.thread_id as number) ?? this.getThread();
        const frameIndex = (args.frame_index as number) ?? this.currentFrameIndex;
        const objectPath = args.object_path as string | undefined;

        if (objectPath) {
          const result = await this.manager.client.getMembers(threadId, frameIndex, objectPath);
          return {
            variables: result.object_members.map((m) => ({
              name: m.name,
              type: m.type,
              value: truncateValue(m.value),
              has_children: !isPrimitive(m.type),
            })),
          };
        }

        const result = await this.manager.client.getVariables(threadId, frameIndex);
        let members = result.object_members;
        if (args.scope) {
          members = members.filter((m) => m.scope === args.scope);
        }
        return {
          variables: members.map((m) => ({
            name: m.name,
            type: m.type,
            value: truncateValue(m.value),
            scope: m.scope,
            has_children: !isPrimitive(m.type),
          })),
        };
      }

      case 'list_breakpoints': {
        const bps = await this.manager.client.getBreakpoints();
        return {
          breakpoints: bps.map((bp) => ({
            id: bp.id,
            file: this.sourceMapper.toLocalPath(bp.script_path) ?? null,
            line: bp.line_number,
            script_path: bp.script_path,
            condition: bp.condition,
          })),
        };
      }

      case 'list_threads': {
        const threads = this.manager.getKnownThreads();
        return {
          threads: threads.map((t) => {
            const topFrame = t.call_stack?.[0];
            const loc = topFrame?.location;
            return {
              thread_id: t.id,
              status: t.status,
              current: t.id === this.currentThreadId,
              location: loc
                ? {
                    file: this.sourceMapper.toLocalPath(loc.script_path) ?? null,
                    line: loc.line_number,
                    function_name: loc.function_name,
                    script_path: loc.script_path,
                  }
                : null,
            };
          }),
        };
      }

      case 'select_frame': {
        const index = args.index as number;
        if (index === undefined || index < 0) throw new Error('Missing required arg: index');
        this.currentFrameIndex = index;
        return {frame_index: index};
      }

      case 'select_thread': {
        const id = args.thread_id as number;
        if (id === undefined) throw new Error('Missing required arg: thread_id');
        this.currentThreadId = id;
        this.currentFrameIndex = 0;
        return {thread_id: id};
      }

      case 'set_breakpoints': {
        const breakpoints = args.breakpoints as Array<{file: string; line: number; condition?: string}>;
        if (!breakpoints) throw new Error('Missing required arg: breakpoints');

        const inputs: BreakpointInput[] = breakpoints.map((bp) => ({
          script_path: resolveBreakpointPath(bp.file, this.sourceMapper, this.cartridges),
          line_number: bp.line,
          condition: bp.condition,
        }));

        const result = await this.manager.setBreakpoints(inputs);
        return {
          breakpoints: result.map((bp) => ({
            id: bp.id,
            file: this.sourceMapper.toLocalPath(bp.script_path) ?? null,
            line: bp.line_number,
            script_path: bp.script_path,
            condition: bp.condition,
          })),
        };
      }

      case 'step_into': {
        const threadId = (args.thread_id as number) ?? this.getThread();
        await this.manager.stepInto(threadId);
        return {thread_id: threadId, action: 'step_into'};
      }

      case 'step_out': {
        const threadId = (args.thread_id as number) ?? this.getThread();
        await this.manager.stepOut(threadId);
        return {thread_id: threadId, action: 'step_out'};
      }

      case 'step_over': {
        const threadId = (args.thread_id as number) ?? this.getThread();
        await this.manager.stepOver(threadId);
        return {thread_id: threadId, action: 'step_over'};
      }

      default: {
        throw new Error(`Unknown command: ${command}`);
      }
    }
  }

  private async handleMessage(line: string): Promise<void> {
    let request: RpcRequest;
    try {
      request = JSON.parse(line) as RpcRequest;
    } catch {
      this.sendResponse({error: 'Invalid JSON'});
      return;
    }

    if (!request.command) {
      this.sendResponse({id: request.id, error: 'Missing "command" field'});
      return;
    }

    try {
      const result = await this.handleCommand(request.command, request.args ?? {});
      this.sendResponse({id: request.id, result});
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.sendResponse({id: request.id, error: message});
    }
  }

  private sendResponse(response: RpcResponse): void {
    this.output.write(JSON.stringify(response) + '\n');
  }
}

function isPrimitive(type: string): boolean {
  return ['boolean', 'Boolean', 'null', 'number', 'Number', 'string', 'String', 'undefined'].includes(type);
}

function truncateValue(value: string): string {
  if (value.length <= MAX_VALUE_LENGTH) return value;
  return value.slice(0, MAX_VALUE_LENGTH) + '...';
}
