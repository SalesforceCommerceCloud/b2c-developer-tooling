/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createOdsClient} from '@salesforce/b2c-tooling-sdk/clients';
import * as vscode from 'vscode';
import type {SandboxConfigProvider} from './sandbox-config.js';
import type {RealmTreeItem, SandboxTreeDataProvider, SandboxTreeItem} from './sandbox-tree-provider.js';

const DEFAULT_ODS_HOST = 'admin.dx.commercecloud.salesforce.com';

function getOdsClientFromConfig(configProvider: SandboxConfigProvider) {
  const config = configProvider.getConfigProvider().getConfig();
  if (!config) throw new Error('No B2C Commerce configuration found. Configure dw.json or SFCC_* env vars.');
  if (!config.hasOAuthConfig())
    throw new Error('OAuth credentials required. Set clientId and clientSecret in dw.json.');
  const host = config.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
  return createOdsClient({host}, config.createOAuth());
}

const SANDBOX_DETAIL_SCHEME = 'b2c-sandbox';

class SandboxDetailProvider implements vscode.TextDocumentContentProvider {
  private contents = new Map<string, string>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  setContent(uri: vscode.Uri, content: string): void {
    this.contents.set(uri.toString(), content);
    this._onDidChange.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contents.get(uri.toString()) ?? '';
  }
}

export function registerSandboxCommands(
  configProvider: SandboxConfigProvider,
  treeProvider: SandboxTreeDataProvider,
): vscode.Disposable[] {
  const detailProvider = new SandboxDetailProvider();
  const detailRegistration = vscode.workspace.registerTextDocumentContentProvider(
    SANDBOX_DETAIL_SCHEME,
    detailProvider,
  );
  const refresh = vscode.commands.registerCommand('b2c-dx.sandbox.refresh', () => {
    treeProvider.refresh();
  });

  const addRealm = vscode.commands.registerCommand('b2c-dx.sandbox.addRealm', async () => {
    const defaultRealm = configProvider.getDefaultRealm();
    const realm = await vscode.window.showInputBox({
      title: 'Add Realm',
      prompt: 'Enter the ODS realm to browse',
      placeHolder: 'e.g., abcd',
      value: defaultRealm,
      validateInput: (v) => (v.trim() ? null : 'Realm is required'),
    });
    if (!realm) return;
    configProvider.addRealm(realm.trim());
    treeProvider.refresh();
  });

  const removeRealm = vscode.commands.registerCommand('b2c-dx.sandbox.removeRealm', (node: RealmTreeItem) => {
    if (!node || node.nodeType !== 'realm') return;
    configProvider.removeRealm(node.realm);
    treeProvider.refresh();
  });

  const create = vscode.commands.registerCommand('b2c-dx.sandbox.create', async (node?: RealmTreeItem) => {
    // Use the realm directly when invoked from a realm context menu, otherwise prompt
    let realm: string | undefined;
    if (node?.nodeType === 'realm') {
      realm = node.realm;
    } else {
      realm = await vscode.window.showInputBox({
        title: 'Create Sandbox — Realm',
        prompt: 'Enter the realm for the new sandbox',
        value: configProvider.getDefaultRealm(),
        validateInput: (v) => (v.trim() ? null : 'Realm is required'),
      });
      if (!realm) return;
      realm = realm.trim();
    }

    const ttlStr = await vscode.window.showInputBox({
      title: 'Create Sandbox — TTL (hours)',
      prompt: 'Time to live in hours (0 = no expiration)',
      value: '0',
      validateInput: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) return 'Enter a non-negative number';
        return null;
      },
    });
    if (ttlStr === undefined) return;
    const ttl = Number(ttlStr);

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Creating sandbox in realm ${realm}...`},
      async () => {
        try {
          const odsClient = getOdsClientFromConfig(configProvider);
          const result = await odsClient.POST('/sandboxes', {
            body: {realm: realm!, ttl, analyticsEnabled: false},
          });
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox create failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          vscode.window.showInformationMessage('Sandbox creation started.');
          configProvider.addRealm(realm!);
          treeProvider.refreshRealm(realm!);
          treeProvider.startPollingRealm(realm!);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox create failed: ${message}`);
        }
      },
    );
  });

  const deleteSandbox = vscode.commands.registerCommand('b2c-dx.sandbox.delete', async (node: SandboxTreeItem) => {
    if (!node) return;
    const choice = await vscode.window.showWarningMessage(
      `Delete sandbox "${node.sandbox.id}"? This cannot be undone.`,
      {modal: true},
      'Delete',
      'Cancel',
    );
    if (choice !== 'Delete') return;

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Deleting sandbox ${node.sandbox.id}...`},
      async () => {
        try {
          const odsClient = getOdsClientFromConfig(configProvider);
          const result = await odsClient.DELETE('/sandboxes/{sandboxId}', {
            params: {path: {sandboxId: node.sandbox.id}},
          });
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox delete failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          vscode.window.showInformationMessage('Sandbox deleted.');
          treeProvider.refreshRealm(node.realm);
          treeProvider.startPollingRealm(node.realm);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox delete failed: ${message}`);
        }
      },
    );
  });

  const sandboxOperation = (operationType: 'start' | 'stop' | 'restart') => async (node: SandboxTreeItem) => {
    if (!node) return;

    if (operationType === 'stop') {
      const choice = await vscode.window.showWarningMessage(
        `Stop sandbox "${node.sandbox.id}"? Running processes will be terminated.`,
        {modal: true},
        'Stop',
        'Cancel',
      );
      if (choice !== 'Stop') return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing sandbox ${node.sandbox.id}...`,
      },
      async () => {
        try {
          const odsClient = getOdsClientFromConfig(configProvider);
          const result = await odsClient.POST('/sandboxes/{sandboxId}/operations', {
            params: {path: {sandboxId: node.sandbox.id}},
            body: {operation: operationType},
          });
          if (result.error) {
            vscode.window.showErrorMessage(
              `Sandbox ${operationType} failed: ${getApiErrorMessage(result.error, result.response)}`,
            );
            return;
          }
          vscode.window.showInformationMessage(`Sandbox ${operationType} initiated.`);
          treeProvider.refreshRealm(node.realm);
          treeProvider.startPollingRealm(node.realm);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Sandbox ${operationType} failed: ${message}`);
        }
      },
    );
  };

  const start = vscode.commands.registerCommand('b2c-dx.sandbox.start', sandboxOperation('start'));
  const stop = vscode.commands.registerCommand('b2c-dx.sandbox.stop', sandboxOperation('stop'));
  const restart = vscode.commands.registerCommand('b2c-dx.sandbox.restart', sandboxOperation('restart'));

  const viewDetails = vscode.commands.registerCommand('b2c-dx.sandbox.viewDetails', async (node: SandboxTreeItem) => {
    if (!node) return;
    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: 'Fetching sandbox details...'},
      async () => {
        try {
          const details = await treeProvider.getSandboxDetails(node.sandbox.id);
          if (!details) {
            vscode.window.showErrorMessage('Could not fetch sandbox details.');
            return;
          }
          const content = JSON.stringify(details, null, 2);
          const uri = vscode.Uri.parse(`${SANDBOX_DETAIL_SCHEME}:${node.label ?? node.sandbox.id}.json`);
          detailProvider.setContent(uri, content);
          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.languages.setTextDocumentLanguage(doc, 'json');
          await vscode.window.showTextDocument(doc, {preview: true});
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Failed to fetch details: ${message}`);
        }
      },
    );
  });

  const openBM = vscode.commands.registerCommand('b2c-dx.sandbox.openBM', async (node: SandboxTreeItem) => {
    if (!node?.sandbox.hostName) {
      vscode.window.showWarningMessage('No hostname available for this sandbox.');
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(`https://${node.sandbox.hostName}/on/demandware.store/Sites-Site`));
  });

  return [
    detailRegistration,
    refresh,
    addRealm,
    removeRealm,
    create,
    deleteSandbox,
    start,
    stop,
    restart,
    viewDetails,
    openBM,
  ];
}
