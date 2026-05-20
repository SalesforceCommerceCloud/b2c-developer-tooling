/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {listCipReports} from '@salesforce/b2c-tooling-sdk/operations/cip';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import type {CipConnectionService} from './cip-connection-service.js';
import {
  CipAddConfigTreeItem,
  CipCategoryTreeItem,
  CipQueryBuilderTreeItem,
  CipRealmInfoTreeItem,
  CipRealmTreeItem,
  CipReportTreeItem,
  CipSectionTreeItem,
  CipTablesBrowserTreeItem,
  type CipTreeNode,
} from './types.js';

/**
 * Tree data provider for CIP Analytics.
 *
 * Root level shows one node per saved realm. Each realm expands to reveal
 * Query Builder, Entity Browser and Curated Reports as children — matching
 * the existing UI but scoped per realm.
 */
export class CipAnalyticsTreeDataProvider implements vscode.TreeDataProvider<CipTreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CipTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly connection: CipConnectionService,
    private readonly log: vscode.OutputChannel,
  ) {
    // Re-render realm status icons whenever connection state changes.
    this.connection.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this.log.appendLine('[CIP Analytics] Tree refresh requested');
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CipTreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CipTreeNode): Promise<CipTreeNode[]> {
    if (!element) {
      return this.getRootChildren();
    }
    if (element instanceof CipRealmTreeItem) {
      return this.getRealmChildren(element);
    }
    if (element instanceof CipRealmInfoTreeItem) {
      return this.getTenantChildren(element.realmId);
    }
    if (element instanceof CipSectionTreeItem) {
      return this.getSectionChildren(element);
    }
    if (element instanceof CipCategoryTreeItem) {
      return this.getCategoryChildren(element);
    }
    return [];
  }

  /** Root: one node per realm group. */
  private getRootChildren(): CipTreeNode[] {
    const config = this.configProvider.getConfig();
    if (!config?.hasOAuthConfig()) {
      this.log.appendLine('[CIP Analytics] No OAuth config — tree will be empty');
      return [];
    }
    return this.connection.getRealmGroups().map((g) => new CipRealmTreeItem(g));
  }

  /** Realm group children: one collapsible tenant node per connection + "Add configuration" leaf. */
  private getRealmChildren(element: CipRealmTreeItem): CipTreeNode[] {
    const {realmId: groupId} = element;
    const connections = this.connection.getConnectionsForGroup(groupId);
    const children: CipTreeNode[] = connections.map(
      (r) => new CipRealmInfoTreeItem(r, this.connection.getRealmStatus(r.id)),
    );
    children.push(new CipAddConfigTreeItem(groupId));
    return children;
  }

  /** Tenant node children: Query Builder + Entity Browser + Curated Reports. */
  private getTenantChildren(realmId: string): CipTreeNode[] {
    return [
      new CipQueryBuilderTreeItem(realmId),
      new CipTablesBrowserTreeItem(realmId),
      new CipSectionTreeItem('reports', 'Curated Reports', realmId),
    ];
  }

  /** Curated Reports section children: categories. */
  private getSectionChildren(element: CipSectionTreeItem): CipTreeNode[] {
    if (element.section !== 'reports') return [];

    const reports = listCipReports();
    const categoryCounts = new Map<string, number>();
    for (const report of reports) {
      categoryCounts.set(report.category, (categoryCounts.get(report.category) ?? 0) + 1);
    }

    return Array.from(categoryCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, count]) => new CipCategoryTreeItem(category, count, element.realmId));
  }

  /** Category children: individual reports. */
  private getCategoryChildren(element: CipCategoryTreeItem): CipReportTreeItem[] {
    const reports = listCipReports();
    return reports
      .filter((r) => r.category === element.category)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) => new CipReportTreeItem(r, element.realmId));
  }
}
