/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {ApiBrowserTreeDataProvider, type SchemaEntry} from './api-browser-tree-provider.js';
import {SwaggerWebviewManager} from './swagger-webview.js';

export function registerApiBrowser(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): void {
  const treeProvider = new ApiBrowserTreeDataProvider(configProvider, log);
  const swaggerManager = new SwaggerWebviewManager(context, configProvider, log);

  const treeView = vscode.window.createTreeView('b2cApiBrowser', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const refreshDisposable = registerSafeCommand('b2c-dx.apiBrowser.refresh', () => {
    treeProvider.refresh();
  });

  const openSwaggerDisposable = registerSafeCommand('b2c-dx.apiBrowser.openSwagger', (schema: SchemaEntry) => {
    swaggerManager.openSwaggerPanel(schema);
  });

  configProvider.onDidReset(() => {
    treeProvider.refresh();
  });

  context.subscriptions.push(treeView, refreshDisposable, openSwaggerDisposable, swaggerManager);
}
