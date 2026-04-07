/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {type WebDavFileSystemProvider, WEBDAV_ROOTS, VIRTUAL_ROOTS, webdavPathToUri} from './webdav-fs-provider.js';
import type {WebDavMappingsProvider} from './webdav-mappings.js';

function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export type WebDavNodeType =
  | 'root'
  | 'virtual-root'
  | 'catalog-mapping'
  | 'library-mapping'
  | 'placeholder'
  | 'directory'
  | 'file';

export class WebDavTreeItem extends vscode.TreeItem {
  constructor(
    readonly nodeType: WebDavNodeType,
    readonly webdavPath: string,
    readonly fileName: string,
    readonly isCollection: boolean,
    readonly contentLength?: number,
  ) {
    const collapsible =
      nodeType === 'file' || nodeType === 'placeholder'
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed;
    super(fileName, collapsible);

    // Use path-specific contextValues for virtual roots so menu when-clauses
    // can distinguish Catalogs from Libraries.
    if (nodeType === 'virtual-root') {
      this.contextValue = webdavPath === 'Catalogs' ? 'virtual-root-catalogs' : 'virtual-root-libraries';
    } else {
      this.contextValue = nodeType;
    }
    this.tooltip = webdavPath;

    if (nodeType === 'placeholder') {
      this.iconPath = new vscode.ThemeIcon('info');
      return;
    }

    const resourceUri = webdavPathToUri(webdavPath);
    this.resourceUri = resourceUri;

    if (nodeType === 'file') {
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
    private configProvider: B2CExtensionConfig,
    private fsProvider: WebDavFileSystemProvider,
    private mappingsProvider: WebDavMappingsProvider,
  ) {
    // Auto-refresh the tree when the FS provider fires change events
    this.fsProvider.onDidChangeFile(() => {
      this._onDidChangeTreeData.fire();
    });
    this.mappingsProvider.onDidChange(() => {
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

  getParent(element: WebDavTreeItem): WebDavTreeItem | undefined {
    if (element.nodeType === 'root' || element.nodeType === 'virtual-root') {
      return undefined; // top-level roots have no parent
    }

    // catalog-mapping / library-mapping → parent is the virtual root
    if (element.nodeType === 'catalog-mapping') {
      return new WebDavTreeItem('virtual-root', 'Catalogs', 'Catalogs', true);
    }
    if (element.nodeType === 'library-mapping') {
      return new WebDavTreeItem('virtual-root', 'Libraries', 'Libraries', true);
    }

    if (element.nodeType === 'placeholder') {
      return undefined;
    }

    // directory / file → parent is derived from webdavPath
    const parentPath = element.webdavPath.includes('/')
      ? element.webdavPath.substring(0, element.webdavPath.lastIndexOf('/'))
      : '';

    if (!parentPath) {
      return undefined;
    }

    // Check if the parent path is a root-level entry
    const rootEntry = WEBDAV_ROOTS.find((r) => r.path === parentPath);
    if (rootEntry) {
      const nodeType = VIRTUAL_ROOTS.has(rootEntry.key) ? 'virtual-root' : 'root';
      return new WebDavTreeItem(nodeType, rootEntry.path, rootEntry.key, true);
    }

    // Check if the parent is a catalog or library mapping (e.g., "Catalogs/my-catalog")
    const segments = parentPath.split('/');
    if (segments.length === 2 && VIRTUAL_ROOTS.has(segments[0])) {
      const mappingType = segments[0] === 'Catalogs' ? 'catalog-mapping' : 'library-mapping';
      return new WebDavTreeItem(mappingType, parentPath, segments[1], true);
    }

    return new WebDavTreeItem('directory', parentPath, parentPath.split('/').pop() ?? parentPath, true);
  }

  /**
   * Find a tree item by its webdav path and node type.
   * Used by commands that need to reveal specific nodes.
   */
  findItem(nodeType: WebDavNodeType, webdavPath: string): WebDavTreeItem | undefined {
    const fileName = webdavPath.split('/').pop() ?? webdavPath;
    return new WebDavTreeItem(nodeType, webdavPath, fileName, true);
  }

  async getChildren(element?: WebDavTreeItem): Promise<WebDavTreeItem[]> {
    if (!element) {
      return this.getRootChildren();
    }

    if (element.nodeType === 'virtual-root') {
      return this.getVirtualRootChildren(element);
    }

    // placeholder nodes have no children
    if (element.nodeType === 'placeholder') {
      return [];
    }

    // catalog-mapping, library-mapping, root, directory — all do PROPFIND
    return this.getPropfindChildren(element);
  }

  private getRootChildren(): WebDavTreeItem[] {
    const instance = this.configProvider.getInstance();
    if (!instance) {
      return [];
    }
    return WEBDAV_ROOTS.map((r) => {
      const nodeType = VIRTUAL_ROOTS.has(r.key) ? 'virtual-root' : 'root';
      return new WebDavTreeItem(nodeType, r.path, r.key, true);
    });
  }

  private getVirtualRootChildren(element: WebDavTreeItem): WebDavTreeItem[] {
    if (element.webdavPath === 'Catalogs') {
      const ids = this.mappingsProvider.getCatalogIds();
      if (ids.length === 0) {
        return [new WebDavTreeItem('placeholder', '', 'No catalogs configured — right-click to add', false)];
      }
      return ids.map((id) => new WebDavTreeItem('catalog-mapping', `Catalogs/${id}`, id, true));
    }

    if (element.webdavPath === 'Libraries') {
      const ids = this.mappingsProvider.getLibraryIds();
      if (ids.length === 0) {
        return [new WebDavTreeItem('placeholder', '', 'No libraries configured — right-click to add', false)];
      }
      return ids.map((id) => new WebDavTreeItem('library-mapping', `Libraries/${id}`, id, true));
    }

    return [];
  }

  private async getPropfindChildren(element: WebDavTreeItem): Promise<WebDavTreeItem[]> {
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
      // Silently return empty for "not found" — happens when the tree re-expands
      // after switching to a server where a previously-expanded path doesn't exist.
      if (err instanceof vscode.FileSystemError && err.code === 'FileNotFound') {
        return [];
      }
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`WebDAV: Failed to list ${element.webdavPath}: ${message}`);
      return [];
    }
  }
}
