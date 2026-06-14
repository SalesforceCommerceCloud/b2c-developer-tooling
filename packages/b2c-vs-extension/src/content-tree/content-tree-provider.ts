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
import {webdavPathToUri} from '../webdav-tree/webdav-fs-provider.js';

/**
 * Tree node kinds.
 *
 * Content blocks (SDK `FRAGMENT` nodes) are shared/reusable singletons, so they
 * are rendered two ways:
 * - `contentBlockGroup`: a synthetic per-library group node ("Content Blocks")
 *   that is the single source of truth — it lists every block with its full
 *   child subtree, and is the only place a block can be opened/edited.
 * - `fragment`: a block as it appears *inside the group* (expandable source).
 * - `fragmentRef`: a block as it appears *anywhere it is linked* (under a page,
 *   component, or another block) — a non-expanding pointer that reveals the
 *   source in the group when clicked. Editing only ever happens via the source.
 */
type ContentNodeType =
  | 'library'
  | 'page'
  | 'content'
  | 'component'
  | 'static'
  | 'contentBlockGroup'
  | 'fragment'
  | 'fragmentRef';

/**
 * Build a stable path-from-root string for a LibraryNode. Used to produce a
 * unique TreeItem.id since the same content id (e.g. a shared component) can
 * appear under multiple parent nodes in the same library tree.
 */
function buildLibraryNodePath(node: LibraryNode): string {
  const segments: string[] = [];
  let current: LibraryNode | null = node;
  while (current && current.parent) {
    segments.unshift(current.id);
    current = current.parent;
  }
  return segments.join('/');
}

export class ContentTreeItem extends vscode.TreeItem {
  constructor(
    readonly nodeType: ContentNodeType,
    readonly libraryId: string,
    readonly isSiteLibrary: boolean,
    readonly contentId: string,
    readonly libraryNode?: LibraryNode,
  ) {
    const label = ContentTreeItem.buildLabel(nodeType, libraryId, isSiteLibrary, contentId, libraryNode);
    const collapsible = ContentTreeItem.buildCollapsibleState(nodeType, libraryNode);

    super(label, collapsible);

    // Stable id: libraries are unique by id+scope; the synthetic group is unique
    // per library; a source fragment is unique by its content id (the block is a
    // single shared object, regardless of where it is linked); other content
    // nodes (incl. fragment references) need a path-from-root because the same
    // content id can appear under multiple parents.
    const libScope = `${libraryId}:${isSiteLibrary ? 'site' : 'shared'}`;
    if (nodeType === 'library') {
      this.id = `lib:${libScope}`;
    } else if (nodeType === 'contentBlockGroup') {
      this.id = `content:contentBlockGroup:${libScope}`;
    } else if (nodeType === 'fragment') {
      this.id = `content:fragment:${libScope}:${contentId}`;
    } else {
      const ancestorPath = libraryNode ? buildLibraryNodePath(libraryNode) : contentId;
      this.id = `content:${nodeType}:${libScope}:${ancestorPath}`;
    }

    this.contextValue = nodeType;

    // Descriptions
    if (nodeType === 'component' && libraryNode?.typeId) {
      // Show content ID as description for components (label is typeId)
      this.description = contentId;
    } else if (nodeType === 'content') {
      this.description = 'CONTENT ASSET';
    } else if (nodeType === 'fragment' || nodeType === 'fragmentRef') {
      // Reference nodes get an arrow affordance signalling "shared block".
      this.description =
        nodeType === 'fragmentRef' ? `↗ ${libraryNode?.typeId ?? 'content block'}` : (libraryNode?.typeId ?? undefined);
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
      case 'contentBlockGroup':
        this.iconPath = new vscode.ThemeIcon('symbol-structure');
        break;
      case 'fragment':
        this.iconPath = new vscode.ThemeIcon('symbol-field');
        break;
      case 'fragmentRef':
        this.iconPath = new vscode.ThemeIcon('references');
        break;
    }

    // Click command for openable items
    if (nodeType === 'static') {
      const cleanPath = contentId.startsWith('/') ? contentId.slice(1) : contentId;
      const webdavPath = `Libraries/${libraryId}/default/${cleanPath}`;
      this.command = {
        command: 'vscode.open',
        title: 'Open Static Asset',
        arguments: [webdavPathToUri(webdavPath)],
      };
    } else if (nodeType === 'fragmentRef') {
      // A reference is navigational, not editable: reveal the canonical source
      // under the Content Blocks group so all edits funnel through one place.
      this.command = {
        command: 'b2c-dx.content.revealBlock',
        title: 'Reveal Content Block',
        arguments: [this],
      };
    } else if (nodeType === 'fragment') {
      // The source block opens its XML for viewing/editing.
      this.command = {
        command: 'vscode.open',
        title: 'Open Content Block',
        arguments: [contentItemUri(libraryId, isSiteLibrary, contentId)],
      };
    } else if (nodeType === 'page' || nodeType === 'content' || nodeType === 'component') {
      const uri = contentItemUri(libraryId, isSiteLibrary, contentId);
      this.command = {
        command: 'vscode.open',
        title: 'Open Content',
        arguments: [uri],
      };
    }
  }

  private static buildLabel(
    nodeType: ContentNodeType,
    libraryId: string,
    isSiteLibrary: boolean,
    contentId: string,
    libraryNode?: LibraryNode,
  ): string {
    switch (nodeType) {
      case 'library':
        return isSiteLibrary ? `${libraryId} [site]` : libraryId;
      case 'contentBlockGroup':
        return 'Content Blocks';
      case 'fragment':
      case 'fragmentRef':
        // Content blocks are identified by their display name.
        return libraryNode?.displayName ?? contentId;
      case 'component':
        return libraryNode?.typeId ?? contentId;
      default:
        return contentId;
    }
  }

  private static buildCollapsibleState(
    nodeType: ContentNodeType,
    libraryNode?: LibraryNode,
  ): vscode.TreeItemCollapsibleState {
    // References and static assets are always leaves; the group is always
    // expandable. Everything else expands only when it has children.
    if (nodeType === 'static' || nodeType === 'fragmentRef') {
      return vscode.TreeItemCollapsibleState.None;
    }
    if (nodeType === 'library' || nodeType === 'page' || nodeType === 'contentBlockGroup') {
      return vscode.TreeItemCollapsibleState.Collapsed;
    }
    return (libraryNode?.children.length ?? 0) > 0
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;
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

  getParent(element: ContentTreeItem): ContentTreeItem | undefined {
    // Only the source-fragment → group → library chain needs a parent, which is
    // what TreeView.reveal walks when surfacing a block from a reference click.
    if (element.nodeType === 'fragment') {
      return new ContentTreeItem('contentBlockGroup', element.libraryId, element.isSiteLibrary, element.libraryId);
    }
    if (element.nodeType === 'contentBlockGroup') {
      return new ContentTreeItem('library', element.libraryId, element.isSiteLibrary, element.libraryId);
    }
    return undefined;
  }

  async getChildren(element?: ContentTreeItem): Promise<ContentTreeItem[]> {
    if (!element) {
      return this.getRootChildren();
    }

    if (element.nodeType === 'library') {
      return this.getLibraryChildren(element);
    }

    // The synthetic group lists every content block as an expandable source.
    if (element.nodeType === 'contentBlockGroup') {
      const library = this.configProvider.getCachedLibrary(element.libraryId);
      if (!library) {
        return [];
      }
      return library
        .getContentBlocks()
        .map((node) => this.nodeToTreeItem(node, element.libraryId, element.isSiteLibrary, 'source'));
    }

    // References are leaves — never expand them (avoids duplicating a shared
    // block's subtree and any cycle risk).
    if (element.nodeType === 'fragmentRef') {
      return [];
    }

    // PAGE, CONTENT, COMPONENT, and source FRAGMENT: render children from the
    // libraryNode reference. A fragment child is rendered as a reference.
    if (element.libraryNode) {
      return element.libraryNode.children.map((node) =>
        this.nodeToTreeItem(node, element.libraryId, element.isSiteLibrary),
      );
    }

    return [];
  }

  /**
   * Find the cached source-fragment LibraryNode for a content id, so a reference
   * click can reveal the canonical block under the Content Blocks group.
   */
  getContentBlockSource(libraryId: string, isSiteLibrary: boolean, contentId: string): ContentTreeItem | undefined {
    const library = this.configProvider.getCachedLibrary(libraryId);
    if (!library) {
      return undefined;
    }
    const block = library.getContentBlocks().find((b) => b.id === contentId);
    return block ? this.nodeToTreeItem(block, libraryId, isSiteLibrary, 'source') : undefined;
  }

  private getRootChildren(): ContentTreeItem[] {
    const instance = this.configProvider.getInstance();
    if (!instance) {
      return [];
    }

    // Auto-seed configured libraries if the in-memory list is empty.
    // Seed the union of `libraries` (each entry can mark siteLibrary) and
    // the singular `contentLibrary` (as a shared library). addLibrary
    // dedupes by id+siteLibrary, so listing the same id in both is a no-op.
    const libraries = this.configProvider.getLibraries();
    if (libraries.length === 0) {
      for (const entry of this.configProvider.getConfiguredLibraries()) {
        this.configProvider.addLibrary(entry.id, entry.siteLibrary);
      }
      const contentLibrary = this.configProvider.getExplicitContentLibrary();
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
              assetQuery: this.configProvider.getAssetQuery(),
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

    const items = children.map((node) => this.nodeToTreeItem(node, element.libraryId, element.isSiteLibrary));

    // Prepend the synthetic "Content Blocks" group when the library has any
    // fragments. This group is the source of truth for shared blocks.
    if (library.getContentBlocks().length > 0) {
      items.unshift(
        new ContentTreeItem('contentBlockGroup', element.libraryId, element.isSiteLibrary, element.libraryId),
      );
    }

    return items;
  }

  /**
   * Convert a LibraryNode into a tree item. A FRAGMENT renders as an expandable
   * source only inside the Content Blocks group (`context === 'source'`); in any
   * other position it renders as a non-expanding reference.
   */
  private nodeToTreeItem(
    node: LibraryNode,
    libraryId: string,
    isSiteLibrary: boolean,
    context: 'source' | 'inline' = 'inline',
  ): ContentTreeItem {
    let nodeType: ContentNodeType;
    if (node.type === 'FRAGMENT') {
      nodeType = context === 'source' ? 'fragment' : 'fragmentRef';
    } else {
      nodeType = node.type.toLowerCase() as ContentNodeType;
    }
    return new ContentTreeItem(nodeType, libraryId, isSiteLibrary, node.id, node);
  }
}
