/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
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
    const realmLabel = c.label || c.tenantId || 'Not configured';
    if (c.status === 'connected') {
      statusBar.text = `$(plug) CIP: ${realmLabel}`;
      statusBar.tooltip = `CIP Connected · ${realmLabel}\nTenant: ${c.tenantId} · Env: ${c.env}\nHost: ${c.host}\n${c.message ?? ''}\nClick to switch realm`;
      statusBar.backgroundColor = undefined;
      statusBar.color = new vscode.ThemeColor('charts.green');
      statusBar.command = 'b2c-dx.cipAnalytics.switchRealm';
    } else if (c.status === 'testing') {
      statusBar.text = `$(sync~spin) CIP: Connecting…`;
      statusBar.tooltip = `Connecting to CIP host ${c.host}\nTenant: ${c.tenantId || '(not set)'}`;
      statusBar.backgroundColor = undefined;
      statusBar.color = undefined;
      statusBar.command = undefined;
    } else {
      statusBar.text = `$(debug-disconnect) CIP: ${realmLabel}`;
      statusBar.tooltip = `CIP Disconnected · ${realmLabel}\n${c.message ?? ''}\nClick to switch or configure realm`;
      statusBar.backgroundColor = undefined;
      statusBar.color = new vscode.ThemeColor('errorForeground');
      statusBar.command = 'b2c-dx.cipAnalytics.switchRealm';
    }
    statusBar.show();
  };
  refreshStatusBar();
  context.subscriptions.push(statusBar, connection.onDidChange(refreshStatusBar));

  // Tree view
  const treeProvider = new CipAnalyticsTreeDataProvider(configProvider, connection, log);
  const treeView = vscode.window.createTreeView('b2cCipAnalytics', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // Webview manager
  const webviewManager = new CipWebviewManager(context, configProvider, connection, log);

  // Commands
  const refreshDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.refresh', async () => {
    await connection.resetToDefaults();
    treeProvider.refresh();
  });

  const openReportDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.openReport',
    async (report?: CipReportEntry, realmId?: string) => {
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
      await webviewManager.openReport(report, realmId);
    },
  );

  const browseTablesDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.browseTables',
    async (realmId?: string) => {
      log.appendLine('[CIP Analytics] Opening tables browser');
      await webviewManager.openTablesBrowser(realmId);
    },
  );

  const queryBuilderDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.queryBuilder',
    async (realmId?: string) => {
      log.appendLine('[CIP Analytics] Opening Query Builder');
      await webviewManager.openQueryBuilder(realmId);
    },
  );

  const configureDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.configureConnection',
    async (arg?: string | {realmId?: string}, addNew?: boolean) => {
      const realmId = typeof arg === 'string' ? arg : arg?.realmId;
      if (addNew && realmId) {
        await addConfigurationFlow(connection, realmId);
      } else {
        if (realmId) await connection.switchRealm(realmId);
        await configureConnectionFlow(connection);
      }
    },
  );

  const testDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.testConnection',
    async (arg?: string | {realmId?: string}) => {
      const realmId = typeof arg === 'string' ? arg : arg?.realmId;
      if (realmId) {
        await connection.switchRealm(realmId);
      }
      const host = connection.resolvedHost();
      const result = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Connecting to CIP host ${host}…`},
        () => connection.testConnection(),
      );
      if (result.status === 'connected') {
        vscode.window.showInformationMessage(`CIP connected: ${result.message ?? 'OK'}`);
      } else {
        vscode.window.showErrorMessage(`CIP connection failed: ${result.message ?? 'Unknown error'}`);
      }
    },
  );

  const switchRealmDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.switchRealm',
    async () => switchRealmFlow(connection),
  );

  const addRealmDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.addRealm',
    async () => addRealmFlow(connection),
  );

  const removeRealmDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.removeRealm',
    async () => removeRealmFlow(connection),
  );

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
    switchRealmDisposable,
    addRealmDisposable,
    removeRealmDisposable,
  );

  log.appendLine('[CIP Analytics] Feature registered successfully');
}

/**
 * Pick env/host for a new or existing connection. Returns {tenantId, env, host} or undefined if cancelled.
 */
async function pickConnectionDetails(
  title: string,
  defaults: {tenantId: string; env: CipEnv; host: string},
): Promise<{tenantId: string; env: CipEnv; host: string} | undefined> {
  const tenantId = await vscode.window.showInputBox({
    title: `${title} · Tenant ID`,
    prompt: 'Organization identifier (e.g., zzat_prd, bjmp_sbx001)',
    value: defaults.tenantId,
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Tenant ID is required'),
  });
  if (tenantId === undefined) return undefined;

  const envPick = await vscode.window.showQuickPick(
    [
      {label: 'Production', description: DEFAULT_CIP_HOST, env: 'prod' as CipEnv},
      {label: 'Staging', description: DEFAULT_CIP_STAGING_HOST, env: 'staging' as CipEnv},
      {label: 'Custom', description: 'Enter your own CIP host', env: 'custom' as CipEnv},
    ],
    {title: `${title} · Environment`, placeHolder: 'Choose the CIP environment', ignoreFocusOut: true},
  );
  if (!envPick) return undefined;

  let host = '';
  if (envPick.env === 'custom') {
    const picked = await vscode.window.showInputBox({
      title: `${title} · Custom Host`,
      prompt: 'CIP JDBC host (without scheme), e.g., jdbc.custom.analytics.example.com',
      value: defaults.env === 'custom' ? defaults.host : '',
      ignoreFocusOut: true,
      validateInput: (v) => (v.trim() ? undefined : 'Host is required for custom environment'),
    });
    if (picked === undefined) return undefined;
    host = picked.trim();
  }
  return {tenantId: tenantId.trim(), env: envPick.env, host};
}

/**
 * Add a new connection to an existing realm group.
 */
async function addConfigurationFlow(connection: CipConnectionService, groupId: string): Promise<void> {
  const current = connection.get();
  const details = await pickConnectionDetails('New Connection', {tenantId: '', env: current.env, host: current.host});
  if (!details) return;
  const id = await connection.addRealm({
    groupId,
    label: details.tenantId,
    tenantId: details.tenantId,
    env: details.env,
    host: details.host,
  });
  await connection.switchRealm(id);
  const result = await vscode.window.withProgress(
    {location: vscode.ProgressLocation.Notification, title: `Connecting to ${details.tenantId}…`},
    () => connection.testConnection(),
  );
  if (result.status === 'connected') {
    vscode.window.showInformationMessage(`Connected: ${result.message ?? 'OK'}`);
  } else {
    vscode.window.showErrorMessage(`Connection failed: ${result.message ?? 'Unknown error'}`);
  }
}

/**
 * Edit the active realm configuration (tenant → environment → host → test).
 */
async function configureConnectionFlow(connection: CipConnectionService): Promise<void> {
  const current = connection.get();
  const details = await pickConnectionDetails('Configure Connection', {
    tenantId: current.tenantId,
    env: current.env,
    host: current.host,
  });
  if (!details) return;

  await connection.update({tenantId: details.tenantId, env: details.env, host: details.host});

  const result = await vscode.window.withProgress(
    {location: vscode.ProgressLocation.Notification, title: `Connecting to CIP host ${connection.resolvedHost()}…`},
    () => connection.testConnection(),
  );
  if (result.status === 'connected') {
    vscode.window.showInformationMessage(`CIP connected: ${result.message ?? 'OK'}`);
  } else {
    vscode.window.showErrorMessage(`CIP connection failed: ${result.message ?? 'Unknown error'}`);
  }
}

/**
 * Show a QuickPick of all saved realms; switch to the selected one and auto-test.
 * Includes "Add new realm…" and "Remove realm…" items at the bottom.
 */
async function switchRealmFlow(connection: CipConnectionService): Promise<void> {
  const realms = connection.getRealms();
  const current = connection.get();

  type RealmItem = vscode.QuickPickItem & {realmId?: string; action?: 'add' | 'remove' | 'configure'};

  const items: RealmItem[] = realms.map((r) => ({
    label: r.label || r.tenantId,
    description: `${r.tenantId} · ${r.env}`,
    detail: r.id === current.id ? '$(check) Active' : undefined,
    realmId: r.id,
  }));

  items.push(
    {label: '', kind: vscode.QuickPickItemKind.Separator} as RealmItem,
    {label: '$(add) Add new realm…', action: 'add'},
    {label: '$(edit) Edit active realm…', action: 'configure'},
    {label: '$(trash) Remove a realm…', action: 'remove'},
  );

  const picked = await vscode.window.showQuickPick(items, {
    title: 'CIP Analytics · Switch Realm',
    placeHolder: realms.length === 0 ? 'No realms configured — add one' : 'Select a realm to connect',
    matchOnDescription: true,
  });
  if (!picked) return;

  if (picked.action === 'add') {
    await addRealmFlow(connection);
  } else if (picked.action === 'configure') {
    await configureConnectionFlow(connection);
  } else if (picked.action === 'remove') {
    await removeRealmFlow(connection);
  } else if (picked.realmId && picked.realmId !== current.id) {
    await connection.switchRealm(picked.realmId);
    const result = await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Connecting to ${picked.label}…`},
      () => connection.testConnection(),
    );
    if (result.status === 'connected') {
      vscode.window.showInformationMessage(`Switched to realm "${picked.label}": ${result.message ?? ''}`);
    } else {
      vscode.window.showWarningMessage(`Realm "${picked.label}" not connected: ${result.message ?? 'unknown error'}`);
    }
  }
}

/**
 * Add a new realm group — only asks for Realm ID (e.g. "bjmp", "zzat").
 * The group acts as a container; add connections via Configure (⚙ button).
 */
async function addRealmFlow(connection: CipConnectionService): Promise<void> {
  const label = await vscode.window.showInputBox({
    title: 'Add Realm',
    prompt: 'Enter the Realm ID (e.g. bjmp, zzat)',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Realm ID is required'),
  });
  if (label === undefined) return;

  const trimmedLabel = label.trim();
  await connection.addRealmGroup(trimmedLabel);

  vscode.window.showInformationMessage(
    `Realm "${trimmedLabel}" added. Expand it and use ⚙ Configure to add a connection.`,
  );
}

/**
 * Pick a realm to delete. Cannot delete the last remaining realm.
 */
async function removeRealmFlow(connection: CipConnectionService): Promise<void> {
  const realms = connection.getRealms();
  if (realms.length === 0) {
    vscode.window.showInformationMessage('No realms to remove.');
    return;
  }

  const items = realms.map((r) => ({
    label: r.label || r.tenantId,
    description: `${r.tenantId} · ${r.env}`,
    realmId: r.id,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: 'CIP Analytics · Remove Realm',
    placeHolder: 'Select a realm to remove',
  });
  if (!picked) return;

  const confirm = await vscode.window.showWarningMessage(
    `Remove realm "${picked.label}"?`,
    {modal: true},
    'Remove',
  );
  if (confirm !== 'Remove') return;

  await connection.removeRealm(picked.realmId);
  vscode.window.showInformationMessage(`Realm "${picked.label}" removed.`);
}
