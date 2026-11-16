/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as path from 'path';
import * as vscode from 'vscode';
import {type CartridgeOrderSource, describeOrderSource} from '../cartridges/cartridge-order.js';
import type {CartridgeService} from '../cartridges/cartridge-service.js';
import type {ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';
import type {ProjectIndexService} from '../cartridges/project-index-service.js';
import {applyRow, openCommand} from '../endpoints/endpoints-tree.js';
import {
  cartridgeCustomApis,
  cartridgeHookRows,
  cartridgeJobStepRows,
  controllerFiles,
  customApiEndpointRow,
  type ControllerFile,
  type CustomApiGroup,
  type RowModel,
} from '../endpoints/model.js';

/**
 * Each cartridge expands into what it contributes: controllers, hooks, and
 * Custom APIs (from the shared project index, so they match the Endpoints
 * view), plus custom job steps registered in `steptypes.json`.
 */
export type CartridgeCategory = 'controllers' | 'customApis' | 'hooks' | 'stepTypes';

export type CartridgeNode =
  | CartridgeItem
  | CartridgeCategoryItem
  | ControllerFileItem
  | ControllerStatementItem
  | CartridgeRowItem
  | CustomApiItem
  | CartridgeCategoryEmptyItem;

/** Where a cartridge sits in the panel order, for its description and tooltip. */
export interface CartridgeItemOrder {
  /** 1-based position. */
  position: number;
  total: number;
  source: CartridgeOrderSource;
  sourceLabel: string;
  /** False when the order comes from a cartridge path that doesn't name this cartridge. */
  onPath?: boolean;
}

export class CartridgeItem extends vscode.TreeItem {
  readonly kind = 'cartridge' as const;

  constructor(
    public readonly cartridge: CartridgeMapping,
    order?: CartridgeItemOrder,
  ) {
    super(cartridge.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart:${cartridge.src}`;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    const location = workspaceFolders ? path.relative(workspaceFolders[0].uri.fsPath, cartridge.src) : undefined;
    const notOnPath = order?.onPath === false;
    this.description = [location, notOnPath ? 'not on cartridge path' : undefined].filter(Boolean).join(' · ');

    this.iconPath = new vscode.ThemeIcon('package');
    this.contextValue = 'cartridge';
    this.tooltip = order
      ? `${cartridge.src}\nPosition ${order.position} of ${order.total} · ${order.sourceLabel}` +
        (notOnPath ? '\nNot named in the cartridge path this order comes from.' : '') +
        (order.source === 'guessed'
          ? '\nTo use the real order: choose a site for the cartridge order, set "cartridges" in your configuration, or drag to reorder.'
          : '')
      : cartridge.src;
  }
}

const CATEGORY_LABELS: Record<CartridgeCategory, string> = {
  controllers: 'Controllers',
  customApis: 'Custom APIs',
  hooks: 'Hooks',
  stepTypes: 'Custom Job Steps',
};

const CATEGORY_ICONS: Record<CartridgeCategory, string> = {
  controllers: 'symbol-class',
  customApis: 'globe',
  hooks: 'plug',
  stepTypes: 'symbol-method',
};

const CATEGORY_EMPTY_HINTS: Record<CartridgeCategory, {label: string; description: string}> = {
  controllers: {label: 'No controllers', description: 'Add a controller under cartridge/controllers/'},
  customApis: {label: 'No Custom APIs', description: 'Add one under cartridge/rest-apis/'},
  hooks: {label: 'No hooks registered', description: 'Add a hooks.json to register one'},
  stepTypes: {label: 'No custom job steps registered', description: 'Add a steptypes.json in the cartridge root'},
};

/** Grouping node beneath a cartridge ("Controllers", "Hooks", "Custom APIs", "Custom Job Steps"). */
export class CartridgeCategoryItem extends vscode.TreeItem {
  readonly kind = 'category' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    readonly category: CartridgeCategory,
  ) {
    super(CATEGORY_LABELS[category], vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart-cat:${cartridge.src}:${category}`;
    this.iconPath = new vscode.ThemeIcon(CATEGORY_ICONS[category]);
    this.contextValue = `cartridge-${category}`;
  }
}

/**
 * Leaf shown when a category has nothing to list — makes the chevron click
 * informative instead of silently empty.
 */
export class CartridgeCategoryEmptyItem extends vscode.TreeItem {
  readonly kind = 'categoryEmpty' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    readonly category: CartridgeCategory,
  ) {
    const hint = CATEGORY_EMPTY_HINTS[category];
    super(hint.label, vscode.TreeItemCollapsibleState.None);
    this.id = `cart-cat-empty:${cartridge.src}:${category}`;
    this.iconPath = new vscode.ThemeIcon('info');
    this.description = hint.description;
    this.contextValue = `cartridge-${category}-empty`;
  }
}

/** A controller file under a cartridge's Controllers category. */
export class ControllerFileItem extends vscode.TreeItem {
  readonly kind = 'controllerFile' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    readonly file: ControllerFile,
  ) {
    super(file.relPath.split('/').at(-1) ?? file.relPath, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart-controller:${cartridge.src}:${file.relPath}`;
    this.description = file.extends ? `extends ${file.extends}` : undefined;
    this.resourceUri = vscode.Uri.file(path.join(cartridge.src, file.relPath));
    this.iconPath = file.rows.some((r) => r.warning)
      ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'))
      : new vscode.ThemeIcon('symbol-class');
    this.contextValue = 'cartridge-controller-file';
    this.command = openCommand(path.join(cartridge.src, file.relPath));
  }
}

/** One route statement (`post AddProduct`, `replace Show`, `exports.Submit`) in a controller file. */
export class ControllerStatementItem extends vscode.TreeItem {
  readonly kind = 'controllerStatement' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    row: RowModel,
    position: number,
  ) {
    super(row.label, vscode.TreeItemCollapsibleState.None);
    this.id = `cart-controller-row:${cartridge.src}:${row.location?.relPath}:${position}`;
    this.description = row.description;
    this.tooltip = row.tooltip;
    this.iconPath = row.warning
      ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'))
      : new vscode.ThemeIcon('symbol-method');
    this.contextValue = 'cartridge-controller-statement';
    if (row.location) this.command = openCommand(path.join(cartridge.src, row.location.relPath), row.location.line);
  }
}

/** A project-index row (hook registration, Custom API endpoint) under a cartridge category. */
export class CartridgeRowItem extends vscode.TreeItem {
  readonly kind = 'row' as const;

  constructor(
    index: ProjectIndex,
    readonly row: RowModel,
    id: string,
    icon: string,
    contextValue: string,
  ) {
    super(row.label, vscode.TreeItemCollapsibleState.None);
    applyRow(this, index, row, id, icon, contextValue);
  }
}

/** A Custom API defined in a cartridge; expands into its endpoints. */
export class CustomApiItem extends vscode.TreeItem {
  readonly kind = 'customApi' as const;

  constructor(
    index: ProjectIndex,
    readonly cartridge: CartridgeMapping,
    readonly group: CustomApiGroup,
  ) {
    super(group.api, vscode.TreeItemCollapsibleState.Collapsed);
    applyRow(this, index, group.row, `cart-api:${cartridge.src}:${group.api}`, 'globe', 'cartridge-custom-api');
    this.description = group.types.join('/');
    if (group.endpoints.some((e) => e.problems.length > 0)) {
      this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
    }
  }
}

export type CartridgeTreeItem = CartridgeNode;

export class CartridgeTreeProvider implements vscode.TreeDataProvider<CartridgeNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<CartridgeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly cartridgesSub: vscode.Disposable;

  private readonly indexSub: vscode.Disposable;

  constructor(
    private readonly cartridgeService: CartridgeService,
    private readonly indexService: ProjectIndexService,
  ) {
    this.cartridgesSub = cartridgeService.onDidChange(() => this._onDidChangeTreeData.fire());
    this.indexSub = indexService.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this.cartridgeService.refresh();
  }

  getTreeItem(element: CartridgeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CartridgeNode): Promise<CartridgeNode[]> {
    if (!element) {
      const cartridges = this.cartridgeService.getCartridges();
      const info = this.cartridgeService.getOrderInfo();
      const sourceLabel = describeOrderSource(info).replace(/^Order: /, 'order from ');
      const checkPath = info.source === 'config' || info.source === 'instance';
      return cartridges.map(
        (c, i) =>
          new CartridgeItem(c, {
            position: i + 1,
            total: cartridges.length,
            source: info.source,
            sourceLabel,
            onPath: checkPath ? info.path?.includes(c.name) : undefined,
          }),
      );
    }

    if (element instanceof CartridgeItem) {
      return [
        new CartridgeCategoryItem(element.cartridge, 'controllers'),
        new CartridgeCategoryItem(element.cartridge, 'hooks'),
        new CartridgeCategoryItem(element.cartridge, 'customApis'),
        new CartridgeCategoryItem(element.cartridge, 'stepTypes'),
      ];
    }

    if (element instanceof CartridgeCategoryItem) {
      return this.getCategoryChildren(element);
    }

    if (element instanceof ControllerFileItem) {
      return element.file.rows.map((row, i) => new ControllerStatementItem(element.cartridge, row, i));
    }

    if (element instanceof CustomApiItem) {
      const index = this.indexService.getIndex();
      return element.group.endpoints.map(
        (e, i) =>
          new CartridgeRowItem(
            index,
            customApiEndpointRow(e),
            `cart-api-endpoint:${element.cartridge.src}:${element.group.api}:${i}`,
            'symbol-method',
            'cartridge-custom-api-endpoint',
          ),
      );
    }

    return [];
  }

  /** Enumerates the children for a category, all from the project index. */
  private getCategoryChildren(node: CartridgeCategoryItem): CartridgeNode[] {
    if (node.category === 'controllers') {
      const files = controllerFiles(this.indexService.getIndex(), node.cartridge.name);
      if (files.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'controllers')];
      return files.map((file) => new ControllerFileItem(node.cartridge, file));
    }

    if (node.category === 'hooks') {
      const index = this.indexService.getIndex();
      const rows = cartridgeHookRows(index, node.cartridge.name);
      if (rows.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'hooks')];
      return rows.map(
        (row, i) =>
          new CartridgeRowItem(index, row, `cart-hook:${node.cartridge.src}:${i}`, 'symbol-function', 'cartridge-hook'),
      );
    }

    if (node.category === 'customApis') {
      const index = this.indexService.getIndex();
      const groups = cartridgeCustomApis(index, node.cartridge.name);
      if (groups.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'customApis')];
      return groups.map((group) => new CustomApiItem(index, node.cartridge, group));
    }

    const index = this.indexService.getIndex();
    const rows = cartridgeJobStepRows(index, node.cartridge.name);
    if (rows.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'stepTypes')];
    return rows.map(
      (row) =>
        new CartridgeRowItem(
          index,
          row,
          `cart-step:${node.cartridge.src}:${row.label}`,
          'symbol-method',
          'cartridge-step-type',
        ),
    );
  }

  dispose(): void {
    this.indexSub.dispose();
    this.cartridgesSub.dispose();
    this._onDidChangeTreeData.dispose();
  }
}
