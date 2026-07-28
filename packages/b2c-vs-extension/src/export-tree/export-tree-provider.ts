/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {discoverExportableUnits} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import type {ExportableUnits} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {ExportSelection, GLOBAL_FLAGS, SIMPLE_CATEGORIES, SITE_FLAGS, type SimpleCategory} from './export-selection.js';

/**
 * Node kinds in the export tree:
 * - `category`     — a top-level group (Sites, Global Data, Catalogs, ...)
 * - `site`         — a discovered site under the Sites category
 * - `site-flag`    — a per-site data flag (content, site_preferences, ...)
 * - `global-flag`  — a global-data flag (meta_data, custom_types, ...)
 * - `unit`         — an ID member of a simple category (a catalog, library, ...)
 * - `placeholder`  — an informational, non-selectable leaf (empty/error states)
 */
type ExportNodeType = 'category' | 'site' | 'site-flag' | 'global-flag' | 'unit' | 'placeholder';

/** Identifies the top-level categories that are not simple ID lists. */
type SpecialCategory = 'sites' | 'global_data';
type CategoryKey = SimpleCategory | SpecialCategory;

export class ExportTreeItem extends vscode.TreeItem {
  constructor(
    readonly nodeType: ExportNodeType,
    /** Category this node belongs to (undefined for placeholders without a category). */
    readonly category: CategoryKey | undefined,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    /** For `site`/`unit`: the ID. For `site-flag`/`global-flag`: the flag name. */
    readonly value?: string,
    /** For `site-flag`: the owning site ID. */
    readonly siteId?: string,
  ) {
    super(label, collapsibleState);
    this.contextValue = nodeType;
    // Stable id so checkbox state and reveal survive refreshes.
    this.id = [nodeType, category ?? '', siteId ?? '', value ?? label].join(':');
  }
}

export class ExportTreeDataProvider implements vscode.TreeDataProvider<ExportTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<ExportTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  /** Manually-added IDs for non-discoverable categories (libraries, price books, customer lists). */
  private readonly manualIds = new Map<SimpleCategory, Set<string>>();
  private discovered: ExportableUnits | undefined;
  private discovering: Promise<ExportableUnits> | undefined;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    readonly selection: ExportSelection,
  ) {}

  refresh(): void {
    this.discovered = undefined;
    this.discovering = undefined;
    this._onDidChangeTreeData.fire();
  }

  /** Re-renders checkbox state without re-discovering (after a selection change). */
  refreshSelection(): void {
    this._onDidChangeTreeData.fire();
  }

  /** Adds a manually-entered ID to a non-discoverable category and selects it. */
  addManualId(category: SimpleCategory, id: string): void {
    let set = this.manualIds.get(category);
    if (!set) {
      set = new Set();
      this.manualIds.set(category, set);
    }
    set.add(id);
    this.selection.toggleSimple(category, id, true);
    this._onDidChangeTreeData.fire();
  }

  /** All IDs currently shown for a simple category (discovered ∪ manually-added). */
  idsForCategory(category: SimpleCategory): string[] {
    const ids = new Set<string>(this.manualIds.get(category) ?? []);
    if (this.discovered) {
      const discovered =
        category === 'catalogs'
          ? this.discovered.catalogs
          : category === 'inventory_lists'
            ? this.discovered.inventoryLists
            : [];
      for (const id of discovered) {
        ids.add(id);
      }
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
  }

  getTreeItem(element: ExportTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ExportTreeItem): Promise<ExportTreeItem[]> {
    if (!this.configProvider.getInstance()) {
      return element ? [] : [this.placeholder('Configure an instance (dw.json) to export data')];
    }

    if (!element) {
      return this.getCategoryNodes();
    }

    switch (element.nodeType) {
      case 'category':
        return this.getCategoryChildren(element.category!);
      case 'site':
        return this.getSiteFlagNodes(element.value!);
      default:
        return [];
    }
  }

  private getCategoryNodes(): ExportTreeItem[] {
    const collapsed = vscode.TreeItemCollapsibleState.Collapsed;
    const nodes: ExportTreeItem[] = [
      new ExportTreeItem('category', 'sites', 'Sites', collapsed),
      new ExportTreeItem('category', 'global_data', 'Global Data', collapsed),
    ];
    for (const {key, label} of SIMPLE_CATEGORIES) {
      nodes.push(new ExportTreeItem('category', key, label, collapsed));
    }
    return nodes;
  }

  private async getCategoryChildren(category: CategoryKey): Promise<ExportTreeItem[]> {
    if (category === 'global_data') {
      return GLOBAL_FLAGS.map((flag) => this.flagNode('global-flag', 'global_data', flag));
    }

    const units = await this.ensureDiscovered();

    if (category === 'sites') {
      if (units.sites.length === 0) {
        return [this.placeholder(this.emptyMessage('sites', units))];
      }
      return units.sites.map((siteId) => {
        const item = new ExportTreeItem('site', 'sites', siteId, vscode.TreeItemCollapsibleState.Collapsed, siteId);
        item.iconPath = new vscode.ThemeIcon('globe');
        item.checkboxState = this.checkbox(this.selection.isSiteChecked(siteId));
        return item;
      });
    }

    // Simple ID categories.
    const ids = this.idsForCategory(category);
    if (ids.length === 0) {
      return [this.placeholder(this.emptyMessage(category, units))];
    }
    return ids.map((id) => {
      const item = new ExportTreeItem('unit', category, id, vscode.TreeItemCollapsibleState.None, id);
      item.iconPath = new vscode.ThemeIcon('symbol-field');
      item.checkboxState = this.checkbox(this.selection.isSimpleChecked(category, id));
      return item;
    });
  }

  private getSiteFlagNodes(siteId: string): ExportTreeItem[] {
    return SITE_FLAGS.map((flag) => {
      const item = new ExportTreeItem('site-flag', 'sites', flag, vscode.TreeItemCollapsibleState.None, flag, siteId);
      item.checkboxState = this.checkbox(this.selection.isSiteFlagChecked(siteId, flag));
      return item;
    });
  }

  private flagNode(nodeType: 'global-flag', category: 'global_data', flag: string): ExportTreeItem {
    const item = new ExportTreeItem(nodeType, category, flag, vscode.TreeItemCollapsibleState.None, flag);
    item.checkboxState = this.checkbox(this.selection.isGlobalFlagChecked(flag));
    return item;
  }

  private checkbox(checked: boolean): vscode.TreeItemCheckboxState {
    return checked ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
  }

  private placeholder(message: string): ExportTreeItem {
    const item = new ExportTreeItem('placeholder', undefined, message, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon('info');
    return item;
  }

  private emptyMessage(category: CategoryKey, units: ExportableUnits): string {
    const meta = SIMPLE_CATEGORIES.find((c) => c.key === category);
    if (meta && !meta.discoverable) {
      return `No ${meta.label.toLowerCase()} added — use "Add by ID" to include one`;
    }
    if (units.warnings.length > 0) {
      return units.warnings.find((w) => w.includes(String(category).replace('_', ' '))) ?? 'Nothing found';
    }
    return 'Nothing found on this instance';
  }

  private async ensureDiscovered(): Promise<ExportableUnits> {
    if (this.discovered) {
      return this.discovered;
    }
    if (!this.discovering) {
      const instance = this.configProvider.getInstance();
      if (!instance) {
        return {sites: [], catalogs: [], inventoryLists: [], warnings: []};
      }
      this.discovering = (async (): Promise<ExportableUnits> => {
        try {
          const units = await vscode.window.withProgress(
            {location: {viewId: 'b2cExportExplorer'}, title: 'Discovering exportable data...'},
            () => discoverExportableUnits(instance),
          );
          this.discovered = units;
          if (units.warnings.length > 0) {
            vscode.window.showWarningMessage(`B2C Export: ${units.warnings.join('; ')}`);
          }
          return units;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`B2C Export: failed to discover data — ${message}`);
          const empty: ExportableUnits = {sites: [], catalogs: [], inventoryLists: [], warnings: []};
          this.discovered = empty;
          return empty;
        }
      })();
    }
    return this.discovering;
  }
}
