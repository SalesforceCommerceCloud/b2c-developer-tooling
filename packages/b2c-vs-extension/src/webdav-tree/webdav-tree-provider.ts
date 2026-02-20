/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {WebDavConfigProvider} from './webdav-config.js';

/** Standard B2C Commerce WebDAV root directories. */
const WEBDAV_ROOTS: {key: string; path: string}[] = [
  {key: 'Impex', path: 'Impex'},
  {key: 'Temp', path: 'Temp'},
  {key: 'Cartridges', path: 'Cartridges'},
  {key: 'Realmdata', path: 'Realmdata'},
  {key: 'Catalogs', path: 'Catalogs'},
  {key: 'Libraries', path: 'Libraries'},
  {key: 'Static', path: 'Static'},
  {key: 'Logs', path: 'Logs'},
  {key: 'Securitylogs', path: 'Securitylogs'},
];

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

    if (nodeType === 'root') {
      this.iconPath = new vscode.ThemeIcon('database');
    } else if (nodeType === 'directory') {
      this.iconPath = vscode.ThemeIcon.Folder;
    } else {
      this.iconPath = vscode.ThemeIcon.File;
      this.resourceUri = vscode.Uri.parse(`webdav://b2c/${webdavPath}`);
      if (contentLength !== undefined) {
        this.description = formatFileSize(contentLength);
      }
      this.command = {
        command: 'b2c-dx.webdav.openFile',
        title: 'Open File',
        arguments: [this],
      };
    }
  }
}

export class WebDavTreeDataProvider implements vscode.TreeDataProvider<WebDavTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<WebDavTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private childrenCache = new Map<string, WebDavTreeItem[]>();

  constructor(private configProvider: WebDavConfigProvider) {}

  refresh(): void {
    this.childrenCache.clear();
    this._onDidChangeTreeData.fire();
  }

  refreshNode(node: WebDavTreeItem): void {
    this.childrenCache.delete(node.webdavPath);
    this._onDidChangeTreeData.fire(node);
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

    const cached = this.childrenCache.get(element.webdavPath);
    if (cached) {
      return cached;
    }

    const instance = this.configProvider.getInstance();
    if (!instance) {
      return [];
    }

    try {
      const entries = await instance.webdav.propfind(element.webdavPath, '1');
      const normalizedPath = element.webdavPath.replace(/\/$/, '');
      const filtered = entries.filter((entry) => {
        const entryPath = decodeURIComponent(entry.href);
        return !entryPath.endsWith(`/${normalizedPath}`) && !entryPath.endsWith(`/${normalizedPath}/`);
      });

      const children = filtered
        .map((entry) => {
          const displayName = entry.displayName ?? entry.href.split('/').filter(Boolean).at(-1) ?? entry.href;
          const childPath = `${element.webdavPath}/${displayName}`;
          const nodeType = entry.isCollection ? 'directory' : 'file';
          return new WebDavTreeItem(nodeType, childPath, displayName, entry.isCollection, entry.contentLength);
        })
        .sort((a, b) => {
          if (a.isCollection !== b.isCollection) {
            return a.isCollection ? -1 : 1;
          }
          return a.fileName.localeCompare(b.fileName);
        });

      this.childrenCache.set(element.webdavPath, children);
      return children;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`WebDAV: Failed to list ${element.webdavPath}: ${message}`);
      return [];
    }
  }
}
