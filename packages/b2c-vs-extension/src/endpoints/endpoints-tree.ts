/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {IndexedEndpoint, ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';

import * as vscode from 'vscode';

import type {ProjectIndexService} from '../cartridges/project-index-service.js';
import {
  absolutePath,
  chainRows,
  controllerGroups,
  customApiEndpointRow,
  customApiGroups,
  endpointRow,
  endpointWarnings,
  guardRow,
  hasWarning,
  historyRows,
  hookGroups,
  hookRegistrationRow,
  type CustomApiGroup,
  type HookGroup,
  type RowModel,
  type SourceLocation,
} from './model.js';

type GroupKind = 'controllers' | 'customApis' | 'hooks';

export type EndpointsNode =
  | {type: 'group'; kind: GroupKind}
  | {type: 'controller'; controller: string; cartridges: string[]; endpoints: IndexedEndpoint[]}
  | {type: 'endpoint'; endpoint: IndexedEndpoint}
  | {type: 'section'; endpoint: IndexedEndpoint; section: 'chain' | 'history'}
  | {type: 'hookGroup'; group: HookGroup}
  | {type: 'apiGroup'; group: CustomApiGroup}
  | {type: 'row'; row: RowModel; icon: string; implementation?: SourceLocation; id: string};

const GROUP_LABELS: Record<GroupKind, string> = {controllers: 'Controllers', customApis: 'Custom APIs', hooks: 'Hooks'};
const GROUP_ICONS: Record<GroupKind, string> = {controllers: 'symbol-class', customApis: 'globe', hooks: 'plug'};
const SECURITY_ICONS = /^(server\.middleware\.(https|get|post)|csrf\.validate|userLoggedIn\.)/;

/**
 * The Endpoints view: storefront controller endpoints (SFRA and SiteGenesis)
 * with the middleware that runs for each and the statements across cartridges
 * that produced it, Custom APIs, and hooks in cartridge path order.
 */
export class EndpointsTreeProvider implements vscode.TreeDataProvider<EndpointsNode>, vscode.Disposable {
  readonly onDidChangeTreeData: vscode.Event<EndpointsNode | undefined>;

  private readonly emitter = new vscode.EventEmitter<EndpointsNode | undefined>();
  private filterText = '';
  private issuesOnly = false;
  private readonly sub: vscode.Disposable;

  constructor(private readonly indexService: ProjectIndexService) {
    this.onDidChangeTreeData = this.emitter.event;
    this.sub = indexService.onDidChange(() => this.emitter.fire(undefined));
  }

  get filter(): string {
    return this.filterText;
  }

  get showingIssuesOnly(): boolean {
    return this.issuesOnly;
  }

  dispose(): void {
    this.sub.dispose();
    this.emitter.dispose();
  }

  setFilter(text: string): void {
    this.filterText = text.trim().toLowerCase();
    this.emitter.fire(undefined);
  }

  setIssuesOnly(value: boolean): void {
    this.issuesOnly = value;
    this.emitter.fire(undefined);
  }

  refresh(): void {
    this.indexService.invalidate();
  }

  getChildren(node?: EndpointsNode): EndpointsNode[] {
    const index = this.indexService.getIndex();
    if (index.cartridges.length === 0) return [];
    if (!node) {
      return (['controllers', 'customApis', 'hooks'] as GroupKind[]).map((kind) => ({type: 'group', kind}));
    }
    switch (node.type) {
      case 'group':
        return this.groupChildren(index, node.kind);
      case 'controller':
        return node.endpoints.filter((e) => this.keepEndpoint(e)).map((endpoint) => ({type: 'endpoint', endpoint}));
      case 'endpoint':
        if (node.endpoint.kind === 'sg-controller') {
          return [{type: 'row', row: guardRow(node.endpoint), icon: 'shield', id: `${node.endpoint.id}:guard`}];
        }
        return [
          {type: 'section', endpoint: node.endpoint, section: 'chain'},
          {type: 'section', endpoint: node.endpoint, section: 'history'},
        ];
      case 'section':
        if (node.section === 'chain') {
          return chainRows(node.endpoint).map((row, i) => ({
            type: 'row',
            row,
            icon: row.label.startsWith('Handler')
              ? 'symbol-function'
              : SECURITY_ICONS.test(node.endpoint.chain?.[i]?.id ?? '')
                ? 'shield'
                : 'symbol-event',
            ...(row.implementation ? {implementation: row.implementation} : {}),
            id: `${node.endpoint.id}:chain:${i}`,
          }));
        }
        return historyRows(node.endpoint).map((row, i) => ({
          type: 'row',
          row,
          icon: 'git-commit',
          id: `${node.endpoint.id}:history:${i}`,
        }));
      case 'hookGroup':
        return node.group.registrations.map((hook, i) => ({
          type: 'row',
          row: hookRegistrationRow(node.group, hook, i),
          icon: 'symbol-function',
          id: `hook:${node.group.name}:${i}`,
        }));
      case 'apiGroup':
        return node.group.endpoints
          .map((e) => customApiEndpointRow(e))
          .filter((row) => !this.issuesOnly || hasWarning(row))
          .map((row, i) => ({type: 'row', row, icon: 'symbol-method', id: `api:${node.group.api}:${i}`}));
      default:
        return [];
    }
  }

  getTreeItem(node: EndpointsNode): vscode.TreeItem {
    const index = this.indexService.getIndex();
    switch (node.type) {
      case 'group': {
        const item = new vscode.TreeItem(GROUP_LABELS[node.kind], vscode.TreeItemCollapsibleState.Expanded);
        item.id = `group:${node.kind}`;
        item.iconPath = new vscode.ThemeIcon(GROUP_ICONS[node.kind]);
        item.description = String(this.groupChildren(index, node.kind).length);
        item.contextValue = `endpoints-group-${node.kind}`;
        return item;
      }
      case 'controller': {
        const item = new vscode.TreeItem(node.controller, vscode.TreeItemCollapsibleState.Collapsed);
        item.id = `controller:${node.controller}`;
        item.iconPath = new vscode.ThemeIcon('symbol-class');
        item.description = node.cartridges.join(' · ');
        item.contextValue = 'endpoints-controller';
        return item;
      }
      case 'endpoint': {
        const row = endpointRow(node.endpoint);
        return this.rowItem(
          index,
          row,
          `endpoint:${node.endpoint.id}`,
          'symbol-method',
          vscode.TreeItemCollapsibleState.Collapsed,
          'endpoints-endpoint',
        );
      }
      case 'section': {
        const item = new vscode.TreeItem(
          node.section === 'chain' ? 'Runs (in order)' : 'Defined by',
          vscode.TreeItemCollapsibleState.Expanded,
        );
        item.id = `${node.endpoint.id}:${node.section}`;
        item.iconPath = new vscode.ThemeIcon(node.section === 'chain' ? 'list-ordered' : 'history');
        if (node.section === 'history') item.description = `${node.endpoint.steps?.length ?? 0} statement(s)`;
        return item;
      }
      case 'hookGroup':
        return this.rowItem(
          index,
          node.group.row,
          `hookGroup:${node.group.name}`,
          'plug',
          vscode.TreeItemCollapsibleState.Collapsed,
          'endpoints-hook',
        );
      case 'apiGroup':
        return this.rowItem(
          index,
          node.group.row,
          `apiGroup:${node.group.api}`,
          'globe',
          vscode.TreeItemCollapsibleState.Collapsed,
          'endpoints-api',
        );
      case 'row':
        return this.rowItem(
          index,
          node.row,
          node.id,
          node.icon,
          vscode.TreeItemCollapsibleState.None,
          node.implementation ? 'endpoints-row-implementation' : 'endpoints-row',
        );
    }
  }

  /** Absolute file path for a location in the current index. */
  resolve(location: SourceLocation): string | undefined {
    return absolutePath(this.indexService.getIndex(), location);
  }

  private groupChildren(index: ProjectIndex, kind: GroupKind): EndpointsNode[] {
    if (kind === 'controllers') {
      return controllerGroups(index)
        .map((g) => ({...g, endpoints: g.endpoints.filter((e) => this.keepEndpoint(e))}))
        .filter((g) => g.endpoints.length > 0)
        .map((g) => ({type: 'controller', ...g}));
    }
    if (kind === 'hooks') {
      return hookGroups(index)
        .filter(
          (g) =>
            this.matches(g.name) &&
            (!this.issuesOnly || hasWarning(g.row, ...g.registrations.map((h, i) => hookRegistrationRow(g, h, i)))),
        )
        .map((group) => ({type: 'hookGroup', group}));
    }
    return customApiGroups(index)
      .filter(
        (g) =>
          (this.matches(g.api) || g.endpoints.some((e) => this.matches(e.endpoint))) &&
          (!this.issuesOnly || hasWarning(g.row, ...g.endpoints.map(customApiEndpointRow))),
      )
      .map((group) => ({type: 'apiGroup', group}));
  }

  private keepEndpoint(e: IndexedEndpoint): boolean {
    return this.matches(e.id) && (!this.issuesOnly || endpointWarnings(e).length > 0);
  }

  private matches(text: string): boolean {
    return !this.filterText || text.toLowerCase().includes(this.filterText);
  }

  private rowItem(
    index: ProjectIndex,
    row: RowModel,
    id: string,
    icon: string,
    state: vscode.TreeItemCollapsibleState,
    contextValue: string,
  ): vscode.TreeItem {
    const item = new vscode.TreeItem(row.label, state);
    item.id = id;
    item.description = row.description;
    item.tooltip = row.tooltip;
    item.contextValue = contextValue;
    item.iconPath = row.warning
      ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'))
      : new vscode.ThemeIcon(icon);
    const file = row.location ? absolutePath(index, row.location) : undefined;
    if (file && row.location) item.command = openCommand(file, row.location.line);
    return item;
  }
}

/** A command that opens a file at a 1-based line. */
export function openCommand(file: string, line?: number): vscode.Command {
  const position = new vscode.Position(Math.max(0, (line ?? 1) - 1), 0);
  return {
    command: 'vscode.open',
    title: 'Open',
    arguments: [vscode.Uri.file(file), {selection: new vscode.Range(position, position)}],
  };
}
