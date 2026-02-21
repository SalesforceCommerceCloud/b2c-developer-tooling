/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {LibraryNode} from '@salesforce/b2c-tooling-sdk/operations/content';
import {fetchContentLibrary} from '@salesforce/b2c-tooling-sdk/operations/content';
import * as vscode from 'vscode';
import type {ContentConfigProvider} from './content-config.js';
import {contentItemUri} from './content-fs-provider.js';

type ContentNodeType = 'library' | 'page' | 'content' | 'component' | 'static';

export class ContentTreeItem extends vscode.TreeItem {
  constructor(
    readonly nodeType: ContentNodeType,
    readonly libraryId: string,
    readonly isSiteLibrary: boolean,
    readonly contentId: string,
    readonly libraryNode?: LibraryNode,
  ) {
    const label =
      nodeType === 'library'
        ? isSiteLibrary
          ? `${libraryId} [site]`
          : libraryId
        : nodeType === 'component' && libraryNode?.typeId
          ? libraryNode.typeId
          : contentId;

    const collapsible =
      nodeType === 'static'
        ? vscode.TreeItemCollapsibleState.None
        : nodeType === 'library' || nodeType === 'page'
          ? vscode.TreeItemCollapsibleState.Collapsed
          : (libraryNode?.children.length ?? 0) > 0
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

    super(label, collapsible);

    this.contextValue = nodeType;

    // Show content ID as description for components (label is typeId)
    if (nodeType === 'component' && libraryNode?.typeId) {
      this.description = contentId;
    }

    // Type suffix for content assets
    if (nodeType === 'content') {
      this.description = 'CONTENT ASSET';
    }

    // Icons
    switch (nodeType) {
      case 'library':
        this.iconPath = new vscode.ThemeIcon('library');
        break;
      case 'page':
        this.iconPath = new vscode.ThemeIcon('file-code');
        break;
      case 'content':
        this.iconPath = new vscode.ThemeIcon('file-text');
        break;
      case 'component':
        this.iconPath = new vscode.ThemeIcon('symbol-class');
        break;
      case 'static':
        this.iconPath = new vscode.ThemeIcon('file-media');
        break;
    }

    // Click command for openable items
    if (nodeType !== 'library' && nodeType !== 'static') {
      const uri = contentItemUri(libraryId, isSiteLibrary, contentId);
      this.command = {
        command: 'vscode.open',
        title: 'Open Content',
        arguments: [uri],
      };
    }
  }
}

export class ContentTreeDataProvider implements vscode.TreeDataProvider<ContentTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ContentTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private filterPattern: string | undefined;

  constructor(private configProvider: ContentConfigProvider) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setFilter(pattern: string | undefined): void {
    this.filterPattern = pattern;
    vscode.commands.executeCommand('setContext', 'b2cContentFilterActive', !!pattern);
    this._onDidChangeTreeData.fire();
  }

  getFilter(): string | undefined {
    return this.filterPattern;
  }

  getTreeItem(element: ContentTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ContentTreeItem): Promise<ContentTreeItem[]> {
    if (!element) {
      return this.getRootChildren();
    }

    if (element.nodeType === 'library') {
      return this.getLibraryChildren(element);
    }

    // PAGE, CONTENT, COMPONENT: return children from the libraryNode reference
    if (element.libraryNode) {
      return element.libraryNode.children.map((node) =>
        this.nodeToTreeItem(node, element.libraryId, element.isSiteLibrary),
      );
    }

    return [];
  }

  private getRootChildren(): ContentTreeItem[] {
    const instance = this.configProvider.getInstance();
    if (!instance) {
      return [];
    }

    // Auto-add configured library if list is empty
    const libraries = this.configProvider.getLibraries();
    if (libraries.length === 0) {
      const contentLibrary = this.configProvider.getContentLibrary();
      if (contentLibrary) {
        this.configProvider.addLibrary(contentLibrary, false);
      }
    }

    return this.configProvider
      .getLibraries()
      .map((lib) => new ContentTreeItem('library', lib.id, lib.isSiteLibrary, lib.id));
  }

  private async getLibraryChildren(element: ContentTreeItem): Promise<ContentTreeItem[]> {
    let library = this.configProvider.getCachedLibrary(element.libraryId);

    if (!library) {
      const instance = this.configProvider.getInstance();
      if (!instance) {
        return [];
      }

      try {
        library = await vscode.window.withProgress(
          {location: vscode.ProgressLocation.Notification, title: `Fetching library ${element.libraryId}...`},
          async () => {
            const result = await fetchContentLibrary(instance, element.libraryId, {
              isSiteLibrary: element.isSiteLibrary,
            });
            return result.library;
          },
        );
        this.configProvider.setCachedLibrary(element.libraryId, library);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to fetch library ${element.libraryId}: ${message}`);
        return [];
      }
    }

    let children = library.tree.children.filter((node) => !node.hidden);

    if (this.filterPattern) {
      const lower = this.filterPattern.toLowerCase();
      children = children.filter((node) => node.id.toLowerCase().includes(lower));
    }

    return children.map((node) => this.nodeToTreeItem(node, element.libraryId, element.isSiteLibrary));
  }

  private nodeToTreeItem(node: LibraryNode, libraryId: string, isSiteLibrary: boolean): ContentTreeItem {
    const nodeType = node.type.toLowerCase() as ContentNodeType;
    return new ContentTreeItem(nodeType, libraryId, isSiteLibrary, node.id, node);
  }
}
