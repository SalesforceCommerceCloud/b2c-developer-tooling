/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {listCipReports} from '@salesforce/b2c-tooling-sdk/operations/cip';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {
  CipCategoryTreeItem,
  CipQueryBuilderTreeItem,
  CipReportTreeItem,
  CipSectionTreeItem,
  CipTablesBrowserTreeItem,
  type CipTreeNode,
} from './types.js';

/**
 * Tree data provider for CIP Analytics reports.
 * Displays reports grouped by category (e.g., Sales Analytics, Product Analytics).
 * Follows the pattern from api-browser-tree-provider.ts and sandbox-tree-provider.ts.
 */
export class CipAnalyticsTreeDataProvider implements vscode.TreeDataProvider<CipTreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CipTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly log: vscode.OutputChannel,
  ) {}

  /**
   * Refresh the tree view.
   * Called when user clicks refresh button or config changes.
   */
  refresh(): void {
    this.log.appendLine('[CIP Analytics] Tree refresh requested');
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CipTreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CipTreeNode): Promise<CipTreeNode[]> {
    if (!element) {
      // Root level - show featured tools + sections
      return this.getRootChildren();
    }
    if (element instanceof CipSectionTreeItem) {
      return this.getSectionChildren(element);
    }
    if (element instanceof CipCategoryTreeItem) {
      // Category level - show reports in this category
      return this.getCategoryChildren(element);
    }
    return [];
  }

  /**
   * Get root-level children: featured Query Builder + Tables Browser at top,
   * then categorized reports section.
   */
  private getRootChildren(): CipTreeNode[] {
    const config = this.configProvider.getConfig();
    this.log.appendLine(`[CIP Analytics] Config resolved: ${config ? 'YES' : 'NO'}`);
    if (config) {
      this.log.appendLine(
        `[CIP Analytics] Config values: clientId=${config.values.clientId ? 'SET' : 'NOT SET'}, hostname=${config.values.hostname}`,
      );
      this.log.appendLine(`[CIP Analytics] hasOAuthConfig() = ${config.hasOAuthConfig()}`);
    }
    if (!config?.hasOAuthConfig()) {
      this.log.appendLine('[CIP Analytics] No OAuth config - tree will be empty');
      return [];
    }

    const reports = listCipReports();
    this.log.appendLine(`[CIP Analytics] Loaded ${reports.length} reports`);

    // Featured tools at top (primary entry point)
    return [
      new CipQueryBuilderTreeItem(),
      new CipTablesBrowserTreeItem(),
      new CipSectionTreeItem('reports', 'Curated Reports'),
    ];
  }

  /**
   * Get children for a section (e.g., Curated Reports section shows categories).
   */
  private getSectionChildren(element: CipSectionTreeItem): CipTreeNode[] {
    if (element.section !== 'reports') {
      return [];
    }

    const reports = listCipReports();
    const categoryCounts = new Map<string, number>();
    for (const report of reports) {
      categoryCounts.set(report.category, (categoryCounts.get(report.category) ?? 0) + 1);
    }

    return Array.from(categoryCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, count]) => new CipCategoryTreeItem(category, count));
  }

  /**
   * Get children for a category (the reports in that category).
   */
  private getCategoryChildren(element: CipCategoryTreeItem): CipReportTreeItem[] {
    const reports = listCipReports();
    return reports
      .filter((r) => r.category === element.category)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) => new CipReportTreeItem(r));
  }
}
