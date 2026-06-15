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
import {importLibraryXML} from './content-fs-provider.js';
import type {ContentTreeDataProvider, ContentTreeItem} from './content-tree-provider.js';
import {openJobLog} from '../job-log-viewer.js';
import {registerSafeCommand} from '../safety.js';

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

export function registerContentCommands(
  _context: vscode.ExtensionContext,
  configProvider: ContentConfigProvider,
  treeProvider: ContentTreeDataProvider,
  _fsProvider: ContentFileSystemProvider,
  treeView: vscode.TreeView<ContentTreeItem>,
): vscode.Disposable[] {
  const refresh = registerSafeCommand('b2c-dx.content.refresh', () => {
    configProvider.clearCache();
    configProvider.reset();
    treeProvider.refresh();
  });

  const addLibrary = registerSafeCommand('b2c-dx.content.addLibrary', async () => {
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

  const removeLibrary = registerSafeCommand('b2c-dx.content.removeLibrary', (node: ContentTreeItem) => {
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
        {location: vscode.ProgressLocation.Notification, title: progressTitle, cancellable: true},
        async (progress, token) => {
          // The SDK exportContent call does not accept an AbortSignal, so we
          // can only honor cancellation at asset-download progress boundaries;
          // in-flight requests will complete before we abort.
          return exportContent(instance, contentIds, libraryId, outputPath, {
            isSiteLibrary,
            offline,
            assetQuery: configProvider.getAssetQuery(),
            onAssetProgress: (_asset, index, total) => {
              if (token.isCancellationRequested) {
                throw new vscode.CancellationError();
              }
              progress.report({
                message: `Downloading asset ${index + 1}/${total}`,
                increment: (1 / total) * 100,
              });
            },
          });
        },
      );
    } catch (err) {
      if (err instanceof vscode.CancellationError) {
        // Operation cancelled by user.
        return;
      }
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

  const exportCmd = registerSafeCommand(
    'b2c-dx.content.export',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeItem[]) => {
      const nodes = selectedNodes?.length ? selectedNodes : node ? [node] : [];
      if (!nodes.length) return;
      await runExport(nodes, {offline: false, assetsOnly: false});
    },
  );

  const exportNoAssets = registerSafeCommand(
    'b2c-dx.content.exportNoAssets',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeItem[]) => {
      const nodes = selectedNodes?.length ? selectedNodes : node ? [node] : [];
      if (!nodes.length) return;
      await runExport(nodes, {offline: true, assetsOnly: false});
    },
  );

  const exportAssets = registerSafeCommand(
    'b2c-dx.content.exportAssets',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeItem[]) => {
      const nodes = selectedNodes?.length ? selectedNodes : node ? [node] : [];
      if (!nodes.length) return;
      await runExport(nodes, {offline: false, assetsOnly: true});
    },
  );

  const filter = registerSafeCommand('b2c-dx.content.filter', async () => {
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

  const clearFilter = registerSafeCommand('b2c-dx.content.clearFilter', () => {
    treeProvider.setFilter(undefined);
  });

  const importCmd = registerSafeCommand('b2c-dx.content.import', async (uri?: vscode.Uri) => {
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

  // Reveal the canonical source of a shared content block under the "Content
  // Blocks" group. Triggered when a user clicks a reference node, enforcing that
  // a block is only ever viewed/edited in one place.
  const revealBlock = registerSafeCommand('b2c-dx.content.revealBlock', async (node: ContentTreeItem) => {
    if (!node || node.nodeType !== 'fragmentRef') return;
    const source = treeProvider.getContentBlockSource(node.libraryId, node.isSiteLibrary, node.contentId);
    if (!source) {
      vscode.window.showWarningMessage(`Content block "${node.contentId}" was not found in the library.`);
      return;
    }
    try {
      await treeView.reveal(source, {select: true, focus: true, expand: true});
    } catch {
      // reveal can throw if the tree isn't ready; non-fatal.
    }
    // Open the block's XML so the reference click still lands somewhere useful.
    await vscode.commands.executeCommand('vscode.open', ...(source.command?.arguments ?? []));
  });

  // Convert a component (assigned inline to a page/region) into a shared content
  // block. Reproduces Page Designer's in-place conversion: the SDK builds a
  // delete+recreate archive that re-types the element to fragment.*, recreates
  // its descendants, and re-imports every referrer so existing content-links
  // survive (a plain merge import would silently ignore the <type> change, and a
  // bare delete would orphan the element from its pages). Verified byte-for-byte
  // against a manual conversion.
  const convertToBlock = registerSafeCommand('b2c-dx.content.convertToBlock', async (node: ContentTreeItem) => {
    if (!node || node.nodeType !== 'component' || !node.libraryNode) {
      return;
    }
    const instance = configProvider.getInstance();
    if (!instance) {
      vscode.window.showErrorMessage('No B2C Commerce instance configured.');
      return;
    }
    const library = configProvider.getCachedLibrary(node.libraryId);
    if (!library) {
      vscode.window.showErrorMessage(`Library "${node.libraryId}" is not loaded. Expand it first.`);
      return;
    }

    if (node.libraryNode.type !== 'COMPONENT') {
      vscode.window.showErrorMessage('Only a component can be converted to a content block.');
      return;
    }

    const displayName = await vscode.window.showInputBox({
      title: 'Convert to Content Block',
      prompt: 'Enter a display name for the new content block',
      value: node.libraryNode.displayName ?? node.contentId,
      validateInput: (value: string) => (value.trim() ? null : 'Enter a display name'),
    });
    if (displayName === undefined) return; // cancelled

    try {
      // The SDK builds the full delete+recreate+relink archive for this conversion.
      const contentXML = await library.buildContentBlockConversionXML(node.contentId, displayName.trim());
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Converting ${node.contentId} to a content block...`},
        async () => {
          await importLibraryXML(instance, node.libraryId, node.isSiteLibrary, contentXML);
        },
      );
    } catch (err) {
      await showJobError(err, instance, 'Convert to content block failed');
      return;
    } finally {
      // Re-fetch fresh state from the instance on the next expand.
      configProvider.invalidateLibrary(node.libraryId);
    }

    treeProvider.refresh();
    vscode.window.showInformationMessage(`Converted "${node.contentId}" to content block "${displayName.trim()}".`);
  });

  const browseWebdav = registerSafeCommand('b2c-dx.content.browseWebdav', async (node: ContentTreeItem) => {
    if (!node) return;

    if (node.nodeType === 'library') {
      await vscode.commands.executeCommand('b2c-dx.webdav.revealLibrary', node.libraryId);
    } else if (node.nodeType === 'static') {
      // Static assets have a webdav path: Libraries/{libraryId}/default/{path}
      const cleanPath = node.contentId.startsWith('/') ? node.contentId.slice(1) : node.contentId;
      const webdavPath = `Libraries/${node.libraryId}/default/${cleanPath}`;
      await vscode.commands.executeCommand('b2c-dx.webdav.revealPath', webdavPath);
    }
  });

  return [
    refresh,
    addLibrary,
    removeLibrary,
    exportCmd,
    exportNoAssets,
    exportAssets,
    filter,
    clearFilter,
    importCmd,
    revealBlock,
    convertToBlock,
    browseWebdav,
  ];
}
