/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {siteArchiveExportToPath, JobExecutionError} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {SIMPLE_CATEGORIES, type SimpleCategory} from './export-selection.js';
import type {ExportTreeDataProvider} from './export-tree-provider.js';

/** Categories whose IDs cannot be discovered and must be entered manually. */
const MANUAL_CATEGORIES = SIMPLE_CATEGORIES.filter((c) => !c.discoverable);

export function registerExportCommands(
  configProvider: B2CExtensionConfig,
  treeProvider: ExportTreeDataProvider,
): vscode.Disposable[] {
  const refresh = registerSafeCommand('b2c-dx.export.refresh', () => {
    treeProvider.refresh();
  });

  const clear = registerSafeCommand('b2c-dx.export.clearSelection', () => {
    treeProvider.selection.clear();
    treeProvider.refreshSelection();
  });

  const addById = registerSafeCommand('b2c-dx.export.addById', async () => {
    const picked = await vscode.window.showQuickPick(
      MANUAL_CATEGORIES.map((c) => ({label: c.label, key: c.key})),
      {title: 'Add export unit by ID', placeHolder: 'Select a category'},
    );
    if (!picked) return;

    const id = await vscode.window.showInputBox({
      title: `Add ${picked.label} by ID`,
      prompt: `Enter the ${picked.label.replace(/s$/, '')} ID to include in the export`,
      placeHolder: 'e.g., my-library',
      validateInput: (value) => (value.trim() ? undefined : 'ID cannot be empty'),
    });
    if (!id?.trim()) return;

    treeProvider.addManualId(picked.key as SimpleCategory, id.trim());
  });

  const runExport = registerSafeCommand('b2c-dx.export.run', async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('No B2C Commerce instance configured.');
      return;
    }

    if (treeProvider.selection.isEmpty()) {
      vscode.window.showWarningMessage('Nothing selected to export. Check items in the Export view first.');
      return;
    }

    const folders = await vscode.window.showOpenDialog({
      title: 'Select export directory',
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Export Here',
    });
    if (!folders?.length) return;

    const outputPath = folders[0].fsPath;
    const dataUnits = treeProvider.selection.toDataUnits();

    let result;
    try {
      result = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: 'Exporting site archive...', cancellable: false},
        async (progress) => {
          return siteArchiveExportToPath(instance, dataUnits, outputPath, {
            waitOptions: {
              onPoll: (info) => progress.report({message: `Running export job (${info.elapsedSeconds}s)...`}),
            },
          });
        },
      );
    } catch (err) {
      const message =
        err instanceof JobExecutionError
          ? `Export job failed: ${err.message}`
          : `Export failed: ${err instanceof Error ? err.message : String(err)}`;
      vscode.window.showErrorMessage(message);
      return;
    }

    const outputUri = vscode.Uri.file(result.localPath);
    const isInWorkspace = vscode.workspace.getWorkspaceFolder(outputUri) !== undefined;
    const actions = isInWorkspace ? ['Reveal in Explorer', 'Reveal in Finder'] : ['Reveal in Finder'];
    const action = await vscode.window.showInformationMessage(`Exported archive to ${result.localPath}`, ...actions);
    if (action === 'Reveal in Explorer') {
      await vscode.commands.executeCommand('revealInExplorer', outputUri);
    } else if (action === 'Reveal in Finder') {
      await vscode.commands.executeCommand('revealFileInOS', outputUri);
    }
  });

  return [refresh, clear, addById, runExport];
}
