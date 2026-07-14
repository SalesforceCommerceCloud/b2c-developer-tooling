/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerExportCommands} from './export-commands.js';
import {ExportSelection, type SimpleCategory} from './export-selection.js';
import {ExportTreeDataProvider, type ExportTreeItem} from './export-tree-provider.js';

export function registerExportTree(context: vscode.ExtensionContext, configProvider: B2CExtensionConfig): void {
  const selection = new ExportSelection();
  const treeProvider = new ExportTreeDataProvider(configProvider, selection);

  const treeView = vscode.window.createTreeView('b2cExportExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
    manageCheckboxStateManually: true,
  });

  // Translate checkbox toggles into selection-model updates. Flagged parents
  // (sites) are authoritative: checking a site selects all its data even if its
  // flag children were never expanded, so we re-render to reflect the cascade.
  const checkboxListener = treeView.onDidChangeCheckboxState((event) => {
    let cascaded = false;
    for (const [item, state] of event.items) {
      cascaded = applyCheckbox(treeProvider, item, state === vscode.TreeItemCheckboxState.Checked) || cascaded;
    }
    // A site toggle changes its (possibly expanded) flag children's state too.
    if (cascaded) {
      treeProvider.refreshSelection();
    }
  });

  configProvider.onDidReset(() => treeProvider.refresh());

  const commandDisposables = registerExportCommands(configProvider, treeProvider);

  context.subscriptions.push(treeView, checkboxListener, ...commandDisposables);
}

/**
 * Records a single checkbox change in the selection model. Returns true when
 * the change cascades to child nodes (a site → its flags), so the caller knows
 * to re-render.
 */
function applyCheckbox(treeProvider: ExportTreeDataProvider, item: ExportTreeItem, checked: boolean): boolean {
  const {selection} = treeProvider;
  switch (item.nodeType) {
    case 'site':
      selection.toggleSite(item.value!, checked);
      return true;
    case 'site-flag':
      selection.toggleSiteFlag(item.siteId!, item.value!, checked);
      return false;
    case 'global-flag':
      selection.toggleGlobalFlag(item.value!, checked);
      return false;
    case 'unit':
      selection.toggleSimple(item.category as SimpleCategory, item.value!, checked);
      return false;
    default:
      return false;
  }
}
