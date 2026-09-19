/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {IdeContextTool, readIdeContext, type CodeSyncStatus} from './ide-context.js';
import {B2CMcpServerDefinitionProvider} from './mcp-provider.js';
import {CursorMcpRegistration, getCursorMcpApi} from './cursor-mcp.js';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

export function registerAiIntegration(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  getCodeSyncStatus: () => CodeSyncStatus,
): void {
  const readContext = () => readIdeContext(configProvider, getCodeSyncStatus);
  const cursor = getCursorMcpApi();
  // VS Code forks do not necessarily implement either of these APIs.
  if (!cursor && typeof vscode.lm?.registerTool === 'function') {
    context.subscriptions.push(vscode.lm.registerTool('b2c_get_ide_context', new IdeContextTool(readContext)));
  }
  if (!cursor && typeof vscode.lm?.registerMcpServerDefinitionProvider !== 'function') return;

  const changed = new vscode.EventEmitter<void>();
  const version = __MCP_VERSION__;
  const provider = new B2CMcpServerDefinitionProvider(
    readContext,
    () => {
      const settings = vscode.workspace.getConfiguration('b2c-dx');
      return {
        enabled: settings.get<boolean>('mcp.enabled', true),
        command: settings.get<string>('mcp.command', 'npx'),
        args: settings.get<string[]>('mcp.args') ?? ['-y', `@salesforce/b2c-dx-mcp@${version}`],
      };
    },
    changed.event,
    version,
  );
  if (cursor) {
    const registration = new CursorMcpRegistration(cursor, provider, readContext);
    const refresh = () => {
      void registration.refresh().catch((error: unknown) => {
        getLogger().warn({err: error}, 'Could not register B2C MCP servers with Cursor');
      });
    };
    context.subscriptions.push(registration, changed.event(refresh));
    refresh();
  } else {
    context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider('b2c-commerce', provider));
  }
  context.subscriptions.push(
    changed,
    configProvider.onDidReset(() => changed.fire()),
    vscode.workspace.onDidGrantWorkspaceTrust(() => changed.fire()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('b2c-dx.mcp')) changed.fire();
    }),
  );
}
