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
import {CipQueryLibraryService} from './cip-query-library-service.js';
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
      statusBar.tooltip = `CIP Connected · ${realmLabel}\nTenant: ${c.tenantId} · Env: ${c.env}\nHost: ${c.host}\n${c.message ?? ''}\nClick to switch connection`;
      statusBar.backgroundColor = undefined;
      statusBar.color = new vscode.ThemeColor('statusBar.foreground');
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

  // Saved-query library (Query Builder → Save / Load).
  const queryLibrary = new CipQueryLibraryService(context.workspaceState);
  context.subscriptions.push(queryLibrary);

  // Webview manager
  const webviewManager = new CipWebviewManager(context, configProvider, connection, queryLibrary, log);

  // Commands
  const refreshDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.refresh', async () => {
    treeProvider.refresh();
  });

  const resetFromDwDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.resetFromDwJson', async () => {
    await resetFromDwJsonFlow(connection);
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

  const switchConnectionDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.switchConnection',
    async (arg?: string | {realmId?: string}) => {
      const realmId = typeof arg === 'string' ? arg : arg?.realmId;
      await switchConnectionFlow(connection, realmId);
    },
  );

  const addRealmDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.addRealm',
    async () => addRealmFlow(connection),
  );

  const removeRealmDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.removeRealm',
    async (arg?: string | {realmId?: string}) => {
      const realmId = typeof arg === 'string' ? arg : arg?.realmId;
      await removeRealmFlow(connection, realmId);
    },
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
    switchConnectionDisposable,
    addRealmDisposable,
    removeRealmDisposable,
    resetFromDwDisposable,
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
 * Show a QuickPick of realm groups first, then hand off to connection switching
 * within the selected realm.
 */
async function switchRealmFlow(connection: CipConnectionService): Promise<void> {
  const groups = connection.getRealmGroups();
  const current = connection.get();

  if (groups.length === 0) {
    vscode.window.showInformationMessage('No realms configured — add one first.');
    return;
  }

  const items = groups.map((g) => {
    const count = connection.getConnectionsForGroup(g.id).length;
    return {
      label: g.label,
      description: `${count} connection${count === 1 ? '' : 's'}`,
      detail: g.id === current.groupId ? '$(check) Active realm' : undefined,
      realmId: g.id,
    };
  });

  const picked = await vscode.window.showQuickPick(items, {
    title: 'CIP Analytics · Switch Realm',
    placeHolder: 'Select a realm',
    matchOnDescription: true,
  });
  if (!picked) return;

  await switchConnectionFlow(connection, picked.realmId);
}

/**
 * Show a QuickPick of saved tenant connections (optionally scoped to one realm group);
 * switch to the selected one and auto-test. Includes add/edit/remove actions.
 */
async function switchConnectionFlow(connection: CipConnectionService, groupId?: string): Promise<void> {
  const scoped = groupId ? connection.getConnectionsForGroup(groupId) : connection.getRealms();
  const realms = [...scoped];
  const current = connection.get();

  type RealmItem = vscode.QuickPickItem & {realmId?: string; action?: 'add' | 'remove' | 'configure'};

  const items: RealmItem[] = realms.map((r) => ({
    label: r.tenantId,
    description: `${r.label} · ${r.env}`,
    detail: r.id === current.id ? '$(check) Active' : undefined,
    realmId: r.id,
  }));

  items.push(
    {label: '', kind: vscode.QuickPickItemKind.Separator} as RealmItem,
    {label: '$(add) Add new connection…', action: 'add'},
    {label: '$(edit) Edit a connection…', action: 'configure'},
    {label: '$(trash) Remove a connection…', action: 'remove'},
  );

  const picked = await vscode.window.showQuickPick(items, {
    title: groupId ? 'CIP Analytics · Switch Connection' : 'CIP Analytics · Switch Connection',
    placeHolder: realms.length === 0 ? 'No connections configured — add one' : 'Select a tenant connection',
    matchOnDescription: true,
  });
  if (!picked) return;

  if (picked.action === 'add') {
    if (groupId) {
      await addConfigurationFlow(connection, groupId);
    } else {
      await addRealmFlow(connection);
    }
  } else if (picked.action === 'configure') {
    await editConnectionFlow(connection, groupId);
  } else if (picked.action === 'remove') {
    await removeConnectionFlow(connection, groupId);
  } else if (picked.realmId && picked.realmId !== current.id) {
    await connection.switchRealm(picked.realmId);
    const result = await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Connecting to ${picked.label}…`},
      () => connection.testConnection(),
    );
    if (result.status === 'connected') {
      vscode.window.showInformationMessage(`Switched to connection "${picked.label}": ${result.message ?? ''}`);
    } else {
      vscode.window.showWarningMessage(
        `Connection "${picked.label}" not connected: ${result.message ?? 'unknown error'}`,
      );
    }
  }
}

/**
 * Pick a saved connection and run the configure flow for that specific target.
 */
async function editConnectionFlow(connection: CipConnectionService, groupId?: string): Promise<void> {
  const realms = groupId ? connection.getConnectionsForGroup(groupId) : connection.getRealms();
  if (realms.length === 0) {
    vscode.window.showInformationMessage('No connections to edit.');
    return;
  }

  const current = connection.get();
  const items = realms.map((r) => ({
    label: r.tenantId,
    description: `${r.label} · ${r.env}`,
    detail: r.id === current.id ? '$(check) Active' : undefined,
    realmId: r.id,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: groupId ? 'CIP Analytics · Edit Connection' : 'CIP Analytics · Edit Connection',
    placeHolder: 'Select a connection to edit',
    matchOnDescription: true,
  });
  if (!picked) return;

  await connection.switchRealm(picked.realmId);
  await configureConnectionFlow(connection);
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
 * Remove a realm group (and all connections under it).
 */
async function removeRealmFlow(connection: CipConnectionService, groupId?: string): Promise<void> {
  const groups = connection.getRealmGroups();
  if (groups.length === 0) {
    vscode.window.showInformationMessage('No realms to remove.');
    return;
  }

  let target = groups.find((g) => g.id === groupId);
  if (!target) {
    const active = connection.get();
    const items = groups.map((g) => {
      const count = connection.getConnectionsForGroup(g.id).length;
      return {
        label: g.label,
        description: `${count} connection${count === 1 ? '' : 's'}`,
        detail: g.id === active.groupId ? '$(check) Active realm' : undefined,
        realmId: g.id,
      };
    });

    const picked = await vscode.window.showQuickPick(items, {
      title: 'CIP Analytics · Remove Realm',
      placeHolder: 'Select a realm to remove',
      matchOnDescription: true,
    });
    if (!picked) return;
    target = groups.find((g) => g.id === picked.realmId);
  }
  if (!target) return;

  const connectionCount = connection.getConnectionsForGroup(target.id).length;
  const confirm = await vscode.window.showWarningMessage(
    `Remove realm "${target.label}" and its ${connectionCount} connection${connectionCount === 1 ? '' : 's'}?`,
    {modal: true},
    'Remove',
  );
  if (confirm !== 'Remove') return;

  await connection.removeRealmGroup(target.id);
  vscode.window.showInformationMessage(`Realm "${target.label}" removed.`);
}

/**
 * Destructive reset: replace stored realms/connections with dw.json-derived defaults.
 */
async function resetFromDwJsonFlow(connection: CipConnectionService): Promise<void> {
  const currentGroups = connection.getRealmGroups();
  const currentConnections = connection.getRealms();

  const confirm = await vscode.window.showWarningMessage(
    'Reset CIP realms from dw.json? This removes manually added realms and connections.',
    {
      modal: true,
      detail: `Current saved realms: ${currentGroups.length}, connections: ${currentConnections.length}`,
    },
    'Reset',
  );

  if (confirm !== 'Reset') return;

  await connection.resetToDefaults();
  vscode.window.showInformationMessage('CIP realms reset from dw.json.');
}

/**
 * Pick a connection to delete. Cannot delete the last remaining connection.
 */
async function removeConnectionFlow(connection: CipConnectionService, groupId?: string): Promise<void> {
  const realms = groupId ? connection.getConnectionsForGroup(groupId) : connection.getRealms();
  if (realms.length === 0) {
    vscode.window.showInformationMessage('No connections to remove.');
    return;
  }

  const items = realms.map((r) => ({
    label: r.tenantId,
    description: `${r.label} · ${r.env}`,
    realmId: r.id,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: groupId ? 'CIP Analytics · Remove Connection (Realm)' : 'CIP Analytics · Remove Connection',
    placeHolder: 'Select a connection to remove',
  });
  if (!picked) return;

  const confirm = await vscode.window.showWarningMessage(
    `Remove connection "${picked.label}"?`,
    {modal: true},
    'Remove',
  );
  if (confirm !== 'Remove') return;

  await connection.removeRealm(picked.realmId);
  vscode.window.showInformationMessage(`Connection "${picked.label}" removed.`);
}
