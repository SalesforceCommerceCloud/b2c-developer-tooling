/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CMcpServerDefinitionProvider} from './mcp-provider.js';
import type {IdeContext} from './ide-context.js';
import {startIdeContextBridge} from './ide-context-bridge.js';

export interface CursorMcpApi {
  registerServer(config: {name: string; server: {command: string; args: string[]; env: Record<string, string>}}): void;
  unregisterServer(name: string): void;
}

export function getCursorMcpApi(): CursorMcpApi | undefined {
  const api = (vscode as typeof vscode & {cursor?: {mcp?: CursorMcpApi}}).cursor?.mcp;
  return typeof api?.registerServer === 'function' && typeof api.unregisterServer === 'function' ? api : undefined;
}

const COMMERCE_SERVER = 'salesforce-b2c-commerce';

export class CursorMcpRegistration implements vscode.Disposable {
  private bridge: Awaited<ReturnType<typeof startIdeContextBridge>> | undefined;
  private definition: string | undefined;
  private disposed = false;
  private pending = Promise.resolve();

  constructor(
    private readonly api: CursorMcpApi,
    private readonly provider: B2CMcpServerDefinitionProvider,
    private readonly readContext: () => Promise<IdeContext>,
  ) {}

  refresh(): Promise<void> {
    const update = this.pending.then(() => this.update());
    this.pending = update.catch(() => {});
    return update;
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    await this.pending;
    await this.clear();
  }

  private async clear(): Promise<void> {
    if (this.definition) this.api.unregisterServer(COMMERCE_SERVER);
    this.definition = undefined;
    if (this.bridge) {
      await this.bridge.dispose();
      this.bridge = undefined;
    }
  }

  private async update(): Promise<void> {
    if (this.disposed) return;
    const cancellation = new vscode.CancellationTokenSource();
    try {
      const [definition] = await this.provider.provideMcpServerDefinitions(cancellation.token);
      if (this.disposed) return;
      if (!definition) {
        await this.clear();
        return;
      }
      if (!this.bridge) this.bridge = await startIdeContextBridge(this.readContext);
      if (this.disposed) return;
      // Cursor has no cwd field; --project-directory is already in the arguments.
      const server = {
        command: definition.command,
        args: [...definition.args, '--ide-context-url', this.bridge.url],
        env: {SFCC_IDE_CONTEXT_TOKEN: this.bridge.token},
      };
      const serialized = JSON.stringify(server);
      if (serialized !== this.definition) {
        if (this.definition) this.api.unregisterServer(COMMERCE_SERVER);
        this.definition = undefined;
        this.api.registerServer({name: COMMERCE_SERVER, server});
        this.definition = serialized;
      }
    } finally {
      cancellation.dispose();
    }
  }
}
