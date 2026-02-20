/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import {WebDavConfigProvider} from './webdav-config.js';
import {WebDavTreeDataProvider} from './webdav-tree-provider.js';
import {registerWebDavCommands} from './webdav-commands.js';

export function registerWebDavTree(context: vscode.ExtensionContext): void {
  const configProvider = new WebDavConfigProvider();
  const treeProvider = new WebDavTreeDataProvider(configProvider);

  const treeView = vscode.window.createTreeView('b2cWebdavExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const commandDisposables = registerWebDavCommands(context, configProvider, treeProvider);

  context.subscriptions.push(treeView, ...commandDisposables);
}
