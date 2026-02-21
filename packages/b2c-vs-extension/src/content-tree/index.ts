/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import {ContentConfigProvider} from './content-config.js';
import {CONTENT_SCHEME, ContentFileSystemProvider} from './content-fs-provider.js';
import {ContentTreeDataProvider} from './content-tree-provider.js';
import {registerContentCommands} from './content-commands.js';

export function registerContentTree(context: vscode.ExtensionContext): void {
  const configProvider = new ContentConfigProvider();
  const fsProvider = new ContentFileSystemProvider(configProvider);

  const fsRegistration = vscode.workspace.registerFileSystemProvider(CONTENT_SCHEME, fsProvider, {
    isCaseSensitive: true,
    isReadonly: false,
  });

  const treeProvider = new ContentTreeDataProvider(configProvider);

  const treeView = vscode.window.createTreeView('b2cContentExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // Show active filter in tree view description
  treeProvider.onDidChangeTreeData(() => {
    const filter = treeProvider.getFilter();
    treeView.description = filter ? `filter: ${filter}` : undefined;
  });

  const commandDisposables = registerContentCommands(context, configProvider, treeProvider, fsProvider);

  context.subscriptions.push(fsRegistration, treeView, ...commandDisposables);
}
