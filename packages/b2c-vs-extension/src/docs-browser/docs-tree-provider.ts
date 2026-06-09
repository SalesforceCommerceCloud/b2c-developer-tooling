/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import type {DocsIndexLoader} from './docs-index.js';
import type {DocSource, SearchEntry} from './types.js';

type DocsTreeNode = SourceNode | PackageNode | EntryNode | InfoNode;

class SourceNode extends vscode.TreeItem {
  readonly nodeType = 'source' as const;
  constructor(
    readonly source: DocSource,
    label: string,
    description: string | undefined,
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = description;
    this.contextValue = `docsSource:${source}`;
    this.iconPath = new vscode.ThemeIcon(iconForSource(source));
  }
}

class PackageNode extends vscode.TreeItem {
  readonly nodeType = 'package' as const;
  constructor(
    readonly source: DocSource,
    readonly packagePath: string,
    label: string,
    description: string | undefined,
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = description;
    this.contextValue = 'docsPackage';
    this.iconPath = new vscode.ThemeIcon('symbol-namespace');
  }
}

class EntryNode extends vscode.TreeItem {
  readonly nodeType = 'entry' as const;
  constructor(readonly entry: SearchEntry) {
    super(entry.title, vscode.TreeItemCollapsibleState.None);
    this.description = entry.qualifiedName;
    this.tooltip = entry.qualifiedName;
    this.contextValue = `docsEntry:${entry.kind}`;
    this.iconPath = new vscode.ThemeIcon(iconForKind(entry.kind));
    this.command = {
      command: 'b2c-dx.docs.open',
      title: 'Open Docs Entry',
      arguments: [entry.id],
    };
  }
}

class InfoNode extends vscode.TreeItem {
  readonly nodeType = 'info' as const;
  constructor(label: string, tooltip?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    if (tooltip) this.tooltip = tooltip;
    this.contextValue = 'docsInfo';
    this.iconPath = new vscode.ThemeIcon('info');
  }
}

export class DocsTreeProvider implements vscode.TreeDataProvider<DocsTreeNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<DocsTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly loader: DocsIndexLoader) {
    loader.onDidReload(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DocsTreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DocsTreeNode): DocsTreeNode[] {
    if (!element) return this.getRootChildren();
    if (element.nodeType === 'source') return this.getSourceChildren(element.source);
    if (element.nodeType === 'package') return this.getPackageChildren(element.source, element.packagePath);
    return [];
  }

  private getRootChildren(): DocsTreeNode[] {
    const manifest = this.loader.getManifest();
    if (!manifest) {
      const message = this.loader.getManifestError() ?? 'Docs index unavailable.';
      return [new InfoNode(message)];
    }
    const nodes: DocsTreeNode[] = [];

    nodes.push(
      new SourceNode(
        'script-api',
        'Script API',
        formatSourceDescription(
          manifest.scriptApiVersion ? `v${manifest.scriptApiVersion}` : undefined,
          manifest.counts.scriptApi,
        ),
      ),
    );

    // ISML and Business Manager are intentionally omitted in the current
    // release. Tracked as separate follow-up work that requires authoritative
    // upstream sources (the ISML grammar / Salesforce-owned BM content) before
    // any data is shipped.
    if (manifest.counts.isml > 0) {
      nodes.push(
        new SourceNode(
          'isml',
          'ISML Tags',
          formatSourceDescription(manifest.ismlVersion || undefined, manifest.counts.isml),
        ),
      );
    }

    if (manifest.counts.bm > 0) {
      nodes.push(
        new SourceNode(
          'bm',
          'Business Manager',
          formatSourceDescription(manifest.bmVersion || undefined, manifest.counts.bm),
        ),
      );
    }

    return nodes;
  }

  private getSourceChildren(source: DocSource): DocsTreeNode[] {
    const entries = this.loader.getSearchEntries().filter((entry) => entry.id.startsWith(`${source}:`));
    if (entries.length === 0) return [new InfoNode('No entries indexed.')];

    if (source === 'script-api') {
      const packages = entries.filter((entry) => entry.kind === 'package');
      packages.sort(byQualifiedName);
      return packages.map(
        (pkg) =>
          new PackageNode(
            source,
            pkg.packagePath ?? pkg.qualifiedName.replace(/\./g, '/'),
            pkg.qualifiedName,
            describePackage(entries, pkg),
          ),
      );
    }

    if (source === 'bm') {
      // BM is grouped by synthesized category nodes whose ids are `bm:category:<name>`.
      const categories = entries.filter((entry) => entry.id.startsWith('bm:category:'));
      categories.sort(byTitle);
      if (categories.length === 0) {
        // Fall through to flat layout if categories aren't present (legacy index).
        return entries
          .filter((entry) => entry.kind === 'topic' && !entry.id.startsWith('bm:category:'))
          .sort(byTitle)
          .map((entry) => new EntryNode(entry));
      }
      return categories.map(
        (cat) =>
          new PackageNode(
            source,
            cat.packagePath ?? cat.qualifiedName.replace(/\./g, '/'),
            cat.title,
            cat.tags?.[0] ? undefined : undefined,
          ),
      );
    }

    // ISML: flat list of tags.
    const direct = entries
      .filter((entry) => entry.kind !== 'package' && !entry.id.startsWith(`${source}:category:`))
      .sort(byTitle);
    return direct.map((entry) => new EntryNode(entry));
  }

  private getPackageChildren(source: DocSource, packagePath: string): DocsTreeNode[] {
    const entries = this.loader.getSearchEntries();
    if (source === 'bm') {
      // BM categories use synthetic ids; convert packagePath back to the id form.
      const categoryId = `bm:category:${packagePath.replace(/^bm\//, '')}`;
      const direct = entries.filter((entry) => entry.parentId === categoryId).sort(byTitle);
      if (direct.length === 0) return [new InfoNode('No topics.')];
      return direct.map((entry) => new EntryNode(entry));
    }

    const packageId = `${source}:${packagePath}`;
    const direct = entries
      .filter((entry) => entry.parentId === packageId)
      .filter((entry) => entry.kind === 'class' || entry.kind === 'interface' || entry.kind === 'enum')
      .sort(byTitle);
    if (direct.length === 0) return [new InfoNode('No declarations.')];
    return direct.map((entry) => new EntryNode(entry));
  }
}

function formatSourceDescription(version: string | undefined, count: number): string {
  const versionLabel = version ? version : '';
  const countLabel = count > 0 ? `${count} ${count === 1 ? 'entry' : 'entries'}` : '';
  return [versionLabel, countLabel].filter(Boolean).join(' · ');
}

function describePackage(entries: readonly SearchEntry[], pkg: SearchEntry): string {
  const packageId = pkg.id;
  let count = 0;
  for (const entry of entries) {
    if (entry.parentId !== packageId) continue;
    if (entry.kind === 'class' || entry.kind === 'interface' || entry.kind === 'enum') count++;
  }
  return `${count} ${count === 1 ? 'declaration' : 'declarations'}`;
}

function byTitle(a: SearchEntry, b: SearchEntry): number {
  if (a.title === b.title) return 0;
  return a.title < b.title ? -1 : 1;
}

function byQualifiedName(a: SearchEntry, b: SearchEntry): number {
  if (a.qualifiedName === b.qualifiedName) return 0;
  return a.qualifiedName < b.qualifiedName ? -1 : 1;
}

function iconForSource(source: DocSource): string {
  if (source === 'script-api') return 'symbol-class';
  if (source === 'isml') return 'symbol-misc';
  return 'book';
}

function iconForKind(kind: SearchEntry['kind']): string {
  switch (kind) {
    case 'package':
      return 'symbol-namespace';
    case 'class':
      return 'symbol-class';
    case 'interface':
      return 'symbol-interface';
    case 'enum':
      return 'symbol-enum';
    case 'method':
      return 'symbol-method';
    case 'property':
      return 'symbol-property';
    case 'constant':
      return 'symbol-constant';
    case 'tag':
      return 'symbol-snippet';
    case 'attribute':
      return 'symbol-key';
    case 'topic':
      return 'book';
    default:
      return 'symbol-misc';
  }
}
