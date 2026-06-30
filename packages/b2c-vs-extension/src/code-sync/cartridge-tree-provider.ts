/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as fs from 'node:fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import type {CartridgeService} from '../cartridges/cartridge-service.js';

/**
 * The Cartridges tree was originally a flat list of cartridge mappings. Per the
 * post-W-22653699 review feedback, it now expands into the cartridge contents
 * developers actually act on — starting with hooks and job steps. Each cartridge
 * shows two "category" children: Hooks and Job Steps, populated from a hand-rolled
 * scan of the cartridge folder (we don't want to depend on the full server-side
 * deploy pipeline just to render the tree).
 *
 * Surfacing custom step *types* with jump-to-module-implementation (mapping
 * steptypes.json `module` → file) is tracked separately and is intentionally not
 * implemented here.
 */
export type CartridgeNode = CartridgeItem | CartridgeCategoryItem | CartridgeFileItem | CartridgeCategoryEmptyItem;

export class CartridgeItem extends vscode.TreeItem {
  readonly kind = 'cartridge' as const;

  constructor(public readonly cartridge: CartridgeMapping) {
    super(cartridge.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart:${cartridge.src}`;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      this.description = path.relative(workspaceRoot, cartridge.src);
    }

    this.iconPath = new vscode.ThemeIcon('package');
    this.contextValue = 'cartridge';
    this.tooltip = cartridge.src;
  }
}

/** Grouping node beneath a cartridge ("Hooks", "Job Steps", ...). */
export class CartridgeCategoryItem extends vscode.TreeItem {
  readonly kind = 'category' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    readonly category: 'hooks' | 'jobSteps',
  ) {
    const label = category === 'hooks' ? 'Hooks' : 'Job Steps';
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart-cat:${cartridge.src}:${category}`;
    this.iconPath = new vscode.ThemeIcon(category === 'hooks' ? 'plug' : 'list-ordered');
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
    readonly category: 'hooks' | 'jobSteps',
  ) {
    const label = category === 'hooks' ? 'No hooks registered' : 'No job step modules found';
    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = `cart-cat-empty:${cartridge.src}:${category}`;
    this.iconPath = new vscode.ThemeIcon('info');
    this.description =
      category === 'hooks' ? 'Add a hooks.json to register one' : 'Drop a script into cartridge/scripts/jobsteps/';
    this.contextValue = `cartridge-${category}-empty`;
  }
}

/** Leaf node: a file inside a category (e.g. a hook script, a job-step module). */
export class CartridgeFileItem extends vscode.TreeItem {
  readonly kind = 'file' as const;

  constructor(
    readonly filePath: string,
    readonly cartridgeRoot: string,
  ) {
    super(path.basename(filePath), vscode.TreeItemCollapsibleState.None);
    this.id = `cart-file:${filePath}`;
    this.description = path.relative(cartridgeRoot, filePath);
    this.resourceUri = vscode.Uri.file(filePath);
    this.iconPath = vscode.ThemeIcon.File;
    this.contextValue = 'cartridge-file';
    this.tooltip = filePath;
    this.command = {
      command: 'vscode.open',
      title: 'Open',
      arguments: [vscode.Uri.file(filePath)],
    };
  }
}

export type CartridgeTreeItem = CartridgeNode;

export class CartridgeTreeProvider implements vscode.TreeDataProvider<CartridgeNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<CartridgeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly cartridgesSub: vscode.Disposable;

  constructor(private readonly cartridgeService: CartridgeService) {
    this.cartridgesSub = cartridgeService.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this.cartridgeService.refresh();
  }

  getTreeItem(element: CartridgeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CartridgeNode): Promise<CartridgeNode[]> {
    if (!element) {
      return this.cartridgeService.getCartridges().map((c) => new CartridgeItem(c));
    }

    if (element instanceof CartridgeItem) {
      return [
        new CartridgeCategoryItem(element.cartridge, 'hooks'),
        new CartridgeCategoryItem(element.cartridge, 'jobSteps'),
      ];
    }

    if (element instanceof CartridgeCategoryItem) {
      return this.getCategoryChildren(element);
    }

    return [];
  }

  /**
   * Enumerates the files for a category. Hooks are detected by `hooks.json`
   * registrations under the cartridge; job steps come from
   * `cartridge/scripts/jobsteps/`. Both fall back to globbing if conventional
   * locations are missing.
   */
  private async getCategoryChildren(node: CartridgeCategoryItem): Promise<CartridgeNode[]> {
    const cartridgeRoot = node.cartridge.src;

    if (node.category === 'hooks') {
      const files = await collectHookFiles(cartridgeRoot);
      if (files.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'hooks')];
      return files.map((file) => new CartridgeFileItem(file, cartridgeRoot));
    }

    const files = await collectJobStepFiles(cartridgeRoot);
    if (files.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'jobSteps')];
    return files.map((file) => new CartridgeFileItem(file, cartridgeRoot));
  }

  dispose(): void {
    this.cartridgesSub.dispose();
    this._onDidChangeTreeData.dispose();
  }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Scans for hook implementations declared in any `hooks.json` under the
 * cartridge, then resolves each registered script. Returns unique absolute paths
 * sorted by relative location for stable rendering.
 */
async function collectHookFiles(cartridgeRoot: string): Promise<string[]> {
  const results = new Set<string>();
  const hooksJsonFiles = await findFiles(cartridgeRoot, (name) => name === 'hooks.json');

  for (const hooksJson of hooksJsonFiles) {
    try {
      const raw = await fs.readFile(hooksJson, 'utf-8');
      const parsed = JSON.parse(raw) as {hooks?: Array<{script?: string}>};
      const dir = path.dirname(hooksJson);
      for (const hook of parsed.hooks ?? []) {
        if (!hook.script) continue;
        const resolved = await resolveHookScript(cartridgeRoot, dir, hook.script);
        if (resolved) results.add(resolved);
      }
    } catch {
      // hooks.json that fails to parse just falls out of the tree; not surfaced
      // as an error because malformed dev-time files are common during edits.
    }
  }

  return [...results].sort();
}

/**
 * Hook `script` paths are typically cartridge-rooted (the BM convention is
 * `<asterisk>/cartridge/scripts/hooks/foo`, where `<asterisk>` stands for the
 * containing cartridge). Resolve them either as workspace cartridge paths or
 * directory-relative paths.
 */
async function resolveHookScript(
  cartridgeRoot: string,
  hooksJsonDir: string,
  script: string,
): Promise<string | undefined> {
  const cartridgeName = path.basename(cartridgeRoot);
  // Strip optional leading "*/" wildcard and "<cartridgeName>/" prefix.
  let rel = script.replace(/^\*\//, '');
  if (rel.startsWith(`${cartridgeName}/`)) rel = rel.slice(cartridgeName.length + 1);

  const candidates = [
    path.join(cartridgeRoot, rel),
    path.join(hooksJsonDir, rel),
    `${path.join(cartridgeRoot, rel)}.js`,
    `${path.join(hooksJsonDir, rel)}.js`,
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Scans for job step modules in the conventional `cartridge/scripts/jobsteps/`
 * directory. Falls back to globbing the whole cartridge if that directory
 * doesn't exist (some cartridges put steps under custom folders).
 */
async function collectJobStepFiles(cartridgeRoot: string): Promise<string[]> {
  const conventional = path.join(cartridgeRoot, 'cartridge', 'scripts', 'jobsteps');
  if (await pathExists(conventional)) {
    return findFiles(conventional, (name) => name.endsWith('.js') || name.endsWith('.ts'));
  }

  // Fallback: any file under cartridge/scripts whose path contains "jobstep".
  const scriptsDir = path.join(cartridgeRoot, 'cartridge', 'scripts');
  if (!(await pathExists(scriptsDir))) return [];
  const all = await findFiles(scriptsDir, (name) => name.endsWith('.js') || name.endsWith('.ts'));
  return all.filter((file) => file.toLowerCase().includes('jobstep'));
}

/**
 * Lightweight recursive file walker. We avoid `vscode.workspace.findFiles` here
 * because the cartridge root may be outside the workspace's file-glob index
 * (mapped from a different folder), and the SDK doesn't ship a generic walker.
 */
async function findFiles(root: string, accept: (name: string) => boolean): Promise<string[]> {
  const results: string[] = [];
  const stack: string[] = [root];

  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(dir, {withFileTypes: true});
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        stack.push(full);
      } else if (entry.isFile() && accept(entry.name)) {
        results.push(full);
      }
    }
  }

  return results.sort();
}
