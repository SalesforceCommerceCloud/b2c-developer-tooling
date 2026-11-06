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
import {ContentTreeItem, type ContentTreeDataProvider, type ContentTreeElement} from './content-tree-provider.js';
import {ExperienceTypesNode} from './experience-types.js';
import {owningPageId, pageDesignerUrl} from './page-designer-link.js';
import {findTypeSources, type TypeKind} from './type-sources.js';
import {openJobLog} from '../job-log-viewer.js';
import {isStorefrontNextWorkspace} from '../project-type.js';
import {findCartridgesSafe} from '../workspace-discovery.js';
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

/** Library content items from a (possibly mixed) multi-selection; type nodes are ignored. */
function contentSelection(node: ContentTreeItem | undefined, selected?: ContentTreeElement[]): ContentTreeItem[] {
  const items = (selected ?? []).filter((n): n is ContentTreeItem => n instanceof ContentTreeItem);
  return items.length > 0 ? items : node ? [node] : [];
}

const SOURCE_EXCLUDE = '{**/node_modules/**,**/dist/**,**/build/**,**/*.test.ts,**/*.test.tsx,**/*.d.ts}';

/** The type a tree item stands for: a live type, or the type of a page or component. */
function typeTarget(
  item: ContentTreeElement | {id: string} | undefined,
): {typeId: string; kind: TypeKind; type?: {id: string}} | undefined {
  if (item instanceof ExperienceTypesNode) {
    const type = item.options.type;
    return type ? {typeId: type.id, kind: item.options.group === 'page' ? 'page' : 'component', type} : undefined;
  }
  if (item instanceof ContentTreeItem) {
    const typeId = item.libraryNode?.typeId;
    if (!typeId || !/^(page|component)\./.test(typeId)) return undefined;
    return {typeId, kind: typeId.startsWith('page.') ? 'page' : 'component'};
  }
  return undefined;
}

export function registerContentCommands(
  _context: vscode.ExtensionContext,
  configProvider: ContentConfigProvider,
  treeProvider: ContentTreeDataProvider,
  _fsProvider: ContentFileSystemProvider,
  treeView: vscode.TreeView<ContentTreeElement>,
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
    async (node: ContentTreeItem, selectedNodes?: ContentTreeElement[]) => {
      const nodes = contentSelection(node, selectedNodes);
      if (!nodes.length) return;
      await runExport(nodes, {offline: false, assetsOnly: false});
    },
  );

  const exportNoAssets = registerSafeCommand(
    'b2c-dx.content.exportNoAssets',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeElement[]) => {
      const nodes = contentSelection(node, selectedNodes);
      if (!nodes.length) return;
      await runExport(nodes, {offline: true, assetsOnly: false});
    },
  );

  const exportAssets = registerSafeCommand(
    'b2c-dx.content.exportAssets',
    async (node: ContentTreeItem, selectedNodes?: ContentTreeElement[]) => {
      const nodes = contentSelection(node, selectedNodes);
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

  // NOTE: "Convert to Content Block" was intentionally NOT shipped. Reproducing
  // Page Designer's in-place conversion via site-archive import is unsafe: a plain
  // merge import applies the component.* -> fragment.* type change but silently
  // DROPS the element's own region content-links, orphaning a Layout block's
  // children (verified live, cross-instance). The only reliable workaround is a
  // delete+recreate archive, which is risky enough (deep subtree delete + referrer
  // re-import) that we defer conversion to Business Manager / Page Designer, which
  // does it correctly. Content blocks are still surfaced read-only in the tree.

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

  // Opens a live Page Designer type definition as read-only JSON (from the
  // optional "Page Designer Types" branch of the tree).
  const openType = registerSafeCommand('b2c-dx.content.openType', async (type: {id: string}) => {
    if (!type?.id) return;
    const doc = await vscode.workspace.openTextDocument({language: 'json', content: JSON.stringify(type, null, 2)});
    await vscode.window.showTextDocument(doc, {preview: true});
  });

  const goToTypeSource = registerSafeCommand(
    'b2c-dx.content.goToTypeSource',
    async (item?: ContentTreeElement | {id: string}) => {
      const target = typeTarget(item);
      if (!target) {
        vscode.window.showWarningMessage('Select a page or component type, or a page or component.');
        return;
      }
      const workingDir = configProvider.getWorkingDirectory();
      const sources = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Window, title: `Finding ${target.typeId}...`},
        async () => {
          const sfnext = isStorefrontNextWorkspace();
          const sourceFiles = sfnext
            ? (await vscode.workspace.findFiles('**/src/**/*.{ts,tsx}', SOURCE_EXCLUDE, 5000)).map((u) => u.fsPath)
            : [];
          return findTypeSources(target.typeId, {
            kind: target.kind,
            cartridges: findCartridgesSafe(workingDir),
            sourceFiles,
            projectRoot: workingDir,
          });
        },
      );
      if (sources.length === 0) {
        const message = `No project files found for ${target.typeId}.`;
        if (!target.type) {
          vscode.window.showInformationMessage(message);
          return;
        }
        const choice = await vscode.window.showInformationMessage(message, 'Show Instance Definition');
        if (choice) await vscode.commands.executeCommand('b2c-dx.content.openType', target.type);
        return;
      }
      const picked =
        sources.length === 1
          ? sources[0]
          : (
              await vscode.window.showQuickPick(
                sources.map((s) => ({label: path.basename(s.file), description: s.label, detail: s.detail, source: s})),
                {title: `Files for ${target.typeId}`, placeHolder: 'Select a file to open', matchOnDescription: true},
              )
            )?.source;
      if (!picked) return;
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(picked.file));
      const position = new vscode.Position(picked.line ?? 0, 0);
      await vscode.window.showTextDocument(doc, {selection: new vscode.Range(position, position)});
    },
  );

  // Opens a page (or a component's page) in the Business Manager Page Designer editor.
  const openInPageDesigner = registerSafeCommand(
    'b2c-dx.content.openInPageDesigner',
    async (node?: ContentTreeItem) => {
      const pageId = node instanceof ContentTreeItem ? owningPageId(node.libraryNode) : undefined;
      if (!pageId) {
        vscode.window.showWarningMessage('Select a page or a component on a page.');
        return;
      }
      const hostname = configProvider.getInstance()?.config.hostname;
      if (!hostname) {
        vscode.window.showWarningMessage('No instance is configured. Set a hostname in dw.json or B2C DX settings.');
        return;
      }
      // A site-private library's ID is its site; a shared library needs the
      // site whose cartridge path renders the page.
      let siteId = node!.isSiteLibrary ? node!.libraryId : configProvider.getSiteId();
      siteId ??= await vscode.window.showInputBox({
        title: 'Open in Page Designer',
        prompt: `Site to open page ${pageId} in`,
        placeHolder: 'RefArch',
        ignoreFocusOut: true,
      });
      if (!siteId) return;
      await vscode.env.openExternal(vscode.Uri.parse(pageDesignerUrl(hostname, siteId, pageId), true));
    },
  );

  return [
    openInPageDesigner,
    goToTypeSource,
    openType,
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
    browseWebdav,
  ];
}
