/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  findCartridges,
  uploadCartridges,
  getActiveCodeVersion,
  activateCodeVersion,
  reloadCodeVersion,
  OcapiScriptsBackend,
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
        cancellable: true,
      },
      async (progress, token) => {
        try {
          // The SDK upload/activate/reload calls do not accept an AbortSignal,
          // so we can only honor cancellation between top-level steps; an
          // in-flight upload will complete before we abort.
          progress.report({message: 'Uploading cartridges...'});
          await uploadCartridges(instance, selectedCartridges);

          if (token.isCancellationRequested) {
            throw new vscode.CancellationError();
          }

          if (actionPick.action === 'activate') {
            progress.report({message: 'Activating code version...'});
            await activateCodeVersion(instance, codeVersion);
            outputChannel.appendLine(`Code version "${codeVersion}" activated`);
          } else if (actionPick.action === 'reload') {
            progress.report({message: 'Reloading code version...'});
            await reloadCodeVersion(new OcapiScriptsBackend(instance), codeVersion);
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
          if (err instanceof vscode.CancellationError) {
            outputChannel.appendLine('Deploy cancelled by user.');
            outputChannel.appendLine(`--- Deploy cancelled ---`);
            return;
          }
          const message = err instanceof Error ? err.message : String(err);
          outputChannel.appendLine(`[Error] Deploy failed: ${message}`);
          outputChannel.appendLine(`--- Deploy failed ---`);
          vscode.window.showErrorMessage(`B2C DX: Deploy failed: ${message}`);
        }
      },
    );
  };
}
