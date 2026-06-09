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
            await reloadCodeVersion(instance, codeVersion);
            outputChannel.appendLine(`Code version "${codeVersion}" reloaded`);
          }

          outputChannel.appendLine(
            `Deployed ${selectedCartridges.length} cartridge(s) to "${codeVersion}" successfully`,
          );
          outputChannel.appendLine(`--- Deploy complete ---`);

          // Refresh the WebDAV browser so newly-uploaded cartridges show up.
          try {
            await vscode.commands.executeCommand('b2c-dx.webdav.refresh');
          } catch {
            // best-effort — webdav tree may not be registered if feature is disabled
          }

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

/**
 * Deploys a single cartridge — defaults the picker to the last-scaffolded
 * cartridge so users coming from the walkthrough's "Create New Cartridge"
 * step can deploy what they just made in one click.
 */
export function createDeployOneCommand(
  configProvider: B2CExtensionConfig,
  outputChannel: vscode.OutputChannel,
  context: vscode.ExtensionContext,
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

    // Default to the last-scaffolded cartridge so the walkthrough flow is
    // one-click. Falls back to the first cartridge if there's no record.
    const lastScaffolded = context.workspaceState.get<string>('b2c-dx.scaffold.lastCartridgeName');
    const recommended = lastScaffolded ? (cartridges.find((c) => c.name === lastScaffolded) ?? null) : null;

    let toDeploy;
    if (cartridges.length === 1) {
      toDeploy = cartridges[0];
    } else {
      const items = cartridges.map((c) => ({
        label: c.name === recommended?.name ? `$(star-full) ${c.name}` : c.name,
        description: c.name === recommended?.name ? 'recently scaffolded' : c.src,
        detail: c.name === recommended?.name ? c.src : undefined,
        cartridge: c,
      }));
      // Sort the recommended cartridge to the top so it's the default focus.
      if (recommended) {
        items.sort((a, b) =>
          a.cartridge.name === recommended.name ? -1 : b.cartridge.name === recommended.name ? 1 : 0,
        );
      }
      const picked = await vscode.window.showQuickPick(items, {
        title: 'Deploy a cartridge',
        placeHolder: recommended
          ? `Default: ${recommended.name} — choose a cartridge to deploy`
          : 'Select a cartridge to deploy',
      });
      if (!picked) return;
      toDeploy = picked.cartridge;
    }

    outputChannel.appendLine(`--- Deploy single started ---`);
    outputChannel.appendLine(`Cartridge: ${toDeploy.name}`);
    outputChannel.appendLine(`Code Version: ${codeVersion}`);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Deploying ${toDeploy.name}...`,
        cancellable: false,
      },
      async () => {
        try {
          await uploadCartridges(instance, [toDeploy]);
          outputChannel.appendLine(`Deployed "${toDeploy.name}" to "${codeVersion}"`);
          outputChannel.appendLine(`--- Deploy single complete ---`);

          try {
            await vscode.commands.executeCommand('b2c-dx.webdav.refresh');
          } catch {
            // best-effort
          }

          vscode.window.showInformationMessage(`B2C DX: Deployed "${toDeploy.name}" to "${codeVersion}".`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          outputChannel.appendLine(`[Error] Deploy failed: ${message}`);
          outputChannel.appendLine(`--- Deploy single failed ---`);
          vscode.window.showErrorMessage(`B2C DX: Deploy failed: ${message}`);
        }
      },
    );
  };
}
