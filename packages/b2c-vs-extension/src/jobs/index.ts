/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'node:path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerJobsCommands} from './jobs-commands.js';
import {JobsTreeDataProvider} from './jobs-tree-provider.js';

const AUTO_REFRESH_CONTEXT_KEY = 'b2c-dx.jobs.autoRefreshEnabled';

/**
 * Wires the Job History tree view + commands.
 *
 * Per the post-W-22653699 review feedback the view is now part of the primary
 * "B2C-DX" panel (under Cartridges) and is `collapsed` by default. There is no
 * separate Job Definitions view anymore — the useful scaffold action moved to
 * the Cartridges right-click menu, and the heavy React webview was removed.
 *
 * Loading model: the view starts empty and waits for an explicit Refresh —
 * fetching job history hits OCAPI and can be slow on instances with thousands
 * of executions, so we don't pay that cost for users who only opened the side
 * panel to see Cartridges. Auto-Refresh remains a separate opt-in toggle for
 * users who want continuous polling once they've loaded the view.
 */
export function registerJobs(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const treeProvider = new JobsTreeDataProvider(configProvider);
  // No `showCollapseAll`: execution rows render as leaves, so there's nothing
  // to collapse — the button would be a dead control in the title bar.
  const treeView = vscode.window.createTreeView('b2cJobsExplorer', {
    treeDataProvider: treeProvider,
  });

  const updateJobHistoryMessage = (): void => {
    const lastRefresh = treeProvider.getLastSuccessfulRefreshAt();
    if (!treeProvider.isLoaded()) {
      treeView.message = 'Click Refresh to load job history.';
      return;
    }
    const refreshLabel = lastRefresh ? lastRefresh.toLocaleTimeString() : '—';
    const autoLabel = treeProvider.isPollingEnabled() ? ' · Auto-Refresh on' : '';
    treeView.message = `Updated ${refreshLabel}${autoLabel}`;
  };
  updateJobHistoryMessage();

  const updateNeedsOAuthContext = (): void => {
    const config = configProvider.getConfig();
    const needsOAuth = Boolean(config) && !config!.hasOAuthConfig();
    void vscode.commands.executeCommand('setContext', 'b2c-dx.jobs.needsOAuth', needsOAuth);
  };
  updateNeedsOAuthContext();

  const setAutoRefreshContext = (enabled: boolean): void => {
    void vscode.commands.executeCommand('setContext', AUTO_REFRESH_CONTEXT_KEY, enabled);
  };
  setAutoRefreshContext(false);

  // Loading is manual by default — the user must click Refresh (or enable
  // Auto-Refresh) to populate the view. This trades one extra click for a
  // guarantee that opening the side panel never blocks on OCAPI.
  //
  // Auto-refresh setting: if the user has explicitly opted into continuous
  // polling, treat that as the explicit load signal too — start polling
  // immediately AND fetch once so the view isn't blank while we wait for the
  // first interval tick.
  const autoRefreshSetting = vscode.workspace.getConfiguration('b2c-dx').get<boolean>('jobs.autoRefresh', false);
  if (autoRefreshSetting) {
    treeProvider.startPolling();
    if (!treeProvider.isLoaded()) treeProvider.refresh();
    setAutoRefreshContext(true);
    updateJobHistoryMessage();
  }

  const messageRefreshTimer = setInterval(() => {
    updateJobHistoryMessage();
  }, 5000);

  // Refresh the title-bar message the moment a fetch settles. Without this the
  // "Updated —" placeholder would linger until the next 5s tick of the timer
  // above — visible as a noticeable lag after pressing Refresh.
  const onDidLoadSub = treeProvider.onDidLoad(() => updateJobHistoryMessage());

  const builtInScaffoldsDir = path.join(context.extensionPath, 'dist', 'data', 'scaffolds');
  const commandDisposables = registerJobsCommands(configProvider, treeProvider, {
    builtInScaffoldsDir,
    extensionUri: context.extensionUri,
    onAutoRefreshChanged: (enabled) => {
      setAutoRefreshContext(enabled);
      updateJobHistoryMessage();
    },
  });

  configProvider.onDidReset(() => {
    treeProvider.stopPolling();
    setAutoRefreshContext(false);
    updateNeedsOAuthContext();
    treeProvider.resetLoaded();
    updateJobHistoryMessage();
  });

  context.subscriptions.push(treeView, onDidLoadSub, ...commandDisposables, {
    dispose: () => {
      clearInterval(messageRefreshTimer);
      treeProvider.stopPolling();
    },
  });
}
