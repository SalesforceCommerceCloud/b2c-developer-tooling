/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {type WebDavFileSystemProvider, webdavPathToUri} from './webdav-fs-provider.js';
import type {WebDavTreeItem} from './webdav-tree-provider.js';

/** MIME type used for internal tree drag-and-drop. */
const WEBDAV_TREE_MIME = 'application/vnd.code.tree.b2cWebdavExplorer';

/** Droppable node types — virtual roots and placeholders are excluded. */
const DROPPABLE_TYPES = new Set(['root', 'catalog-mapping', 'library-mapping', 'directory']);

function getWebdavRoot(webdavPath: string): string {
  return webdavPath.split('/')[0];
}

/**
 * Drag-and-drop controller for the WebDAV browser tree.
 *
 * Supports:
 * - Drop from local file system / VS Code explorer (upload)
 * - Drag out to local file system (via FileSystemProvider)
 * - Move/copy within the tree (WebDAV MOVE)
 *
 * Cross-root moves (e.g., Catalogs → Libraries) are supported but
 * gated behind the `b2c-dx.features.webdavCrossRootDragDrop` setting.
 */
export class WebDavDragAndDropController implements vscode.TreeDragAndDropController<WebDavTreeItem> {
  readonly dragMimeTypes = [WEBDAV_TREE_MIME];
  readonly dropMimeTypes = ['text/uri-list', WEBDAV_TREE_MIME];

  constructor(
    private configProvider: B2CExtensionConfig,
    private fsProvider: WebDavFileSystemProvider,
  ) {}

  handleDrag(
    source: readonly WebDavTreeItem[],
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken,
  ): void {
    // Only allow dragging files and directories, not roots/virtual-roots/placeholders
    const draggable = source.filter((item) => item.nodeType === 'file' || item.nodeType === 'directory');
    if (draggable.length === 0) return;

    dataTransfer.set(WEBDAV_TREE_MIME, new vscode.DataTransferItem(draggable.map((item) => item.webdavPath)));
  }

  async handleDrop(
    target: WebDavTreeItem | undefined,
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken,
  ): Promise<void> {
    if (!target || !DROPPABLE_TYPES.has(target.nodeType)) return;

    // Internal tree move/copy
    const treePaths = dataTransfer.get(WEBDAV_TREE_MIME);
    if (treePaths) {
      const paths = treePaths.value as string[];
      await this.handleTreeDrop(target, paths, token);
      return;
    }

    // External file drop (from OS or VS Code explorer)
    const uriList = dataTransfer.get('text/uri-list');
    if (uriList) {
      const uriString = await uriList.asString();
      const uris = uriString
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((uri) => vscode.Uri.parse(uri));
      await this.handleExternalDrop(target, uris, token);
    }
  }

  /**
   * Handle internal tree move via WebDAV MOVE.
   */
  private async handleTreeDrop(
    target: WebDavTreeItem,
    sourcePaths: string[],
    token: vscode.CancellationToken,
  ): Promise<void> {
    const instance = this.configProvider.getInstance();
    if (!instance) return;

    const crossRootEnabled = vscode.workspace
      .getConfiguration('b2c-dx.features')
      .get<boolean>('webdavCrossRootDragDrop', false);

    const targetRoot = getWebdavRoot(target.webdavPath);

    for (const sourcePath of sourcePaths) {
      if (token.isCancellationRequested) break;

      const sourceRoot = getWebdavRoot(sourcePath);
      if (sourceRoot !== targetRoot && !crossRootEnabled) {
        vscode.window.showWarningMessage(
          `Cross-root move from ${sourceRoot} to ${targetRoot} is disabled. ` +
            `Enable "b2c-dx.features.webdavCrossRootDragDrop" in settings to allow this.`,
        );
        continue;
      }

      const fileName = sourcePath.split('/').pop() ?? sourcePath;
      const destinationPath = `${target.webdavPath}/${fileName}`;

      // Don't move to the same location
      if (sourcePath === destinationPath) continue;

      try {
        await vscode.window.withProgress(
          {location: vscode.ProgressLocation.Notification, title: `Moving ${fileName}...`},
          async () => {
            await instance.webdav.move(sourcePath, destinationPath);
          },
        );

        // Invalidate caches for source parent and target
        const sourceParent = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
        this.fsProvider.clearCache(sourceParent);
        this.fsProvider.clearCache(target.webdavPath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`WebDAV: Move failed for ${fileName}: ${message}`);
      }
    }
  }

  /**
   * Handle drop of local files/folders into the WebDAV tree (upload).
   */
  private async handleExternalDrop(
    target: WebDavTreeItem,
    uris: vscode.Uri[],
    token: vscode.CancellationToken,
  ): Promise<void> {
    for (const uri of uris) {
      if (token.isCancellationRequested) break;

      try {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.type === vscode.FileType.Directory) {
          await this.uploadDirectory(target.webdavPath, uri, token);
        } else {
          await this.uploadFile(target.webdavPath, uri);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const fileName = uri.path.split('/').pop() ?? uri.toString();
        vscode.window.showErrorMessage(`WebDAV: Upload failed for ${fileName}: ${message}`);
      }
    }

    this.fsProvider.clearCache(target.webdavPath);
  }

  private async uploadFile(targetDir: string, uri: vscode.Uri): Promise<void> {
    const fileName = uri.path.split('/').pop() ?? 'file';
    const destPath = `${targetDir}/${fileName}`;
    const content = await vscode.workspace.fs.readFile(uri);

    await this.fsProvider.writeFile(webdavPathToUri(destPath), content, {
      create: true,
      overwrite: true,
    });
  }

  private async uploadDirectory(targetDir: string, uri: vscode.Uri, token: vscode.CancellationToken): Promise<void> {
    const dirName = uri.path.split('/').pop() ?? 'folder';
    const destDir = `${targetDir}/${dirName}`;

    await this.fsProvider.createDirectory(webdavPathToUri(destDir));

    const entries = await vscode.workspace.fs.readDirectory(uri);
    for (const [name, type] of entries) {
      if (token.isCancellationRequested) break;

      const childUri = vscode.Uri.joinPath(uri, name);
      if (type === vscode.FileType.Directory) {
        await this.uploadDirectory(destDir, childUri, token);
      } else {
        await this.uploadFile(destDir, childUri);
      }
    }
  }
}
