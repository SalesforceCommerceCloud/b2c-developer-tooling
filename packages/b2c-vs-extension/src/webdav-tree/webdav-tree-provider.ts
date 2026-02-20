/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {WebDavConfigProvider} from './webdav-config.js';
import {type WebDavFileSystemProvider, WEBDAV_ROOTS, webdavPathToUri} from './webdav-fs-provider.js';

function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export class WebDavTreeItem extends vscode.TreeItem {
  constructor(
    readonly nodeType: 'root' | 'directory' | 'file',
    readonly webdavPath: string,
    readonly fileName: string,
    readonly isCollection: boolean,
    readonly contentLength?: number,
  ) {
    super(
      fileName,
      nodeType === 'file' ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );

    this.contextValue = nodeType;
    this.tooltip = webdavPath;

    const resourceUri = webdavPathToUri(webdavPath);

    if (nodeType === 'root') {
      this.resourceUri = resourceUri;
    } else if (nodeType === 'directory') {
      this.resourceUri = resourceUri;
    } else {
      this.resourceUri = resourceUri;
      if (contentLength !== undefined) {
        this.description = formatFileSize(contentLength);
      }
      this.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [resourceUri],
      };
    }
  }
}

export class WebDavTreeDataProvider implements vscode.TreeDataProvider<WebDavTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<WebDavTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private configProvider: WebDavConfigProvider,
    private fsProvider: WebDavFileSystemProvider,
  ) {
    // Auto-refresh the tree when the FS provider fires change events
    this.fsProvider.onDidChangeFile(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  refresh(): void {
    this.fsProvider.clearCache();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WebDavTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: WebDavTreeItem): Promise<WebDavTreeItem[]> {
    if (!element) {
      const instance = this.configProvider.getInstance();
      if (!instance) {
        return [];
      }
      return WEBDAV_ROOTS.map((r) => new WebDavTreeItem('root', r.path, r.key, true));
    }

    try {
      const uri = webdavPathToUri(element.webdavPath);
      const entries = await this.fsProvider.readDirectory(uri);

      const children: WebDavTreeItem[] = [];
      for (const [name, fileType] of entries) {
        const childPath = `${element.webdavPath}/${name}`;
        const isCollection = fileType === vscode.FileType.Directory;
        const nodeType = isCollection ? 'directory' : 'file';

        let contentLength: number | undefined;
        if (!isCollection) {
          try {
            const childStat = await this.fsProvider.stat(webdavPathToUri(childPath));
            contentLength = childStat.size;
          } catch {
            // Stat may fail — show item without size
          }
        }

        children.push(new WebDavTreeItem(nodeType, childPath, name, isCollection, contentLength));
      }

      // Sort: directories first, then alphabetical
      children.sort((a, b) => {
        if (a.isCollection !== b.isCollection) {
          return a.isCollection ? -1 : 1;
        }
        return a.fileName.localeCompare(b.fileName);
      });

      return children;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`WebDAV: Failed to list ${element.webdavPath}: ${message}`);
      return [];
    }
  }
}
