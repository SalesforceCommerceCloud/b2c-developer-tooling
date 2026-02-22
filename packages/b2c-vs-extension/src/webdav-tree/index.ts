/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {WEBDAV_SCHEME, WebDavFileSystemProvider} from './webdav-fs-provider.js';
import {WebDavTreeDataProvider} from './webdav-tree-provider.js';
import {registerWebDavCommands} from './webdav-commands.js';

export function registerWebDavTree(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const fsProvider = new WebDavFileSystemProvider(configProvider);

  const fsRegistration = vscode.workspace.registerFileSystemProvider(WEBDAV_SCHEME, fsProvider, {
    isCaseSensitive: true,
  });

  const treeProvider = new WebDavTreeDataProvider(configProvider, fsProvider);

  const treeView = vscode.window.createTreeView('b2cWebdavExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const commandDisposables = registerWebDavCommands(context, configProvider, treeProvider, fsProvider);

  // Auto-refresh when config changes (dw.json edit, manual reset, future instance switch)
  configProvider.onDidReset(() => {
    fsProvider.clearCache();
    treeProvider.refresh();
  });

  context.subscriptions.push(fsRegistration, treeView, ...commandDisposables);
}
