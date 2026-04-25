/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {findCartridges, type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as path from 'path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

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
  }
}

export type CartridgeTreeItem = CartridgeItem;

export class CartridgeTreeProvider implements vscode.TreeDataProvider<CartridgeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<CartridgeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private cartridges: CartridgeMapping[] = [];

  constructor(private readonly configProvider: B2CExtensionConfig) {}

  refresh(): void {
    this.cartridges = [];
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CartridgeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CartridgeItem): CartridgeItem[] {
    if (element) return [];

    if (this.cartridges.length === 0) {
      const workingDirectory = this.configProvider.getWorkingDirectory();
      if (workingDirectory) {
        this.cartridges = findCartridges(workingDirectory);
      }
    }

    return this.cartridges.map((c) => new CartridgeItem(c));
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
