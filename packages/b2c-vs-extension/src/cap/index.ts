/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {CapFileDecorationProvider} from './cap-decorator.js';
import {registerCapCommands} from './cap-commands.js';

const CAP_DIRECTORIES_CONTEXT_KEY = 'b2c-dx.capDirectories';

/**
 * Registers Commerce App Package (CAP) features:
 * - File decorator: adds "CA" badge to CAP directories in the explorer
 * - Context key: tracks CAP directories so the context menu only appears on CAP folders
 * - Install command: right-click a CAP folder to install it
 */
export function registerCap(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  // File decoration provider
  const decorator = new CapFileDecorationProvider();
  context.subscriptions.push(vscode.window.registerFileDecorationProvider(decorator));
  context.subscriptions.push(decorator);

  // Track known CAP directory URIs for context menu visibility.
  // The `in` operator in VS Code `when` clauses checks for keys in an object.
  // The `resource` when-clause variable evaluates to the full URI string (file:///...).
  const capUris = new Set<string>();

  function updateCapContext(): void {
    const obj: Record<string, boolean> = {};
    for (const u of capUris) {
      obj[u] = true;
    }
    vscode.commands.executeCommand('setContext', CAP_DIRECTORIES_CONTEXT_KEY, obj);
  }

  async function scanCapDirectories(): Promise<void> {
    capUris.clear();
    const files = await vscode.workspace.findFiles('**/commerce-app.json');
    for (const f of files) {
      const dirUri = vscode.Uri.file(path.dirname(f.fsPath));
      capUris.add(dirUri.toString());
    }
    updateCapContext();
  }

  // Initial scan
  void scanCapDirectories();

  // Watch for commerce-app.json changes to update decorations and context key
  const watcher = vscode.workspace.createFileSystemWatcher('**/commerce-app.json');
  watcher.onDidCreate((uri) => {
    capUris.add(vscode.Uri.file(path.dirname(uri.fsPath)).toString());
    updateCapContext();
    decorator.refresh();
  });
  watcher.onDidDelete((uri) => {
    capUris.delete(vscode.Uri.file(path.dirname(uri.fsPath)).toString());
    updateCapContext();
    decorator.refresh();
  });
  watcher.onDidChange(() => decorator.refresh());
  context.subscriptions.push(watcher);

  // Commands
  const disposables = registerCapCommands(context, configProvider);
  context.subscriptions.push(...disposables);
}
