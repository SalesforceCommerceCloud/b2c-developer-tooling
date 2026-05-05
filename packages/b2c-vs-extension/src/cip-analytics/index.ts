/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {DEFAULT_CIP_HOST, DEFAULT_CIP_STAGING_HOST} from '@salesforce/b2c-tooling-sdk/clients';
import {listCipReports} from '@salesforce/b2c-tooling-sdk/operations/cip';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {CipAnalyticsTreeDataProvider} from './cip-tree-provider.js';
import {CipConnectionService, type CipEnv} from './cip-connection-service.js';
import {CipWebviewManager} from './cip-webview-manager.js';
import type {CipReportEntry} from './types.js';

/**
 * Register CIP Analytics feature.
 * Follows the pattern from api-browser/index.ts and sandbox-tree/index.ts.
 */
export function registerCipAnalytics(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): void {
  // Shared connection state — one per workspace, consumed by every webview panel.
  const connection = new CipConnectionService(configProvider, context.workspaceState, log);
  context.subscriptions.push(connection);

  // Status bar item — sits next to the B2C instance indicator. Click opens the configure flow.
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 49);
  statusBar.command = 'b2c-dx.cipAnalytics.configureConnection';
  const refreshStatusBar = () => {
    const c = connection.get();
    if (c.status === 'connected') {
      // `plug` codicon = connected / wired up.
      statusBar.text = `$(plug) CIP: ${c.tenantId} @ ${c.env}`;
      statusBar.tooltip = `CIP Host Connected\nHost: ${c.host}\n${c.message ?? ''}\nClick to reconfigure`;
      statusBar.backgroundColor = undefined;
      statusBar.color = new vscode.ThemeColor('charts.green');
    } else if (c.status === 'testing') {
      statusBar.text = `$(sync~spin) Connecting to CIP host ${c.host}`;
      statusBar.tooltip = `Connecting to CIP host ${c.host}\nTenant: ${c.tenantId || '(not set)'}`;
      statusBar.backgroundColor = undefined;
      statusBar.color = undefined;
    } else {
      const label = c.tenantId ? `${c.tenantId} (disconnected)` : 'Not configured';
      // `debug-disconnect` codicon = broken plug; signals a disconnected state.
      statusBar.text = `$(debug-disconnect) CIP: ${label}`;
      statusBar.tooltip = `CIP Host Disconnected\n${c.message ?? 'Click to configure'}\nClick to configure`;
      statusBar.backgroundColor = undefined;
      statusBar.color = new vscode.ThemeColor('errorForeground');
    }
    statusBar.show();
  };
  refreshStatusBar();
  context.subscriptions.push(statusBar, connection.onDidChange(refreshStatusBar));

  // Tree view
  const treeProvider = new CipAnalyticsTreeDataProvider(configProvider, log);
  const treeView = vscode.window.createTreeView('b2cCipAnalytics', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // Webview manager
  const webviewManager = new CipWebviewManager(context, configProvider, connection, log);

  // Commands
  const refreshDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.refresh', () => {
    treeProvider.refresh();
  });

  const openReportDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.openReport',
    async (report?: CipReportEntry) => {
      if (!report) {
        const allReports = listCipReports();
        const items = allReports.map((r) => ({
          label: r.name,
          description: r.category,
          detail: r.description,
          report: r,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a CIP Analytics report to open',
          matchOnDescription: true,
          matchOnDetail: true,
        });

        if (!selected) {
          return;
        }
        report = selected.report;
      }

      log.appendLine(`[CIP Analytics] Opening dashboard for report: ${report.name}`);
      await webviewManager.openReport(report);
    },
  );

  const browseTablesDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.browseTables', async () => {
    log.appendLine('[CIP Analytics] Opening tables browser');
    await webviewManager.openTablesBrowser();
  });

  const queryBuilderDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.queryBuilder', async () => {
    log.appendLine('[CIP Analytics] Opening Query Builder');
    await webviewManager.openQueryBuilder();
  });

  const configureDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.configureConnection',
    async () => configureConnectionFlow(connection),
  );

  const testDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.testConnection', async () => {
    const host = connection.resolvedHost();
    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Connecting to CIP host ${host}`},
      () => connection.testConnection(),
    );
  });

  // Refresh tree when config changes
  configProvider.onDidReset(() => {
    treeProvider.refresh();
  });

  context.subscriptions.push(
    treeView,
    refreshDisposable,
    openReportDisposable,
    browseTablesDisposable,
    queryBuilderDisposable,
    configureDisposable,
    testDisposable,
  );

  log.appendLine('[CIP Analytics] Feature registered successfully');
}

/**
 * Multi-step QuickPick flow: tenant → environment → (optional) custom host → auto-test.
 */
async function configureConnectionFlow(connection: CipConnectionService): Promise<void> {
  const current = connection.get();

  const tenantId = await vscode.window.showInputBox({
    title: 'CIP Connection · Tenant ID',
    prompt: 'Organization identifier (e.g., zzat_prd, zzat_sbx)',
    value: current.tenantId,
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Tenant ID is required'),
  });
  if (tenantId === undefined) return;

  const envPick = await vscode.window.showQuickPick(
    [
      {label: 'Production', description: DEFAULT_CIP_HOST, env: 'prod' as CipEnv},
      {label: 'Staging', description: DEFAULT_CIP_STAGING_HOST, env: 'staging' as CipEnv},
      {label: 'Custom', description: 'Enter your own CIP host', env: 'custom' as CipEnv},
    ],
    {
      title: 'CIP Connection · Environment',
      placeHolder: 'Choose the CIP environment',
      ignoreFocusOut: true,
    },
  );
  if (!envPick) return;

  let host = '';
  if (envPick.env === 'custom') {
    const picked = await vscode.window.showInputBox({
      title: 'CIP Connection · Custom Host',
      prompt: 'CIP JDBC host (without scheme), e.g., jdbc.custom.analytics.example.com',
      value: current.env === 'custom' ? current.host : '',
      ignoreFocusOut: true,
      validateInput: (v) => (v.trim() ? undefined : 'Host is required for custom environment'),
    });
    if (picked === undefined) return;
    host = picked.trim();
  }

  await connection.update({tenantId: tenantId.trim(), env: envPick.env, host});

  // Auto-test — users can always re-run via b2c-dx.cipAnalytics.testConnection
  const result = await vscode.window.withProgress(
    {location: vscode.ProgressLocation.Notification, title: `Connecting to CIP host ${connection.resolvedHost()}`},
    () => connection.testConnection(),
  );
  if (result.status === 'connected') {
    vscode.window.showInformationMessage(`CIP connected: ${result.message ?? ''}`);
  } else {
    vscode.window.showWarningMessage(`CIP not connected: ${result.message ?? 'unknown error'}`);
  }
}
