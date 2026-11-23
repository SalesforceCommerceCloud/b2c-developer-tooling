/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import {
  type CartridgeOrderSource,
  cartridgePathNames,
  describeOrderSource,
  INCLUDE_ALL_CARTRIDGES_SETTING,
} from '../cartridges/cartridge-order.js';
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
  | CartridgeNotOnPathItem
  | InactiveControllerItem
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
  /** True when the order comes from a cartridge path that doesn't name this cartridge. */
  readonly notOnPath: boolean;

  constructor(
    public readonly cartridge: CartridgeMapping,
    order?: CartridgeItemOrder,
  ) {
    super(cartridge.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart:${cartridge.src}`;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    const location = workspaceFolders ? path.relative(workspaceFolders[0].uri.fsPath, cartridge.src) : undefined;
    const notOnPath = order?.onPath === false;
    this.notOnPath = notOnPath;
    this.description = [location, notOnPath ? 'not on cartridge path' : undefined].filter(Boolean).join(' · ');

    // Dimmed: the site doesn't run this cartridge's code, so it isn't part of routes or hooks.
    this.iconPath = notOnPath
      ? new vscode.ThemeIcon('package', new vscode.ThemeColor('disabledForeground'))
      : new vscode.ThemeIcon('package');
    // Keep 'cartridge' so deploy and other cartridge actions stay available.
    this.contextValue = 'cartridge';
    this.tooltip = order
      ? `${cartridge.src}\nPosition ${order.position} of ${order.total} · ${order.sourceLabel}` +
        (notOnPath
          ? '\nNot on the cartridge path, so the site does not run its code. Its controllers, hooks, and APIs are ' +
            'left out of routes and the Endpoints view.'
          : '') +
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

/** First child of a cartridge that isn't on the cartridge path: says why it has no routes or hooks. */
export class CartridgeNotOnPathItem extends vscode.TreeItem {
  readonly kind = 'notOnPath' as const;

  constructor(readonly cartridge: CartridgeMapping) {
    super('Not on the cartridge path', vscode.TreeItemCollapsibleState.None);
    this.id = `cart-not-on-path:${cartridge.src}`;
    this.iconPath = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('disabledForeground'));
    this.description = 'the site does not run this code';
    this.tooltip =
      'This cartridge is not on the cartridge path the order comes from, so its controllers, hooks, and Custom APIs ' +
      'are not part of any route. Choose another site for the cartridge order if it belongs to one.';
    this.contextValue = 'cartridge-not-on-path-info';
  }
}

/** A controller file in a cartridge that isn't on the path: opens the file; no route composition. */
export class InactiveControllerItem extends vscode.TreeItem {
  readonly kind = 'inactiveController' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    relPath: string,
  ) {
    super(relPath.split('/').at(-1) ?? relPath, vscode.TreeItemCollapsibleState.None);
    this.id = `cart-inactive-controller:${cartridge.src}:${relPath}`;
    this.description = 'inactive';
    this.resourceUri = vscode.Uri.file(path.join(cartridge.src, relPath));
    this.iconPath = new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('disabledForeground'));
    this.contextValue = 'cartridge-controller-file-inactive';
    this.command = openCommand(path.join(cartridge.src, relPath));
  }
}

/** Controller files in a cartridge, relative to the cartridge root, read from disk. */
function inactiveControllerFiles(cartridge: CartridgeMapping): string[] {
  const dir = path.join(cartridge.src, 'cartridge', 'controllers');
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(js|ds)$/.test(f))
      .sort()
      .map((f) => `cartridge/controllers/${f}`);
  } catch {
    return [];
  }
}

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

/** A row that can expand into child rows, such as a custom hook's called functions and their call sites. */
export interface NestedRow extends RowModel {
  children?: NestedRow[];
  icon?: string;
}

/** A project-index row (hook registration, Custom API endpoint) under a cartridge category. */
export class CartridgeRowItem extends vscode.TreeItem {
  readonly kind = 'row' as const;

  constructor(
    readonly index: ProjectIndex,
    readonly row: NestedRow,
    id: string,
    icon: string,
    contextValue: string,
  ) {
    super(
      row.label,
      row.children?.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
    );
    applyRow(this, index, row, id, icon, contextValue);
  }

  childItems(): CartridgeRowItem[] {
    return (this.row.children ?? []).map(
      (child, i) =>
        new CartridgeRowItem(this.index, child, `${this.id}:${i}`, child.icon ?? 'symbol-function', 'cartridge-row'),
    );
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
    // Index changes cover the include-all setting too (the index service rebuilds on it).
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
      const includeAll = vscode.workspace
        .getConfiguration('b2c-dx')
        .get<boolean>(INCLUDE_ALL_CARTRIDGES_SETTING, false);
      const onPath = includeAll ? undefined : cartridgePathNames(info);
      return cartridges.map(
        (c, i) =>
          new CartridgeItem(c, {
            position: i + 1,
            total: cartridges.length,
            source: info.source,
            sourceLabel,
            onPath: onPath ? onPath.has(c.name) : undefined,
          }),
      );
    }

    if (element instanceof CartridgeItem && element.notOnPath) {
      return [
        new CartridgeNotOnPathItem(element.cartridge),
        ...inactiveControllerFiles(element.cartridge).map((f) => new InactiveControllerItem(element.cartridge, f)),
      ];
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

    if (element instanceof CartridgeRowItem) {
      return element.childItems();
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
