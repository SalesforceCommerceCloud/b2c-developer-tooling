/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {commerceAppInstall, JobExecutionError} from '@salesforce/b2c-tooling-sdk/operations/cap';
import {getJobLog} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as path from 'path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {openJobLog} from '../job-log-viewer.js';

async function showJobError(err: unknown, instance: B2CInstance, label: string): Promise<void> {
  if (err instanceof JobExecutionError && err.execution.is_log_file_existing) {
    try {
      const log = await getJobLog(instance, err.execution);
      await openJobLog(err.execution.id ?? 'job', log);
    } catch {
      // Fall through to generic error
    }
  }
  const message = err instanceof Error ? err.message : String(err);
  vscode.window.showErrorMessage(`${label}: ${message}`);
}

export function registerCapCommands(
  _context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
): vscode.Disposable[] {
  const installCap = vscode.commands.registerCommand('b2c-dx.cap.install', async (uri?: vscode.Uri) => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('No B2C Commerce instance configured.');
      return;
    }

    // Determine CAP path from context menu URI or file picker
    let capPath: string;
    if (uri) {
      capPath = uri.fsPath;
    } else {
      const folders = await vscode.window.showOpenDialog({
        title: 'Select Commerce App Package (CAP) directory',
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: 'Install CAP',
      });
      if (!folders?.length) return;
      capPath = folders[0].fsPath;
    }

    // Prompt for site ID
    const siteId = await vscode.window.showInputBox({
      title: 'Install Commerce App',
      prompt: 'Enter the Site ID to install the Commerce App on',
      placeHolder: 'e.g., RefArch',
      validateInput: (value: string) => {
        if (!value.trim()) return 'Site ID is required';
        return null;
      },
    });
    if (!siteId) return;

    const capName = path.basename(capPath);

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Installing Commerce App: ${capName}`,
          cancellable: false,
        },
        async (progress) => {
          await commerceAppInstall(instance, capPath, {
            siteId,
            waitOptions: {
              onProgress: (exec) => {
                progress.report({message: `Status: ${exec.execution_status}`});
              },
            },
          });
        },
      );

      vscode.window.showInformationMessage(`Commerce App "${capName}" installed successfully on site "${siteId}".`);
    } catch (err) {
      await showJobError(err, instance, 'Commerce App install failed');
    }
  });

  return [installCap];
}
