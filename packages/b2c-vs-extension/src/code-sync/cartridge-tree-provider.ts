/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as path from 'path';
import * as vscode from 'vscode';
import type {CartridgeService} from '../cartridges/cartridge-service.js';

export class CartridgeItem extends vscode.TreeItem {
  constructor(public readonly cartridge: CartridgeMapping) {
    super(cartridge.name, vscode.TreeItemCollapsibleState.None);

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      this.description = path.relative(workspaceRoot, cartridge.src);
    }

    this.iconPath = new vscode.ThemeIcon('package');
    this.contextValue = 'cartridge';
    this.tooltip = cartridge.src;
    // Activate (single/double click per workbench.list.openMode) reveals the
    // cartridge directory in the Explorer view, expanding ancestor folders.
    this.command = {
      command: 'revealInExplorer',
      title: 'Reveal in Explorer',
      arguments: [vscode.Uri.file(cartridge.src)],
    };
  }
}

export type CartridgeTreeItem = CartridgeItem;

export class CartridgeTreeProvider implements vscode.TreeDataProvider<CartridgeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<CartridgeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly cartridgesSub: vscode.Disposable;

  constructor(private readonly cartridgeService: CartridgeService) {
    this.cartridgesSub = cartridgeService.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this.cartridgeService.refresh();
  }

  getTreeItem(element: CartridgeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CartridgeItem): CartridgeItem[] {
    if (element) return [];
    return this.cartridgeService.getCartridges().map((c) => new CartridgeItem(c));
  }

  dispose(): void {
    this.cartridgesSub.dispose();
    this._onDidChangeTreeData.dispose();
  }
}
