/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {CipReportDefinition} from '@salesforce/b2c-tooling-sdk/operations/cip';
import * as vscode from 'vscode';
import type {CipRealm, CipRealmGroup, CipStatus} from './cip-connection-service.js';
import type {CipSavedQuery} from './cip-query-library-service.js';

/**
 * Extension-specific report entry type. Aliased to the SDK's `CipReportDefinition` for now;
 * convert back to an interface if/when extension-only fields are needed.
 */
export type CipReportEntry = CipReportDefinition;

/**
 * Top-level tree item representing a realm group (e.g. "bjmp").
 * Collapsible — children are tenant connections + "Add configuration" leaf.
 */
export class CipRealmTreeItem extends vscode.TreeItem {
  readonly nodeType = 'realm' as const;
  readonly realmId: string;

  constructor(group: CipRealmGroup) {
    super(group.label, vscode.TreeItemCollapsibleState.Collapsed);
    this.realmId = group.id;
    this.contextValue = 'cipRealm';
    this.tooltip = new vscode.MarkdownString(`**${group.label}**\n\nExpand to see connections`);
    this.iconPath = new vscode.ThemeIcon('server-environment');
  }
}

/**
 * Leaf node under a realm group that lets the user add a new connection.
 */
export class CipAddConfigTreeItem extends vscode.TreeItem {
  readonly nodeType = 'addConfig' as const;
  readonly realmId: string;

  constructor(groupId: string) {
    super('Add configuration…', vscode.TreeItemCollapsibleState.None);
    this.realmId = groupId;
    this.contextValue = 'cipAddConfig';
    this.iconPath = new vscode.ThemeIcon('add');
    this.tooltip = 'Add a new tenant connection (prod / staging / custom) to this realm';
    this.command = {
      command: 'b2c-dx.cipAnalytics.configureConnection',
      title: 'Add Configuration',
      arguments: [groupId, true],
    };
  }
}

/**
 * Collapsible tenant node shown under a realm.
 * Shows tenantId with connection status icon. Children are tools + reports.
 */
export class CipRealmInfoTreeItem extends vscode.TreeItem {
  readonly nodeType = 'realmInfo' as const;
  readonly realmId: string;

  constructor(realm: CipRealm, status: CipStatus) {
    super(realm.tenantId, vscode.TreeItemCollapsibleState.Expanded);
    this.realmId = realm.id;
    this.contextValue = 'cipRealmInfo';
    this.description = `${realm.env} · ${realm.host}`;
    this.tooltip = new vscode.MarkdownString(
      `**${realm.tenantId}**  \nEnv: ${realm.env}  \nHost: ${realm.host}\n\n_Click pencil icon to edit_`,
    );
    // Use VS Code's semantic success-green token for connected state so the dot
    // stays consistent with other success indicators across themes.
    if (status === 'connected') {
      this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('testing.iconPassed'));
    } else if (status === 'testing') {
      this.iconPath = new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.yellow'));
    } else {
      this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconFailed'));
    }
  }
}

/**
 * Featured tree item for Query Builder - scoped to a realm.
 */
export class CipQueryBuilderTreeItem extends vscode.TreeItem {
  readonly nodeType = 'queryBuilder' as const;

  constructor(readonly realmId: string) {
    super('Query Builder', vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'cipQueryBuilder';
    this.iconPath = new vscode.ThemeIcon('zap', new vscode.ThemeColor('charts.blue'));
    this.description = 'Build custom queries';
    this.tooltip = 'Open the visual CIP Query Builder - build SQL queries with a drag-and-drop interface';
    this.command = {
      command: 'b2c-dx.cipAnalytics.queryBuilder',
      title: 'Open Query Builder',
      arguments: [realmId],
    };
  }
}

/**
 * Featured tree item for Tables Browser - scoped to a realm.
 */
export class CipTablesBrowserTreeItem extends vscode.TreeItem {
  readonly nodeType = 'tablesBrowser' as const;

  constructor(readonly realmId: string) {
    super('Entity Browser', vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'cipTablesBrowser';
    this.iconPath = new vscode.ThemeIcon('table');
    this.description = 'Explore CIP schemas';
    this.tooltip = 'Browse all CIP data warehouse tables and their schemas';
    this.command = {
      command: 'b2c-dx.cipAnalytics.browseTables',
      title: 'Browse Tables',
      arguments: [realmId],
    };
  }
}

/**
 * Section header tree item for grouping featured tools vs reports - scoped to a realm.
 */
export class CipSectionTreeItem extends vscode.TreeItem {
  readonly nodeType = 'section' as const;

  constructor(
    readonly section: 'tools' | 'reports',
    label: string,
    readonly realmId: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded,
  ) {
    super(label, collapsibleState);
    this.contextValue = 'cipSection';
    this.iconPath = new vscode.ThemeIcon(section === 'tools' ? 'tools' : 'graph');
  }
}

/**
 * Maps each report category to a distinct codicon so the curated-reports tree is scannable
 * by category at a glance. Falls back to `folder` for any unmapped category.
 */
const CATEGORY_CODICON: Record<string, string> = {
  'Sales Analytics': 'graph-line',
  'Product Analytics': 'package',
  'Customer Analytics': 'account',
  'Search Analytics': 'search',
  'Promotion Analytics': 'tag',
  'Payment Analytics': 'credit-card',
  'Traffic Analytics': 'globe',
  'Technical Analytics': 'gear',
};

/**
 * Humanize a report slug (e.g., `customer-registration-trends` → `Customer Registration Trends`).
 */
function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
    readonly realmId: string,
  ) {
    super(category, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'cipCategory';
    this.iconPath = new vscode.ThemeIcon(CATEGORY_CODICON[category] ?? 'folder');
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

  constructor(
    readonly report: CipReportEntry,
    readonly realmId: string,
  ) {
    super(humanizeSlug(report.name), vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'cipReport';
    this.iconPath = new vscode.ThemeIcon('graph');
    this.description = report.description;
    this.tooltip = `${humanizeSlug(report.name)} — ${report.description}`;

    this.command = {
      command: 'b2c-dx.cipAnalytics.openReport',
      title: 'Open Report',
      arguments: [report, realmId],
    };
  }
}

/**
 * Collapsible "Saved Queries" header under a tenant. Children are saved-query
 * leaves scoped to that tenant. Carries both the realmId (so click-to-open
 * lands on the right Query Builder panel) and the tenantId (so the children
 * can be filtered with `listForTenant`).
 */
export class CipSavedQueriesSectionTreeItem extends vscode.TreeItem {
  readonly nodeType = 'savedQueriesSection' as const;

  constructor(
    readonly realmId: string,
    readonly tenantId: string,
    count: number,
  ) {
    super('Saved Queries', vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'cipSavedQueriesSection';
    this.iconPath = new vscode.ThemeIcon('bookmark');
    this.description = count > 0 ? String(count) : 'none yet';
    this.tooltip = 'Saved queries scoped to this tenant. Save from the Query Builder toolbar.';
  }
}

/**
 * Leaf for a single saved query. Click loads the SQL into the Query Builder.
 * Right-click context menu (declared in package.json) offers Rename / Delete.
 */
export class CipSavedQueryTreeItem extends vscode.TreeItem {
  readonly nodeType = 'savedQuery' as const;
  readonly queryId: string;

  constructor(
    query: CipSavedQuery,
    readonly realmId: string,
  ) {
    super(query.name, vscode.TreeItemCollapsibleState.None);
    this.queryId = query.id;
    this.contextValue = 'cipSavedQuery';
    this.iconPath = new vscode.ThemeIcon('bookmark');
    if (query.description) this.description = query.description;
    this.tooltip = new vscode.MarkdownString(
      [`**${query.name}**`, query.description ? `\n${query.description}\n` : '', '```sql', query.sql, '```'].join('\n'),
    );
    this.command = {
      command: 'b2c-dx.cipAnalytics.openSavedQuery',
      title: 'Open Saved Query',
      arguments: [{realmId: this.realmId, queryId: this.queryId}],
    };
  }
}

/**
 * Empty-state placeholder under "Saved Queries" when the tenant has none.
 * Keeps the section discoverable without forcing an empty array of children
 * (which VS Code would render as a hairline-thin collapsed parent).
 */
export class CipSavedQueriesEmptyTreeItem extends vscode.TreeItem {
  readonly nodeType = 'savedQueriesEmpty' as const;

  constructor(readonly realmId: string) {
    super('No saved queries yet', vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'cipSavedQueriesEmpty';
    this.iconPath = new vscode.ThemeIcon('info');
    this.description = 'Save from the Query Builder';
  }
}

export type CipTreeNode =
  | CipRealmTreeItem
  | CipRealmInfoTreeItem
  | CipAddConfigTreeItem
  | CipQueryBuilderTreeItem
  | CipTablesBrowserTreeItem
  | CipSectionTreeItem
  | CipCategoryTreeItem
  | CipReportTreeItem
  | CipSavedQueriesSectionTreeItem
  | CipSavedQueryTreeItem
  | CipSavedQueriesEmptyTreeItem;
