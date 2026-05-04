/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import readline from 'node:readline';
import type {
  DebugSessionManager,
  SourceMapper,
  SdapiBreakpoint,
  SdapiScriptThread,
  SdapiObjectMember,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import {resolveBreakpointPath} from '@salesforce/b2c-tooling-sdk/operations/debug';

const RED = '[31m';
const YELLOW = '[33m';
const CYAN = '[36m';
const GREEN = '[32m';
const DIM = '[2m';
const BOLD = '[1m';
const RESET = '[0m';

interface ReplState {
  currentThreadId?: number;
  currentFrameIndex: number;
}

export interface DebugReplOptions {
  cartridges: CartridgeMapping[];
  manager: DebugSessionManager;
  sourceMapper: SourceMapper;
  output: NodeJS.WritableStream;
  input: NodeJS.ReadableStream;
}

type CommandHandler = (args: string) => Promise<void>;

export class DebugRepl {
  private breakpoints: SdapiBreakpoint[] = [];
  private readonly cartridges: CartridgeMapping[];
  private closed = false;
  private commands: Map<string, CommandHandler> = new Map();
  private readonly input: NodeJS.ReadableStream;
  private readonly manager: DebugSessionManager;
  private readonly output: NodeJS.WritableStream;
  private resolveRun?: () => void;
  private rl?: readline.Interface;
  private readonly sourceMapper: SourceMapper;
  private readonly state: ReplState = {currentFrameIndex: 0};

  constructor(options: DebugReplOptions) {
    this.manager = options.manager;
    this.sourceMapper = options.sourceMapper;
    this.cartridges = options.cartridges;
    this.output = options.output;
    this.input = options.input;
    this.registerCommands();
  }

  onThreadStopped(thread: SdapiScriptThread): void {
    this.state.currentThreadId = thread.id;
    this.state.currentFrameIndex = 0;

    const topFrame = thread.call_stack?.[0];
    if (topFrame) {
      const loc = topFrame.location;
      const localPath = this.sourceMapper.toLocalPath(loc.script_path);
      const displayPath = localPath ?? loc.script_path;
      const fn = loc.function_name || '<anonymous>';
      this.print(
        `\n${YELLOW}${BOLD}● Thread ${thread.id}${RESET} halted at ${CYAN}${displayPath}:${loc.line_number}${RESET} in ${fn}()`,
      );
    } else {
      this.print(`\n${YELLOW}${BOLD}● Thread ${thread.id}${RESET} halted`);
    }
  }

  async run(): Promise<void> {
    this.closed = false;
    this.rl = readline.createInterface({
      input: this.input,
      output: this.output,
      prompt: `${DIM}debug>${RESET} `,
    });

    this.print(`${GREEN}Script debugger connected.${RESET} Type ${BOLD}help${RESET} for available commands.`);
    this.rl.prompt();

    this.rl.on('line', (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (!this.closed) this.rl?.prompt();
        return;
      }
      this.handleLine(trimmed)
        .then(() => {
          if (!this.closed) this.rl?.prompt();
        })
        .catch(() => {
          if (!this.closed) this.rl?.prompt();
        });
    });

    this.rl.on('close', () => {
      this.closed = true;
      this.resolveRun?.();
    });

    return new Promise<void>((resolve) => {
      this.resolveRun = resolve;
    });
  }

  private async handleLine(line: string): Promise<void> {
    const spaceIdx = line.indexOf(' ');
    const cmd = spaceIdx === -1 ? line : line.slice(0, spaceIdx);
    const args = spaceIdx === -1 ? '' : line.slice(spaceIdx + 1).trim();

    const handler = this.commands.get(cmd);
    if (!handler) {
      this.print(`${RED}Unknown command: ${cmd}${RESET}. Type ${BOLD}help${RESET} for available commands.`);
      return;
    }

    try {
      await handler(args);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.print(`${RED}Error: ${msg}${RESET}`);
    }
  }

  private print(text: string): void {
    this.output.write(text + '\n');
  }

  private printVariables(members: SdapiObjectMember[]): void {
    if (members.length === 0) {
      this.print('  (no variables)');
      return;
    }
    for (const m of members) {
      const scope = m.scope ? ` ${DIM}[${m.scope}]${RESET}` : '';
      const value = m.value.length > 200 ? m.value.slice(0, 200) + '...' : m.value;
      this.print(`  ${BOLD}${m.name}${RESET}: ${DIM}${m.type}${RESET} = ${value}${scope}`);
    }
  }

  private registerCommand(name: string, shortcut: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
    if (shortcut) this.commands.set(shortcut, handler);
  }

  private registerCommands(): void {
    this.registerCommand('break', 'b', async (args) => {
      const match = args.match(/^(.+):(\d+)(?:\s+if\s+(.+))?$/);
      if (!match) {
        this.print('Usage: break <file>:<line> [if <condition>]');
        return;
      }
      const [, file, lineStr, condition] = match;
      const line = Number.parseInt(lineStr, 10);
      const scriptPath = resolveBreakpointPath(file, this.sourceMapper, this.cartridges);

      const input = {script_path: scriptPath, line_number: line, condition};
      const existingInputs = this.breakpoints.map((bp) => ({
        script_path: bp.script_path,
        line_number: bp.line_number,
        condition: bp.condition,
      }));
      this.breakpoints = await this.manager.setBreakpoints([...existingInputs, input]);
      const added = this.breakpoints.at(-1);
      if (added) {
        const local = this.sourceMapper.toLocalPath(added.script_path);
        this.print(
          `Breakpoint #${added.id} set at ${CYAN}${local ?? added.script_path}:${added.line_number}${RESET}` +
            (added.condition ? ` ${DIM}if ${added.condition}${RESET}` : ''),
        );
      }
    });

    this.registerCommand('breakpoints', 'bl', async () => {
      if (this.breakpoints.length === 0) {
        this.print('No breakpoints set.');
        return;
      }
      for (const bp of this.breakpoints) {
        const local = this.sourceMapper.toLocalPath(bp.script_path);
        this.print(
          `  #${bp.id}  ${CYAN}${local ?? bp.script_path}:${bp.line_number}${RESET}` +
            (bp.condition ? `  ${DIM}if ${bp.condition}${RESET}` : ''),
        );
      }
    });

    this.registerCommand('delete', 'd', async (args) => {
      const id = Number.parseInt(args, 10);
      if (Number.isNaN(id)) {
        this.print('Usage: delete <breakpoint-id>');
        return;
      }
      const remaining = this.breakpoints.filter((bp) => bp.id !== id);
      if (remaining.length === this.breakpoints.length) {
        this.print(`${RED}No breakpoint with id ${id}${RESET}`);
        return;
      }
      const inputs = remaining.map((bp) => ({
        script_path: bp.script_path,
        line_number: bp.line_number,
        condition: bp.condition,
      }));
      this.breakpoints = await this.manager.setBreakpoints(inputs);
      this.print(`Breakpoint #${id} deleted.`);
    });

    this.registerCommand('continue', 'c', async () => {
      const threadId = this.requireThread();
      await this.manager.resume(threadId);
      this.print(`Thread ${threadId} resumed.`);
    });

    this.registerCommand('step', 's', async () => {
      const threadId = this.requireThread();
      await this.manager.stepOver(threadId);
      this.print(`Thread ${threadId} stepping over...`);
    });

    this.registerCommand('stepin', 'si', async () => {
      const threadId = this.requireThread();
      await this.manager.stepInto(threadId);
      this.print(`Thread ${threadId} stepping into...`);
    });

    this.registerCommand('stepout', 'so', async () => {
      const threadId = this.requireThread();
      await this.manager.stepOut(threadId);
      this.print(`Thread ${threadId} stepping out...`);
    });

    this.registerCommand('stack', 'bt', async () => {
      const threadId = this.requireThread();
      const thread = await this.manager.client.getThread(threadId);
      for (const frame of thread.call_stack) {
        const loc = frame.location;
        const local = this.sourceMapper.toLocalPath(loc.script_path);
        const marker = frame.index === this.state.currentFrameIndex ? '→' : ' ';
        this.print(
          `  ${marker} #${frame.index}  ${loc.function_name || '<anonymous>'}  ${CYAN}${local ?? loc.script_path}:${loc.line_number}${RESET}`,
        );
      }
    });

    this.registerCommand('frame', 'f', async (args) => {
      const idx = Number.parseInt(args, 10);
      if (Number.isNaN(idx) || idx < 0) {
        this.print('Usage: frame <index>');
        return;
      }
      this.state.currentFrameIndex = idx;
      this.print(`Switched to frame #${idx}`);
    });

    this.registerCommand('vars', 'v', async () => {
      const threadId = this.requireThread();
      const result = await this.manager.client.getVariables(threadId, this.state.currentFrameIndex);
      this.printVariables(result.object_members);
    });

    this.registerCommand('members', 'm', async (args) => {
      if (!args) {
        this.print('Usage: members <object.path>');
        return;
      }
      const threadId = this.requireThread();
      const result = await this.manager.client.getMembers(threadId, this.state.currentFrameIndex, args);
      this.printVariables(result.object_members);
    });

    this.registerCommand('eval', 'e', async (args) => {
      if (!args) {
        this.print('Usage: eval <expression>');
        return;
      }
      const threadId = this.requireThread();
      const result = await this.manager.client.evaluate(threadId, this.state.currentFrameIndex, args);
      this.print(result.result);
    });

    this.registerCommand('threads', 't', async () => {
      const threads = this.manager.getKnownThreads();
      if (threads.length === 0) {
        this.print('No active threads.');
        return;
      }
      for (const thread of threads) {
        const marker = thread.id === this.state.currentThreadId ? '→' : ' ';
        const status = thread.status === 'halted' ? `${YELLOW}halted${RESET}` : 'running';
        const topFrame = thread.call_stack?.[0];
        const location = topFrame
          ? ` at ${CYAN}${this.sourceMapper.toLocalPath(topFrame.location.script_path) ?? topFrame.location.script_path}:${topFrame.location.line_number}${RESET}`
          : '';
        this.print(`  ${marker} Thread ${thread.id}  ${status}${location}`);
      }
    });

    this.commands.set('thread', async (args) => {
      const id = Number.parseInt(args, 10);
      if (Number.isNaN(id)) {
        this.print('Usage: thread <id>');
        return;
      }
      this.state.currentThreadId = id;
      this.state.currentFrameIndex = 0;
      this.print(`Switched to thread ${id}`);
    });

    this.registerCommand('help', 'h', async () => {
      this.print(`${BOLD}Available commands:${RESET}`);
      this.print(`  ${BOLD}break${RESET} (b)  <file>:<line> [if <cond>]  Set breakpoint`);
      this.print(`  ${BOLD}breakpoints${RESET} (bl)                      List breakpoints`);
      this.print(`  ${BOLD}delete${RESET} (d)  <id>                      Delete breakpoint`);
      this.print(`  ${BOLD}continue${RESET} (c)                          Resume thread`);
      this.print(`  ${BOLD}step${RESET} (s)                              Step over`);
      this.print(`  ${BOLD}stepin${RESET} (si)                           Step into`);
      this.print(`  ${BOLD}stepout${RESET} (so)                          Step out`);
      this.print(`  ${BOLD}stack${RESET} (bt)                            Show call stack`);
      this.print(`  ${BOLD}frame${RESET} (f)   <n>                       Select frame`);
      this.print(`  ${BOLD}vars${RESET} (v)                              Show variables`);
      this.print(`  ${BOLD}members${RESET} (m) <path>                    Expand object`);
      this.print(`  ${BOLD}eval${RESET} (e)    <expr>                    Evaluate expression`);
      this.print(`  ${BOLD}threads${RESET} (t)                           List threads`);
      this.print(`  ${BOLD}thread${RESET}      <id>                      Switch to thread`);
      this.print(`  ${BOLD}quit${RESET} (q)                              Disconnect and exit`);
    });

    this.registerCommand('quit', 'q', async () => {
      this.rl?.close();
    });
  }

  private requireThread(): number {
    if (this.state.currentThreadId === undefined) {
      throw new Error('No thread selected. Wait for a thread to halt at a breakpoint.');
    }
    return this.state.currentThreadId;
  }
}
