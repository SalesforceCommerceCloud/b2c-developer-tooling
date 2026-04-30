/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {CipReportDefinition} from '@salesforce/b2c-tooling-sdk/operations/cip';
import * as vscode from 'vscode';

/**
 * Extension-specific report entry type.
 * Extends SDK's CipReportDefinition with any extension-specific metadata.
 */
export interface CipReportEntry extends CipReportDefinition {
  // Extension-specific fields can be added here if needed
}

/**
 * Featured tree item for Query Builder - the highlighted primary entry point.
 */
export class CipQueryBuilderTreeItem extends vscode.TreeItem {
  readonly nodeType = 'queryBuilder' as const;

  constructor() {
    super('Query Builder', vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'cipQueryBuilder';
    this.iconPath = new vscode.ThemeIcon('zap', new vscode.ThemeColor('charts.blue'));
    this.description = 'Build custom queries';
    this.tooltip = 'Open the visual CIP Query Builder - build SQL queries with a drag-and-drop interface';
    this.command = {
      command: 'b2c-dx.cipAnalytics.queryBuilder',
      title: 'Open Query Builder',
    };
  }
}

/**
 * Featured tree item for Tables Browser.
 */
export class CipTablesBrowserTreeItem extends vscode.TreeItem {
  readonly nodeType = 'tablesBrowser' as const;

  constructor() {
    super('Tables Browser', vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'cipTablesBrowser';
    this.iconPath = new vscode.ThemeIcon('table');
    this.description = 'Explore CIP schemas';
    this.tooltip = 'Browse all CIP data warehouse tables and their schemas';
    this.command = {
      command: 'b2c-dx.cipAnalytics.browseTables',
      title: 'Browse Tables',
    };
  }
}

/**
 * Section header tree item for grouping featured tools vs reports.
 */
export class CipSectionTreeItem extends vscode.TreeItem {
  readonly nodeType = 'section' as const;

  constructor(
    readonly section: 'tools' | 'reports',
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded,
  ) {
    super(label, collapsibleState);
    this.contextValue = 'cipSection';
    this.iconPath = new vscode.ThemeIcon(section === 'tools' ? 'tools' : 'graph');
  }
}

/**
 * Tree item representing a report category (e.g., "Sales Analytics").
 * Collapsible parent node that groups related reports.
 */
export class CipCategoryTreeItem extends vscode.TreeItem {
  readonly nodeType = 'category' as const;

  constructor(
    readonly category: string,
    readonly reportCount: number,
  ) {
    super(category, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'cipCategory';
    this.iconPath = new vscode.ThemeIcon('folder');
    this.description = `${reportCount} report${reportCount !== 1 ? 's' : ''}`;
    this.tooltip = `${category} (${reportCount} reports)`;
  }
}

/**
 * Tree item representing an individual CIP report.
 * Leaf node that opens the report dashboard when clicked.
 */
export class CipReportTreeItem extends vscode.TreeItem {
  readonly nodeType = 'report' as const;

  constructor(readonly report: CipReportEntry) {
    super(report.name, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'cipReport';
    this.iconPath = new vscode.ThemeIcon('graph');
    this.description = this.getCategoryEmoji(report.category);
    this.tooltip = report.description;

    // Command executed when user double-clicks the report
    this.command = {
      command: 'b2c-dx.cipAnalytics.openReport',
      title: 'Open Report',
      arguments: [report],
    };
  }

  private getCategoryEmoji(category: string): string {
    const icons: Record<string, string> = {
      'Sales Analytics': '💰',
      'Product Analytics': '🛒',
      'Customer Analytics': '👥',
      'Search Analytics': '🔍',
      'Promotion Analytics': '🎁',
      'Payment Analytics': '💳',
      'Traffic Analytics': '🚦',
      'Technical Analytics': '⚙️',
    };
    return icons[category] ?? '📊';
  }
}

export type CipTreeNode =
  | CipQueryBuilderTreeItem
  | CipTablesBrowserTreeItem
  | CipSectionTreeItem
  | CipCategoryTreeItem
  | CipReportTreeItem;
