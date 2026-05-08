/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  downloadSingleCartridge,
  listCodeVersions,
  getActiveCodeVersion,
  activateCodeVersion,
  createCodeVersion,
  reloadCodeVersion,
  deleteCodeVersion,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import {
  addCartridge,
  removeCartridge,
  getCartridgePath,
  type CartridgePosition,
} from '@salesforce/b2c-tooling-sdk/operations/sites';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as fs from 'fs';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {CartridgeItem, type CartridgeTreeItem, type CartridgeTreeProvider} from './cartridge-tree-provider.js';

function getInstance(configProvider: B2CExtensionConfig): B2CInstance | undefined {
  const instance = configProvider.getInstance();
  if (!instance) {
    vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
  }
  return instance ?? undefined;
}

function showError(err: unknown, outputChannel: vscode.OutputChannel): void {
  const message = err instanceof Error ? err.message : String(err);
  const cause = err instanceof Error && err.cause ? `\n  Cause: ${String(err.cause)}` : '';
  outputChannel.appendLine(`[Error] ${message}${cause}`);
  void vscode.window.showErrorMessage(`B2C DX: ${message.split('\n')[0]}`, 'Show Details').then((action) => {
    if (action === 'Show Details') outputChannel.show();
  });
}

// ---------------------------------------------------------------------------
// Download from Instance
// ---------------------------------------------------------------------------

function createDownloadCartridgeCommand(
  configProvider: B2CExtensionConfig,
  outputChannel: vscode.OutputChannel,
): (item: CartridgeItem) => Promise<void> {
  return async (item) => {
    const instance = getInstance(configProvider);
    if (!instance) return;

    let codeVersion = instance.config.codeVersion;
    if (!codeVersion) {
      try {
        const active = await getActiveCodeVersion(instance);
        if (active?.id) codeVersion = active.id;
      } catch {
        // fall through
      }
    }
    if (!codeVersion) {
      vscode.window.showErrorMessage('B2C DX: No code version configured.');
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      `This will overwrite local files in '${item.cartridge.name}'. Continue?`,
      {modal: true},
      'Download',
    );
    if (confirm !== 'Download') return;

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: `Downloading ${item.cartridge.name}...`},
      async (progress) => {
        try {
          const phaseLabels: Record<string, string> = {
            zipping: 'Creating server-side archive...',
            downloading: 'Downloading...',
            cleanup: 'Cleaning up...',
            extracting: 'Extracting files...',
          };
          await downloadSingleCartridge(instance, codeVersion, item.cartridge.name, item.cartridge.src, (info) => {
            progress.report({message: phaseLabels[info.phase] ?? info.phase});
          });

          outputChannel.appendLine(`[Download] ${item.cartridge.name} downloaded from instance`);
          vscode.window.showInformationMessage(`B2C DX: Downloaded '${item.cartridge.name}' from instance.`);
        } catch (err) {
          showError(err, outputChannel);
        }
      },
    );
  };
}

// ---------------------------------------------------------------------------
// Diff with Instance (TODO: disabled — needs optimization for large cartridges)
// ---------------------------------------------------------------------------

function createDiffCartridgeCommand(
  _configProvider: B2CExtensionConfig,
  _outputChannel: vscode.OutputChannel,
  _tempDirs: string[],
): (item: CartridgeItem) => Promise<void> {
  return async () => {
    vscode.window.showInformationMessage('B2C DX: Compare with Instance is not yet available.');
  };
}

// ---------------------------------------------------------------------------
// Site Cartridge Path
// ---------------------------------------------------------------------------

async function pickSite(instance: B2CInstance): Promise<string | undefined> {
  let siteItems: {label: string; siteId: string}[] = [];

  try {
    const {data, error} = await instance.ocapi.GET('/sites', {
      params: {query: {select: '(**)'}},
    });
    if (!error && data) {
      const sites = (data as {data?: {id?: string}[]}).data ?? [];
      siteItems = sites
        .filter((s): s is {id: string} => typeof s.id === 'string')
        .map((s) => ({label: s.id, siteId: s.id}));
    }
  } catch {
    // OAuth not available — fall through to manual input
  }

  siteItems.push({label: 'Business Manager (Sites-Site)', siteId: 'Sites-Site'});

  if (siteItems.length > 1) {
    const picked = await vscode.window.showQuickPick(siteItems, {
      title: 'Select a site',
      placeHolder: 'Choose a site',
    });
    return picked?.siteId;
  }

  return vscode.window.showInputBox({
    title: 'Site ID',
    placeHolder: 'Enter site ID (e.g. RefArch, Sites-Site)',
    validateInput: (v) => (v.trim() ? null : 'Site ID is required'),
  });
}

function createAddToSitePathCommand(
  configProvider: B2CExtensionConfig,
  outputChannel: vscode.OutputChannel,
): (item: CartridgeItem) => Promise<void> {
  return async (item) => {
    const instance = getInstance(configProvider);
    if (!instance) return;

    const siteId = await pickSite(instance);
    if (!siteId) return;

    const positionPick = await vscode.window.showQuickPick(
      [
        {label: 'First', position: 'first' as CartridgePosition},
        {label: 'Last', position: 'last' as CartridgePosition},
        {label: 'Before...', position: 'before' as CartridgePosition},
        {label: 'After...', position: 'after' as CartridgePosition},
      ],
      {title: 'Position in cartridge path'},
    );
    if (!positionPick) return;

    let target: string | undefined;
    if (positionPick.position === 'before' || positionPick.position === 'after') {
      try {
        const pathResult = await getCartridgePath(instance, siteId);
        if (pathResult.cartridgeList.length === 0) {
          vscode.window.showWarningMessage('B2C DX: Site has no cartridges yet. Adding as first.');
        }
        const targetPick = await vscode.window.showQuickPick(
          pathResult.cartridgeList.map((c) => ({label: c})),
          {title: `Add ${positionPick.position} which cartridge?`},
        );
        if (!targetPick) return;
        target = targetPick.label;
      } catch (err) {
        showError(err, outputChannel);
        return;
      }
    }

    try {
      const result = await addCartridge(instance, siteId, {
        name: item.cartridge.name,
        position: positionPick.position,
        target,
      });
      outputChannel.appendLine(`[Site Path] Added '${item.cartridge.name}' to ${siteId}: ${result.cartridges}`);
      vscode.window.showInformationMessage(`B2C DX: Added '${item.cartridge.name}' to ${siteId} cartridge path.`);
    } catch (err) {
      showError(err, outputChannel);
    }
  };
}

function createRemoveFromSitePathCommand(
  configProvider: B2CExtensionConfig,
  outputChannel: vscode.OutputChannel,
): (item: CartridgeItem) => Promise<void> {
  return async (item) => {
    const instance = getInstance(configProvider);
    if (!instance) return;

    const siteId = await pickSite(instance);
    if (!siteId) return;

    const confirm = await vscode.window.showWarningMessage(
      `Remove '${item.cartridge.name}' from ${siteId} cartridge path?`,
      {modal: true},
      'Remove',
    );
    if (confirm !== 'Remove') return;

    try {
      const result = await removeCartridge(instance, siteId, item.cartridge.name);
      outputChannel.appendLine(`[Site Path] Removed '${item.cartridge.name}' from ${siteId}: ${result.cartridges}`);
      vscode.window.showInformationMessage(`B2C DX: Removed '${item.cartridge.name}' from ${siteId} cartridge path.`);
    } catch (err) {
      showError(err, outputChannel);
    }
  };
}

// ---------------------------------------------------------------------------
// Code Version Management
// ---------------------------------------------------------------------------

function createListCodeVersionsCommand(
  configProvider: B2CExtensionConfig,
  treeView: vscode.TreeView<CartridgeTreeItem>,
  outputChannel: vscode.OutputChannel,
): () => Promise<void> {
  return async () => {
    const instance = getInstance(configProvider);
    if (!instance) return;

    try {
      const versions = await listCodeVersions(instance);
      const items = versions.map((v) => ({
        label: `${v.active ? '$(star-full) ' : ''}${v.id ?? 'unknown'}`,
        description: v.active ? 'Active' : '',
        version: v,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        title: 'Code Versions',
        placeHolder: 'Select a code version for actions',
      });
      if (!picked || !picked.version.id) return;

      const actions: {label: string; action: string}[] = [];
      if (!picked.version.active) {
        actions.push({label: '$(check) Activate', action: 'activate'});
      }
      actions.push({label: '$(debug-restart) Reload', action: 'reload'});
      if (!picked.version.active) {
        actions.push({label: '$(trash) Delete', action: 'delete'});
      }

      const actionPick = await vscode.window.showQuickPick(actions, {
        title: `Actions for "${picked.version.id}"`,
      });
      if (!actionPick) return;

      const versionId = picked.version.id;

      if (actionPick.action === 'activate') {
        await vscode.window.withProgress(
          {location: vscode.ProgressLocation.Notification, title: `Activating "${versionId}"...`},
          async () => {
            await activateCodeVersion(instance, versionId);
            treeView.description = `v: ${versionId}`;
          },
        );
        vscode.window.showInformationMessage(`B2C DX: Code version "${versionId}" activated.`);
      } else if (actionPick.action === 'reload') {
        await vscode.window.withProgress(
          {location: vscode.ProgressLocation.Notification, title: `Reloading "${versionId}"...`},
          () => reloadCodeVersion(instance, versionId),
        );
        vscode.window.showInformationMessage(`B2C DX: Code version "${versionId}" reloaded.`);
      } else if (actionPick.action === 'delete') {
        const confirm = await vscode.window.showWarningMessage(
          `Delete code version "${versionId}"? This cannot be undone.`,
          {modal: true},
          'Delete',
        );
        if (confirm === 'Delete') {
          await vscode.window.withProgress(
            {location: vscode.ProgressLocation.Notification, title: `Deleting "${versionId}"...`},
            () => deleteCodeVersion(instance, versionId),
          );
          vscode.window.showInformationMessage(`B2C DX: Code version "${versionId}" deleted.`);
        }
      }
    } catch (err) {
      showError(err, outputChannel);
    }
  };
}

function createCreateCodeVersionCommand(
  configProvider: B2CExtensionConfig,
  treeProvider: CartridgeTreeProvider,
  outputChannel: vscode.OutputChannel,
): () => Promise<void> {
  return async () => {
    const instance = getInstance(configProvider);
    if (!instance) return;

    const name = await vscode.window.showInputBox({
      title: 'Create Code Version',
      placeHolder: 'Enter code version name',
      validateInput: (v) => (v.trim() ? null : 'Name is required'),
    });
    if (!name) return;

    try {
      await createCodeVersion(instance, name.trim());
      outputChannel.appendLine(`[Code Version] Created "${name.trim()}"`);
      vscode.window.showInformationMessage(`B2C DX: Code version "${name.trim()}" created.`);
      treeProvider.refresh();
    } catch (err) {
      showError(err, outputChannel);
    }
  };
}

function createActivateCodeVersionCommand(
  configProvider: B2CExtensionConfig,
  treeView: vscode.TreeView<CartridgeTreeItem>,
  outputChannel: vscode.OutputChannel,
): () => Promise<void> {
  return async () => {
    const instance = getInstance(configProvider);
    if (!instance) return;

    try {
      const versions = await listCodeVersions(instance);
      const items = versions.map((v) => ({
        label: v.id ?? 'unknown',
        description: v.active ? '$(star-full) Active' : '',
        version: v,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        title: 'Activate Code Version',
        placeHolder: 'Select a code version to activate',
      });
      if (!picked || !picked.version.id) return;

      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Activating "${picked.version.id}"...`},
        async () => {
          await activateCodeVersion(instance, picked.version.id!);
          treeView.description = `v: ${picked.version.id}`;
        },
      );
      outputChannel.appendLine(`[Code Version] Activated "${picked.version.id}"`);
      vscode.window.showInformationMessage(`B2C DX: Code version "${picked.version.id}" activated.`);
    } catch (err) {
      showError(err, outputChannel);
    }
  };
}

// ---------------------------------------------------------------------------
// Code Version Display
// ---------------------------------------------------------------------------

export async function updateCodeVersionDisplay(
  configProvider: B2CExtensionConfig,
  treeView: vscode.TreeView<CartridgeTreeItem>,
): Promise<void> {
  const config = configProvider.getConfig();
  const instance = configProvider.getInstance();

  // Prefer the locally configured code version (no OCAPI needed)
  const configuredVersion = config?.values.codeVersion;
  if (configuredVersion) {
    treeView.description = `v: ${configuredVersion}`;
    return;
  }

  // Fall back to OCAPI discovery if available
  if (!instance) {
    treeView.description = '';
    return;
  }
  try {
    const active = await getActiveCodeVersion(instance);
    treeView.description = active?.id ? `v: ${active.id}` : '';
  } catch {
    treeView.description = '';
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerCartridgeCommands(
  configProvider: B2CExtensionConfig,
  treeProvider: CartridgeTreeProvider,
  treeView: vscode.TreeView<CartridgeTreeItem>,
  outputChannel: vscode.OutputChannel,
): vscode.Disposable[] {
  const tempDirs: string[] = [];

  const disposables = [
    registerSafeCommand(
      'b2c-dx.codeSync.downloadCartridge',
      createDownloadCartridgeCommand(configProvider, outputChannel),
    ),
    registerSafeCommand(
      'b2c-dx.codeSync.diffCartridge',
      createDiffCartridgeCommand(configProvider, outputChannel, tempDirs),
    ),
    registerSafeCommand('b2c-dx.codeSync.addToSitePath', createAddToSitePathCommand(configProvider, outputChannel)),
    registerSafeCommand(
      'b2c-dx.codeSync.removeFromSitePath',
      createRemoveFromSitePathCommand(configProvider, outputChannel),
    ),
    registerSafeCommand(
      'b2c-dx.codeSync.listCodeVersions',
      createListCodeVersionsCommand(configProvider, treeView, outputChannel),
    ),
    registerSafeCommand(
      'b2c-dx.codeSync.createCodeVersion',
      createCreateCodeVersionCommand(configProvider, treeProvider, outputChannel),
    ),
    registerSafeCommand(
      'b2c-dx.codeSync.activateCodeVersion',
      createActivateCodeVersionCommand(configProvider, treeView, outputChannel),
    ),
    // Cleanup temp dirs on dispose
    new vscode.Disposable(() => {
      for (const dir of tempDirs) {
        try {
          fs.rmSync(dir, {recursive: true, force: true});
        } catch {
          // best effort
        }
      }
    }),
  ];

  return disposables;
}
