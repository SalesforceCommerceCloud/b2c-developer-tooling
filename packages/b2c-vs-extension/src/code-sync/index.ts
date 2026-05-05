/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {CodeSyncManager} from './code-sync-manager.js';
import {CartridgeTreeProvider, CartridgeItem} from './cartridge-tree-provider.js';
import {createDeployCommand} from './deploy-command.js';
import {registerCartridgeCommands, updateCodeVersionDisplay} from './cartridge-commands.js';

export function registerCodeSync(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): void {
  const manager = new CodeSyncManager(context.workspaceState);
  const treeProvider = new CartridgeTreeProvider(configProvider);
  const treeView = vscode.window.createTreeView('b2cCartridgeExplorer', {treeDataProvider: treeProvider});

  // --- Core sync commands ---

  const toggleCmd = registerSafeCommand('b2c-dx.codeSync.toggle', async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }
    const hostname = configProvider.getConfig()?.values.hostname ?? '';
    await manager.toggle(instance, configProvider.getWorkingDirectory(), hostname);
    treeProvider.refresh();
  });

  const startCmd = registerSafeCommand('b2c-dx.codeSync.start', async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }
    const hostname = configProvider.getConfig()?.values.hostname ?? '';
    await manager.startWatch(instance, configProvider.getWorkingDirectory());
    await manager.setPersistedState(hostname, true);
    treeProvider.refresh();
  });

  const stopCmd = registerSafeCommand('b2c-dx.codeSync.stop', async () => {
    const hostname = configProvider.getConfig()?.values.hostname ?? '';
    await manager.stopWatch();
    await manager.setPersistedState(hostname, false);
  });

  const deployCmd = registerSafeCommand(
    'b2c-dx.codeSync.deploy',
    createDeployCommand(configProvider, manager.outputChannel),
  );

  const refreshCmd = registerSafeCommand('b2c-dx.codeSync.refreshCartridges', () => {
    treeProvider.refresh();
    manager.refreshCartridges(configProvider.getWorkingDirectory());
  });

  // Watch for new .project files (new cartridges added via scaffolding, etc.)
  const projectFileWatcher = vscode.workspace.createFileSystemWatcher('**/.project');
  projectFileWatcher.onDidCreate(() => {
    treeProvider.refresh();
    manager.refreshCartridges(configProvider.getWorkingDirectory());
  });
  projectFileWatcher.onDidDelete(() => {
    treeProvider.refresh();
  });

  const uploadCartridgeCmd = registerSafeCommand('b2c-dx.codeSync.uploadCartridge', async (item: CartridgeItem) => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }
    await manager.uploadSingleCartridge(instance, item.cartridge);
  });

  const uploadToInstanceCmd = registerSafeCommand('b2c-dx.codeSync.uploadToInstance', async (uri?: vscode.Uri) => {
    if (!uri) return;
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }
    await manager.uploadFileOrFolder(instance, uri, configProvider.getWorkingDirectory());
  });

  // --- Cartridge commands (download, diff, site path, code versions) ---
  const cartridgeCmdDisposables = registerCartridgeCommands(
    configProvider,
    treeProvider,
    treeView,
    manager.outputChannel,
  );

  // --- Context key for explorer menu visibility ---
  function updateContextKey(): void {
    const hasInstance = configProvider.getInstance() !== null;
    void vscode.commands.executeCommand('setContext', 'b2c-dx.codeSyncAvailable', hasInstance);
  }
  updateContextKey();

  // --- Auto-start logic ---
  async function evaluateAutoStart(): Promise<void> {
    const instance = configProvider.getInstance();
    if (!instance) {
      manager.hideStatusBar();
      return;
    }
    manager.showStatusBar();

    const hostname = configProvider.getConfig()?.values.hostname ?? '';
    if (!hostname) return;

    // State resolution: workspaceState → dw.json autoUpload → off
    let shouldStart = manager.getPersistedState(hostname);
    if (shouldStart === undefined) {
      shouldStart = configProvider.getConfig()?.values.autoUpload === true;
    }

    if (shouldStart && !manager.isWatching) {
      try {
        await manager.startWatch(instance, configProvider.getWorkingDirectory());
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.appendLine(`[CodeSync] Auto-start failed: ${message}`);
      }
    }

    // Update code version display in tree view
    await updateCodeVersionDisplay(configProvider, treeView);
  }

  // Wire config resets
  configProvider.onDidReset(async () => {
    if (manager.isWatching) {
      await manager.stopWatch();
    }
    treeProvider.refresh();
    updateContextKey();
    await evaluateAutoStart();
  });

  // Initial auto-start
  void evaluateAutoStart();

  context.subscriptions.push(
    manager,
    treeProvider,
    treeView,
    toggleCmd,
    startCmd,
    stopCmd,
    deployCmd,
    refreshCmd,
    uploadCartridgeCmd,
    uploadToInstanceCmd,
    projectFileWatcher,
    ...cartridgeCmdDisposables,
  );
}
