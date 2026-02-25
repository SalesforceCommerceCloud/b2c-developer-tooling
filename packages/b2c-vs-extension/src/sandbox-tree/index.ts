/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSandboxCommands} from './sandbox-commands.js';
import {SandboxConfigProvider} from './sandbox-config.js';
import {SandboxTreeDataProvider} from './sandbox-tree-provider.js';

export function registerSandboxTree(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const sandboxConfig = new SandboxConfigProvider(configProvider);
  const treeProvider = new SandboxTreeDataProvider(sandboxConfig);

  const treeView = vscode.window.createTreeView('b2cSandboxExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const commandDisposables = registerSandboxCommands(sandboxConfig, treeProvider);

  configProvider.onDidReset(() => {
    sandboxConfig.clearCache();
    treeProvider.stopAllPolling();
    treeProvider.refresh();
  });

  context.subscriptions.push(treeView, ...commandDisposables, {dispose: () => treeProvider.stopAllPolling()});
}
