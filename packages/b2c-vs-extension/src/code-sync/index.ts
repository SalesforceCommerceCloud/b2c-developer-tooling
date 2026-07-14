/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {CartridgeService} from '../cartridges/cartridge-service.js';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {CodeSyncManager} from './code-sync-manager.js';
import {
  CartridgeTreeProvider,
  CartridgeItem,
  CartridgeStepTypeItem,
  openStepTypeDefinition,
} from './cartridge-tree-provider.js';
import {createDeployCommand, createDeployOneCommand} from './deploy-command.js';
import {registerCartridgeCommands, updateCodeVersionDisplay} from './cartridge-commands.js';

export function registerCodeSync(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  cartridgeService: CartridgeService,
  log: vscode.OutputChannel,
): void {
  const manager = new CodeSyncManager(context.workspaceState);
  const treeProvider = new CartridgeTreeProvider(cartridgeService);
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

  const deployOneCmd = registerSafeCommand(
    'b2c-dx.codeSync.deployOne',
    createDeployOneCommand(configProvider, manager.outputChannel, context),
  );

  const refreshCmd = registerSafeCommand('b2c-dx.codeSync.refreshCartridges', () => {
    cartridgeService.refresh();
    manager.refreshCartridges(configProvider.getWorkingDirectory());
  });

  // CartridgeService already watches **/.project for create/delete and refreshes
  // itself; the tree updates via its onDidChange subscription. We forward those
  // events to the code-sync manager so it picks up newly-scaffolded cartridges.
  const cartridgesSub = cartridgeService.onDidChange(() => {
    manager.refreshCartridges(configProvider.getWorkingDirectory());
  });

  const uploadCartridgeCmd = registerSafeCommand('b2c-dx.codeSync.uploadCartridge', async (item: CartridgeItem) => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }
    await manager.uploadSingleCartridge(instance, item.cartridge);
    try {
      await vscode.commands.executeCommand('b2c-dx.webdav.refresh');
    } catch {
      // best-effort
    }
  });

  // Jumps to the @type-id line inside the cartridge's steptypes.json. The
  // default click on a step type node opens the module (.js) implementation;
  // this command is the alternative offered via the right-click menu.
  //
  // Two invocation shapes: (a) the default-click path from
  // `TreeItem.command.arguments` passes `(typeId, stepTypesPath)`; (b) the
  // right-click menu path from `view/item/context` passes the TreeItem itself
  // as the first arg. Handle both so neither is silently dropped.
  const openStepTypeDefinitionCmd = registerSafeCommand(
    'b2c-dx.cartridge.openStepTypeDefinition',
    async (typeIdOrItem?: string | CartridgeStepTypeItem, stepTypesPath?: string) => {
      let typeId: string | undefined;
      let resolvedPath: string | undefined;
      if (typeIdOrItem instanceof CartridgeStepTypeItem) {
        typeId = typeIdOrItem.entry.typeId;
        resolvedPath = typeIdOrItem.entry.stepTypesPath;
      } else {
        typeId = typeIdOrItem;
        resolvedPath = stepTypesPath;
      }
      if (!typeId || !resolvedPath) return;
      await openStepTypeDefinition(typeId, resolvedPath);
    },
  );

  const uploadToInstanceCmd = registerSafeCommand('b2c-dx.codeSync.uploadToInstance', async (uri?: vscode.Uri) => {
    if (!uri) return;
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }
    await manager.uploadFileOrFolder(instance, uri, configProvider.getWorkingDirectory());
    try {
      await vscode.commands.executeCommand('b2c-dx.webdav.refresh');
    } catch {
      // best-effort
    }
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
    // CartridgeService listens to onDidReset itself and refreshes its cache;
    // the tree updates via the cartridge-service onDidChange event.
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
    deployOneCmd,
    refreshCmd,
    uploadCartridgeCmd,
    openStepTypeDefinitionCmd,
    uploadToInstanceCmd,
    cartridgesSub,
    ...cartridgeCmdDisposables,
  );
}
