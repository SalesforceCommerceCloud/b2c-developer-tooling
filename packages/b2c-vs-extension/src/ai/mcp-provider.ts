/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {IdeContext} from './ide-context.js';

export interface McpSettings {
  enabled: boolean;
  command: string;
  args: string[];
}

export class B2CMcpServerDefinitionProvider implements vscode.McpServerDefinitionProvider {
  constructor(
    private readonly readContext: () => Promise<IdeContext>,
    private readonly getSettings: () => McpSettings,
    readonly onDidChangeMcpServerDefinitions: vscode.Event<void>,
    private readonly serverVersion: string,
  ) {}

  async provideMcpServerDefinitions(token: vscode.CancellationToken): Promise<vscode.McpStdioServerDefinition[]> {
    if (!this.getSettings().enabled || !vscode.workspace.isTrusted || token.isCancellationRequested) return [];
    const context = await this.readContext();
    if (!context.projectDirectory || token.isCancellationRequested) return [];
    return [this.createDefinition(context)];
  }

  async resolveMcpServerDefinition(
    _server: vscode.McpServerDefinition,
    token: vscode.CancellationToken,
  ): Promise<vscode.McpStdioServerDefinition | undefined> {
    // Resolve again at launch: the user may have switched instances since discovery.
    if (!this.getSettings().enabled || !vscode.workspace.isTrusted || token.isCancellationRequested) return;
    const context = await this.readContext();
    if (!context.projectDirectory || token.isCancellationRequested) return;
    if (context.status === 'unavailable') {
      throw new Error('The selected B2C instance is unavailable. Select another instance before starting MCP.');
    }
    return this.createDefinition(context);
  }

  private createDefinition(context: IdeContext): vscode.McpStdioServerDefinition {
    const settings = this.getSettings();
    const args = [...settings.args, '--project-directory', context.projectDirectory!];
    if (context.configPath) args.push('--config', context.configPath);
    if (context.instanceName) args.push('--instance', context.instanceName);
    const server = new vscode.McpStdioServerDefinition('B2C Commerce', settings.command, args, {}, this.serverVersion);
    server.cwd = vscode.Uri.file(context.projectDirectory!);
    return server;
  }
}
