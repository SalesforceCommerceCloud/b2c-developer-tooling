/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerJobsCommands} from './jobs-commands.js';
import {JobsTreeDataProvider} from './jobs-tree-provider.js';

export function registerJobs(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const treeProvider = new JobsTreeDataProvider(configProvider);
  const treeView = vscode.window.createTreeView('b2cJobsExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const updateNeedsOAuthContext = (): void => {
    const config = configProvider.getConfig();
    const needsOAuth = Boolean(config) && !config!.hasOAuthConfig();
    void vscode.commands.executeCommand('setContext', 'b2c-dx.jobs.needsOAuth', needsOAuth);
  };
  updateNeedsOAuthContext();

  if (treeView.visible) {
    treeProvider.startPolling();
  }

  const visibilityListener = treeView.onDidChangeVisibility((event) => {
    if (event.visible) {
      treeProvider.startPolling();
      treeProvider.refresh();
    } else {
      treeProvider.stopPolling();
    }
  });

  const commandDisposables = registerJobsCommands(configProvider, treeProvider);

  configProvider.onDidReset(() => {
    treeProvider.stopPolling();
    updateNeedsOAuthContext();
    treeProvider.refresh();
    if (treeView.visible) {
      treeProvider.startPolling();
    }
  });

  context.subscriptions.push(treeView, visibilityListener, ...commandDisposables, {
    dispose: () => treeProvider.stopPolling(),
  });
}
