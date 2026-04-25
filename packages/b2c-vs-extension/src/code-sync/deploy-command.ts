/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  findCartridges,
  uploadCartridges,
  deleteCartridges,
  getActiveCodeVersion,
  activateCodeVersion,
  reloadCodeVersion,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

export function createDeployCommand(
  configProvider: B2CExtensionConfig,
  outputChannel: vscode.OutputChannel,
): () => Promise<void> {
  return async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }

    // Resolve code version
    let codeVersion = instance.config.codeVersion;
    if (!codeVersion) {
      try {
        const active = await getActiveCodeVersion(instance);
        if (active?.id) {
          codeVersion = active.id;
          instance.config.codeVersion = codeVersion;
        }
      } catch {
        // fall through
      }
    }
    if (!codeVersion) {
      vscode.window.showErrorMessage(
        'B2C DX: No code version configured. Set code-version in dw.json or activate a code version.',
      );
      return;
    }

    // Discover cartridges
    const directory = configProvider.getWorkingDirectory();
    const cartridges = findCartridges(directory);
    if (cartridges.length === 0) {
      vscode.window.showWarningMessage('B2C DX: No cartridges found (no .project files in workspace).');
      return;
    }

    // Let user select cartridges if more than one
    let selectedCartridges = cartridges;
    if (cartridges.length > 1) {
      const picks = await vscode.window.showQuickPick(
        cartridges.map((c) => ({label: c.name, description: c.src, picked: true, cartridge: c})),
        {title: 'Select cartridges to deploy', canPickMany: true},
      );
      if (!picks || picks.length === 0) return;
      selectedCartridges = picks.map((p) => p.cartridge);
    }

    // Choose post-deploy action
    const actionPick = await vscode.window.showQuickPick(
      [
        {label: 'Deploy only', action: 'none' as const},
        {label: 'Deploy & Activate', action: 'activate' as const},
        {label: 'Deploy & Reload', description: 'Toggle activation to force reload', action: 'reload' as const},
      ],
      {title: 'Post-deploy action'},
    );
    if (!actionPick) return;

    const hostname = instance.config.hostname ?? 'unknown';
    outputChannel.appendLine(`--- Deploy started ---`);
    outputChannel.appendLine(`Instance: ${hostname}`);
    outputChannel.appendLine(`Code Version: ${codeVersion}`);
    outputChannel.appendLine(`Cartridges: ${selectedCartridges.map((c) => c.name).join(', ')}`);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Deploying cartridges...',
        cancellable: false,
      },
      async (progress) => {
        try {
          progress.report({message: 'Uploading cartridges...'});
          await uploadCartridges(instance, selectedCartridges);

          if (actionPick.action === 'activate') {
            progress.report({message: 'Activating code version...'});
            await activateCodeVersion(instance, codeVersion);
            outputChannel.appendLine(`Code version "${codeVersion}" activated`);
          } else if (actionPick.action === 'reload') {
            progress.report({message: 'Reloading code version...'});
            await reloadCodeVersion(instance, codeVersion);
            outputChannel.appendLine(`Code version "${codeVersion}" reloaded`);
          }

          outputChannel.appendLine(
            `Deployed ${selectedCartridges.length} cartridge(s) to "${codeVersion}" successfully`,
          );
          outputChannel.appendLine(`--- Deploy complete ---`);
          vscode.window.showInformationMessage(
            `B2C DX: Deployed ${selectedCartridges.length} cartridge(s) to "${codeVersion}".`,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          outputChannel.appendLine(`[Error] Deploy failed: ${message}`);
          outputChannel.appendLine(`--- Deploy failed ---`);
          vscode.window.showErrorMessage(`B2C DX: Deploy failed: ${message}`);
        }
      },
    );
  };
}

export function createDeleteAndDeployCommand(
  configProvider: B2CExtensionConfig,
  outputChannel: vscode.OutputChannel,
): () => Promise<void> {
  return async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured.');
      return;
    }

    let codeVersion = instance.config.codeVersion;
    if (!codeVersion) {
      try {
        const active = await getActiveCodeVersion(instance);
        if (active?.id) {
          codeVersion = active.id;
          instance.config.codeVersion = codeVersion;
        }
      } catch {
        // fall through
      }
    }
    if (!codeVersion) {
      vscode.window.showErrorMessage('B2C DX: No code version configured.');
      return;
    }

    const directory = configProvider.getWorkingDirectory();
    const cartridges = findCartridges(directory);
    if (cartridges.length === 0) {
      vscode.window.showWarningMessage('B2C DX: No cartridges found.');
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      `This will delete existing cartridges on "${codeVersion}" before deploying. Continue?`,
      {modal: true},
      'Delete & Deploy',
    );
    if (confirm !== 'Delete & Deploy') return;

    outputChannel.appendLine(`--- Clean Deploy started ---`);

    await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: 'Clean deploy...', cancellable: false},
      async (progress) => {
        try {
          progress.report({message: 'Deleting existing cartridges...'});
          await deleteCartridges(instance, cartridges);

          progress.report({message: 'Uploading cartridges...'});
          await uploadCartridges(instance, cartridges);

          outputChannel.appendLine(`Clean deployed ${cartridges.length} cartridge(s) to "${codeVersion}"`);
          outputChannel.appendLine(`--- Clean Deploy complete ---`);
          vscode.window.showInformationMessage(`B2C DX: Clean deploy complete.`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          outputChannel.appendLine(`[Error] Clean deploy failed: ${message}`);
          vscode.window.showErrorMessage(`B2C DX: Clean deploy failed: ${message}`);
        }
      },
    );
  };
}
