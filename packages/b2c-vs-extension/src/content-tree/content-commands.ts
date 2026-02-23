/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {siteArchiveImport, getJobLog, JobExecutionError} from '@salesforce/b2c-tooling-sdk';
import {exportContent} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import * as path from 'path';
import * as vscode from 'vscode';
import type {ContentConfigProvider} from './content-config.js';
import type {ContentFileSystemProvider} from './content-fs-provider.js';
import type {ContentTreeDataProvider, ContentTreeItem} from './content-tree-provider.js';

async function showJobError(err: unknown, instance: B2CInstance, label: string): Promise<void> {
  if (err instanceof JobExecutionError && err.execution.is_log_file_existing) {
    try {
      const log = await getJobLog(instance, err.execution);
      const doc = await vscode.workspace.openTextDocument({content: log, language: 'log'});
      await vscode.window.showTextDocument(doc);
    } catch {
      // Fall through to generic error
    }
  }
  const message = err instanceof Error ? err.message : String(err);
  vscode.window.showErrorMessage(`${label}: ${message}`);
}

export function registerContentCommands(
  _context: vscode.ExtensionContext,
  configProvider: ContentConfigProvider,
  treeProvider: ContentTreeDataProvider,
  _fsProvider: ContentFileSystemProvider,
): vscode.Disposable[] {
  const refresh = vscode.commands.registerCommand('b2c-dx.content.refresh', () => {
    configProvider.clearCache();
    configProvider.reset();
    treeProvider.refresh();
  });

  const addLibrary = vscode.commands.registerCommand('b2c-dx.content.addLibrary', async () => {
    const id = await vscode.window.showInputBox({
      title: 'Add Content Library',
      prompt: 'Enter the library ID (or site ID for site-private libraries)',
      placeHolder: 'e.g., SharedLibrary',
      validateInput: (value: string) => {
        if (!value.trim()) return 'Enter a library ID';
        return null;
      },
    });
    if (!id) return;

    const choice = await vscode.window.showQuickPick(['Shared Library', 'Site-Private Library'], {
      title: 'Library Type',
      placeHolder: 'Select the library type',
    });
    if (!choice) return;

    const isSiteLibrary = choice === 'Site-Private Library';
    configProvider.addLibrary(id.trim(), isSiteLibrary);
    treeProvider.refresh();
  });

  const removeLibrary = vscode.commands.registerCommand('b2c-dx.content.removeLibrary', (node: ContentTreeItem) => {
    if (!node || node.nodeType !== 'library') return;
    configProvider.removeLibrary(node.libraryId);
    treeProvider.refresh();
  });

  async function runExport(
    nodes: ContentTreeItem[],
    {offline, assetsOnly}: {offline: boolean; assetsOnly: boolean},
  ): Promise<void> {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('No B2C Commerce instance configured.');
      return;
    }

    // All selected nodes must be from the same library
    const libraryId = nodes[0].libraryId;
    const isSiteLibrary = nodes[0].isSiteLibrary;
    if (nodes.some((n) => n.libraryId !== libraryId)) {
      vscode.window.showErrorMessage('Cannot export content from different libraries at the same time.');
      return;
    }

    const contentIds = nodes.map((n) => n.contentId);

    const dialogTitle = assetsOnly ? 'Select directory for static assets' : 'Select export directory';
    const folders = await vscode.window.showOpenDialog({
      title: dialogTitle,
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Export Here',
    });
    if (!folders?.length) return;

    const outputPath = folders[0].fsPath;
    const label = assetsOnly ? 'static assets for' : offline ? '(without assets)' : '';
    const itemLabel = contentIds.length === 1 ? contentIds[0] : `${contentIds.length} items`;
    const progressTitle = `Exporting ${label ? `${label} ` : ''}${itemLabel}...`;

    let result;
    try {
      result = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: progressTitle, cancellable: false},
        async (progress) => {
          return exportContent(instance, contentIds, libraryId, outputPath, {
            isSiteLibrary,
            offline,
            onAssetProgress: (_asset, index, total) => {
              progress.report({
                message: `Downloading asset ${index + 1}/${total}`,
                increment: (1 / total) * 100,
              });
            },
          });
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Export failed: ${message}`);
      return;
    }

    let msg: string;
    if (assetsOnly) {
      if (result.downloadedAssets.length === 0) {
        vscode.window.showInformationMessage('No static assets found for the selected content.');
        return;
      }
      msg = `Downloaded ${result.downloadedAssets.length} static asset(s)`;
    } else {
      const parts = [
        result.pageCount > 0 ? `${result.pageCount} page(s)` : '',
        result.contentCount > 0 ? `${result.contentCount} content asset(s)` : '',
        result.componentCount > 0 ? `${result.componentCount} component(s)` : '',
        result.downloadedAssets.length > 0 ? `${result.downloadedAssets.length} static asset(s)` : '',
      ].filter(Boolean);
      msg = `Exported ${parts.join(', ')}`;
    }

    const outputUri = vscode.Uri.file(outputPath);
    const isInWorkspace = vscode.workspace.getWorkspaceFolder(outputUri) !== undefined;
    const actions = isInWorkspace ? ['Reveal in Explorer', 'Reveal in Finder'] : ['Reveal in Finder'];
    const action = await vscode.window.showInformationMessage(msg, ...actions);
    if (action === 'Reveal in Explorer') {
      await vscode.commands.executeCommand('revealInExplorer', outputUri);
    } else if (action === 'Reveal in Finder') {
      await vscode.commands.executeCommand('revealFileInOS', outputUri);
    }
  }

  const exportCmd = vscode.commands.registerCommand(
    'b2c-dx.content.export',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeItem[]) => {
      const nodes = selectedNodes?.length ? selectedNodes : node ? [node] : [];
      if (!nodes.length) return;
      await runExport(nodes, {offline: false, assetsOnly: false});
    },
  );

  const exportNoAssets = vscode.commands.registerCommand(
    'b2c-dx.content.exportNoAssets',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeItem[]) => {
      const nodes = selectedNodes?.length ? selectedNodes : node ? [node] : [];
      if (!nodes.length) return;
      await runExport(nodes, {offline: true, assetsOnly: false});
    },
  );

  const exportAssets = vscode.commands.registerCommand(
    'b2c-dx.content.exportAssets',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeItem[]) => {
      const nodes = selectedNodes?.length ? selectedNodes : node ? [node] : [];
      if (!nodes.length) return;
      await runExport(nodes, {offline: false, assetsOnly: true});
    },
  );

  const filter = vscode.commands.registerCommand('b2c-dx.content.filter', async () => {
    const current = treeProvider.getFilter();
    const value = await vscode.window.showInputBox({
      title: 'Filter Content',
      prompt: 'Filter pages and content assets by name',
      placeHolder: 'e.g., homepage',
      value: current ?? '',
    });
    if (value === undefined) return; // cancelled
    treeProvider.setFilter(value || undefined);
  });

  const clearFilter = vscode.commands.registerCommand('b2c-dx.content.clearFilter', () => {
    treeProvider.setFilter(undefined);
  });

  const importCmd = vscode.commands.registerCommand('b2c-dx.content.import', async (uri?: vscode.Uri) => {
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('No B2C Commerce instance configured.');
      return;
    }

    let importPath: string;
    if (uri) {
      importPath = uri.fsPath;
    } else {
      const folders = await vscode.window.showOpenDialog({
        title: 'Select site archive directory to import',
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: 'Import',
      });
      if (!folders?.length) return;
      importPath = folders[0].fsPath;
    }

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Importing ${path.basename(importPath)}...`},
        async () => {
          await siteArchiveImport(instance, importPath);
        },
      );
    } catch (err) {
      await showJobError(err, instance, 'Import failed');
      return;
    }

    configProvider.clearCache();
    treeProvider.refresh();
    vscode.window.showInformationMessage('Site archive imported successfully.');
  });

  return [refresh, addLibrary, removeLibrary, exportCmd, exportNoAssets, exportAssets, filter, clearFilter, importCmd];
}
