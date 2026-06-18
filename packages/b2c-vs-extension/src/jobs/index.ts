/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'node:path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {JobDefinitionsTreeDataProvider} from './job-definitions-tree-provider.js';
import {registerJobsCommands} from './jobs-commands.js';
import {JobsTreeDataProvider} from './jobs-tree-provider.js';

export function registerJobs(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const treeProvider = new JobsTreeDataProvider(configProvider);
  const treeView = vscode.window.createTreeView('b2cJobsExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // Job Definitions are sourced from local workspace cartridges (jobs.xml +
  // steptypes.json) because OCAPI/SCAPI does not expose Business Manager's job
  // definitions. A toolbar action deep-links to the live BM page.
  const definitionsProvider = new JobDefinitionsTreeDataProvider();
  const definitionsView = vscode.window.createTreeView('b2cJobDefinitionsExplorer', {
    treeDataProvider: definitionsProvider,
    showCollapseAll: true,
  });
  // Make the scope explicit: this view reflects local workspace files only,
  // whereas Business Manager lists every job that exists on the server. Without
  // this, users see "few here, many in BM" and assume something is broken.
  definitionsView.message = 'Local workspace definitions only — Business Manager shows all server-side jobs.';

  const updateJobHistoryMessage = (): void => {
    const lastRefresh = treeProvider.getLastSuccessfulRefreshAt();
    const refreshLabel = lastRefresh ? lastRefresh.toLocaleTimeString() : '—';
    treeView.message = `Updated ${refreshLabel}. Open the History Table to filter & export.`;
  };
  updateJobHistoryMessage();

  const updateNeedsOAuthContext = (): void => {
    const config = configProvider.getConfig();
    const needsOAuth = Boolean(config) && !config!.hasOAuthConfig();
    void vscode.commands.executeCommand('setContext', 'b2c-dx.jobs.needsOAuth', needsOAuth);
  };
  updateNeedsOAuthContext();

  if (treeView.visible) {
    treeProvider.startPolling();
    updateJobHistoryMessage();
  }

  const visibilityListener = treeView.onDidChangeVisibility((event) => {
    if (event.visible) {
      treeProvider.startPolling();
      treeProvider.refresh();
      updateJobHistoryMessage();
    } else {
      treeProvider.stopPolling();
      updateJobHistoryMessage();
    }
  });

  // Refresh the Definitions view when local job artifacts change. Job
  // definitions may use non-standard filenames (discovery is content-based and
  // configurable), so watch any .xml plus steptypes.json. Refresh is cheap
  // (cached + content-filtered); the view also refreshes when it becomes visible.
  const definitionsWatcher = vscode.workspace.createFileSystemWatcher('**/*.{xml,json}');
  definitionsWatcher.onDidCreate(() => definitionsProvider.refresh());
  definitionsWatcher.onDidChange(() => definitionsProvider.refresh());
  definitionsWatcher.onDidDelete(() => definitionsProvider.refresh());

  const definitionsVisibilityListener = definitionsView.onDidChangeVisibility((event) => {
    if (event.visible) definitionsProvider.refresh();
  });

  const messageRefreshTimer = setInterval(() => {
    updateJobHistoryMessage();
  }, 5000);

  const builtInScaffoldsDir = path.join(context.extensionPath, 'dist', 'data', 'scaffolds');
  const commandDisposables = registerJobsCommands(configProvider, treeProvider, {
    builtInScaffoldsDir,
    definitionsProvider,
    extensionUri: context.extensionUri,
  });

  configProvider.onDidReset(() => {
    treeProvider.stopPolling();
    updateNeedsOAuthContext();
    treeProvider.refresh();
    definitionsProvider.refresh();
    if (treeView.visible) {
      treeProvider.startPolling();
    }
    updateJobHistoryMessage();
  });

  context.subscriptions.push(
    treeView,
    definitionsView,
    visibilityListener,
    definitionsVisibilityListener,
    definitionsWatcher,
    ...commandDisposables,
    {
      dispose: () => {
        clearInterval(messageRefreshTimer);
        treeProvider.stopPolling();
      },
    },
  );
}
