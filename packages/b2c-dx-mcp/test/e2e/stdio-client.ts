/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * E2E helper: spawns the MCP server as a subprocess and communicates via
 * newline-delimited JSON-RPC over stdin/stdout (MCP stdio transport).
 */

import {spawn, type ChildProcess} from 'node:child_process';
import * as path from 'node:path';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_INIT_PARAMS = {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {name: 'e2e-test', version: '1.0.0'},
};

export type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: {code: number; message: string; data?: unknown};
};

export type JsonRpcNotification = {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
};

export interface McpE2EClientOptions {
  /** Working directory for the server (default: package root). */
  cwd?: string;
  /** Extra env vars (SFCC_DISABLE_TELEMETRY is always set). */
  env?: NodeJS.ProcessEnv;
  /** Server args (e.g. ['--toolsets', 'all', '--allow-non-ga-tools']). */
  args?: string[];
}

/**
 * Spawns the MCP server and provides request/response over stdio.
 * Use start() to perform MCP handshake (initialize + initialized), then request() for tools/list, tools/call, etc.
 */
export class McpE2EClient {
  private proc: ChildProcess | null = null;
  private readline: ReturnType<typeof createInterface> | null = null;
  private pending = new Map<number | string, {resolve: (r: JsonRpcResponse) => void; reject: (e: Error) => void}>();
  private nextId = 1;
  private readonly packageRoot: string;
  private readonly serverArgs: string[];
  private readonly serverCwd: string;
  private readonly serverEnv: NodeJS.ProcessEnv;

  constructor(options: McpE2EClientOptions = {}) {
    this.packageRoot = path.resolve(__dirname, '../..');
    this.serverCwd = options.cwd ?? this.packageRoot;
    this.serverArgs = options.args ?? [];
    this.serverEnv = {
      ...process.env,
      SFCC_DISABLE_TELEMETRY: 'true',
      ...options.env,
    };
  }

  /**
   * Start the server process and perform MCP initialize handshake.
   */
  async start(): Promise<void> {
    const runJs = path.join(this.packageRoot, 'bin', 'run.js');
    this.proc = spawn(process.execPath, [runJs, ...this.serverArgs], {
      cwd: this.serverCwd,
      env: this.serverEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stderr = '';
    this.proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    this.proc.on('error', (err) => {
      for (const [, {reject}] of this.pending) {
        reject(err);
      }
      this.pending.clear();
    });

    this.proc.on('exit', (code, signal) => {
      this.readline?.close();
      this.readline = null;
      if (this.pending.size > 0 && code !== 0 && signal !== null) {
        const err = new Error(`Server exited with code=${code} signal=${signal}. stderr: ${stderr.slice(-500)}`);
        for (const [, {reject}] of this.pending) {
          reject(err);
        }
        this.pending.clear();
      }
    });

    const rl = createInterface({input: this.proc.stdout!, crlfDelay: Number.POSITIVE_INFINITY});
    this.readline = rl;
    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const msg = JSON.parse(line) as JsonRpcResponse | JsonRpcNotification;
        if ('id' in msg && msg.id !== undefined && this.pending.has(msg.id)) {
          const p = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          p.resolve(msg as JsonRpcResponse);
        }
      } catch {
        // ignore parse errors for non-response lines
      }
    });

    const initResult = await this.request(this.nextId++, 'initialize', DEFAULT_INIT_PARAMS);
    if (initResult.error) {
      throw new Error(`Initialize failed: ${initResult.error.message}`);
    }
    this.sendNotification('notifications/initialized', {});
  }

  /**
   * Send a JSON-RPC request and return the response (result or error).
   */
  request(id: number | string, method: string, params?: unknown): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      if (!this.proc?.stdin?.writable) {
        reject(new Error('Server stdin not writable'));
        return;
      }
      this.pending.set(id, {resolve, reject});
      const req: JsonRpcRequest = {jsonrpc: '2.0', id, method, params};
      this.proc.stdin.write(JSON.stringify(req) + '\n', (err) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  /**
   * Send a JSON-RPC notification (no id, no response expected).
   */
  sendNotification(method: string, params?: unknown): void {
    const notif: JsonRpcNotification = {jsonrpc: '2.0', method, params};
    this.proc?.stdin?.write(JSON.stringify(notif) + '\n');
  }

  /**
   * Send raw bytes to stdin (for E2E error-handling tests).
   */
  sendRaw(line: string): void {
    this.proc?.stdin?.write(line);
  }

  /**
   * Call request() with an auto-generated id and return result or throw on error.
   */
  async call(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    const res = await this.request(id, method, params);
    if (res.error) {
      const e = new Error(res.error.message) as Error & {code?: number; data?: unknown};
      e.code = res.error.code;
      e.data = res.error.data;
      throw e;
    }
    return res.result;
  }

  /**
   * Stop the server (close stdin so it exits cleanly, then kill if needed).
   */
  async stop(): Promise<void> {
    if (!this.proc) return;
    const p = this.proc;
    this.proc = null;
    this.readline?.close();
    this.readline = null;
    if (p.stdin?.writable) {
      p.stdin.end();
    }
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        p.kill('SIGKILL');
        resolve();
      }, 3000);
      p.once('exit', () => {
        clearTimeout(t);
        resolve();
      });
    });
  }
}
