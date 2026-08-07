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
 * developers actually act on — hooks, job steps, and custom step types. Each
 * cartridge shows three "category" children, populated from a hand-rolled scan
 * of the cartridge folder (we don't want to depend on the full server-side
 * deploy pipeline just to render the tree).
 */
export type CartridgeCategory = 'hooks' | 'jobSteps' | 'stepTypes';

export type CartridgeNode =
  | CartridgeItem
  | CartridgeCategoryItem
  | CartridgeFileItem
  | CartridgeStepTypeItem
  | CartridgeCategoryEmptyItem;

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

const CATEGORY_LABELS: Record<CartridgeCategory, string> = {
  hooks: 'Hooks',
  jobSteps: 'Job Steps',
  stepTypes: 'Custom Step Types',
};

const CATEGORY_ICONS: Record<CartridgeCategory, string> = {
  hooks: 'plug',
  jobSteps: 'list-ordered',
  stepTypes: 'symbol-method',
};

const CATEGORY_EMPTY_HINTS: Record<CartridgeCategory, {label: string; description: string}> = {
  hooks: {label: 'No hooks registered', description: 'Add a hooks.json to register one'},
  jobSteps: {label: 'No job step modules found', description: 'Drop a script into cartridge/scripts/jobsteps/'},
  stepTypes: {label: 'No custom step types registered', description: 'Add a steptypes.json in the cartridge root'},
};

/** Grouping node beneath a cartridge ("Hooks", "Job Steps", "Custom Step Types"). */
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

/**
 * Parsed shape of one custom step type entry (`script-module-step` or
 * `chunk-script-module-step`) registered in a cartridge's `steptypes.json`.
 */
export interface StepTypeEntry {
  /** `@type-id` value, e.g. "custom.MyImportStep". */
  readonly typeId: string;
  /** Which category the entry was declared under — displayed as a badge. */
  readonly kind: 'task' | 'chunk';
  /**
   * The `module` field verbatim, e.g. "app_custom_core/cartridge/scripts/jobsteps/myStep".
   * May or may not include a `.js` suffix. May reference a different cartridge.
   */
  readonly moduleRef: string;
  /** Absolute path to the `steptypes.json` that declared this entry. */
  readonly stepTypesPath: string;
}

/**
 * Leaf node for a single custom step type. Default click opens the resolved
 * module implementation (the `.js` file). Right-click offers "Show Step Type
 * Definition" which jumps to the `@type-id` line inside `steptypes.json`.
 */
export class CartridgeStepTypeItem extends vscode.TreeItem {
  readonly kind = 'stepType' as const;

  constructor(
    readonly entry: StepTypeEntry,
    readonly cartridgeRoot: string,
    /** Resolved absolute path to the module `.js` — undefined if unresolvable. */
    readonly moduleFile: string | undefined,
  ) {
    super(entry.typeId, vscode.TreeItemCollapsibleState.None);
    this.id = `cart-step-type:${entry.stepTypesPath}:${entry.typeId}`;
    this.description = entry.kind === 'chunk' ? 'chunk' : 'task';
    this.iconPath = new vscode.ThemeIcon('symbol-method');
    this.tooltip = moduleFile
      ? `${entry.typeId}\n${entry.moduleRef}\n→ ${moduleFile}`
      : `${entry.typeId}\n${entry.moduleRef}\n(module could not be resolved on disk)`;
    this.contextValue = moduleFile ? 'cartridge-step-type' : 'cartridge-step-type-unresolved';

    // Default click → jump to the module implementation. This is what a
    // developer usually wants (edit the code). Jumping to the JSON entry is
    // offered as a right-click action ("Show Step Type Definition").
    if (moduleFile) {
      this.command = {
        command: 'vscode.open',
        title: 'Open Module Implementation',
        arguments: [vscode.Uri.file(moduleFile)],
      };
    } else {
      // Fall back to opening the steptypes.json entry so the click still does
      // something useful when we can't find the module file.
      this.command = {
        command: 'b2c-dx.cartridge.openStepTypeDefinition',
        title: 'Show Step Type Definition',
        arguments: [entry.typeId, entry.stepTypesPath],
      };
    }
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
        new CartridgeCategoryItem(element.cartridge, 'stepTypes'),
      ];
    }

    if (element instanceof CartridgeCategoryItem) {
      return this.getCategoryChildren(element);
    }

    return [];
  }

  /**
   * Enumerates the children for a category. Hooks come from `hooks.json`
   * registrations; job-step files from `cartridge/scripts/jobsteps/`; custom
   * step types from any `steptypes.json` in the cartridge root or under it.
   */
  private async getCategoryChildren(node: CartridgeCategoryItem): Promise<CartridgeNode[]> {
    const cartridgeRoot = node.cartridge.src;

    if (node.category === 'hooks') {
      const files = await collectHookFiles(cartridgeRoot);
      if (files.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'hooks')];
      return files.map((file) => new CartridgeFileItem(file, cartridgeRoot));
    }

    if (node.category === 'jobSteps') {
      const files = await collectJobStepFiles(cartridgeRoot);
      if (files.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'jobSteps')];
      return files.map((file) => new CartridgeFileItem(file, cartridgeRoot));
    }

    const entries = await collectStepTypeEntries(cartridgeRoot);
    if (entries.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'stepTypes')];

    const otherRoots = this.cartridgeService
      .getCartridges()
      .map((c) => c.src)
      .filter((src) => src !== cartridgeRoot);
    return Promise.all(
      entries.map(async (entry) => {
        const moduleFile = await resolveStepTypeModule(entry.moduleRef, cartridgeRoot, otherRoots);
        return new CartridgeStepTypeItem(entry, cartridgeRoot, moduleFile);
      }),
    );
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
 * Reads every `steptypes.json` under the cartridge and flattens the registered
 * step type entries. B2C requires `step-types` to be an object keyed by
 * category (`script-module-step` for task steps, `chunk-script-module-step` for
 * chunk steps), but tooling has historically also written a flat array — we
 * tolerate both. Malformed files are skipped silently since they are common
 * during edits.
 */
export async function collectStepTypeEntries(cartridgeRoot: string): Promise<StepTypeEntry[]> {
  const results: StepTypeEntry[] = [];
  const stepTypesFiles = await findFiles(cartridgeRoot, (name) => name === 'steptypes.json');

  for (const stepTypesPath of stepTypesFiles) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(await fs.readFile(stepTypesPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      continue;
    }
    const stepTypes = parsed['step-types'];
    for (const {entries, kind} of expandStepTypeCategories(stepTypes)) {
      for (const entry of entries) {
        const typeId = typeof entry['@type-id'] === 'string' ? (entry['@type-id'] as string) : undefined;
        const moduleRef = typeof entry.module === 'string' ? (entry.module as string) : undefined;
        if (!typeId || !moduleRef) continue;
        results.push({typeId, kind, moduleRef, stepTypesPath});
      }
    }
  }

  return results.sort((a, b) => a.typeId.localeCompare(b.typeId));
}

/**
 * Normalizes the shape variants of the `step-types` node into a flat list of
 * `{entries, kind}` pairs. Handles the two documented forms plus the untagged
 * flat-array form some legacy scaffolders emit.
 */
function expandStepTypeCategories(
  stepTypes: unknown,
): Array<{entries: Array<Record<string, unknown>>; kind: 'task' | 'chunk'}> {
  if (!stepTypes) return [];

  if (Array.isArray(stepTypes)) {
    // Flat form: assume task steps (the more common category). Consumers who
    // author chunk steps in this shape are rare; we'd rather show them than
    // hide them behind a strict shape check.
    return [{entries: stepTypes as Array<Record<string, unknown>>, kind: 'task'}];
  }

  if (typeof stepTypes !== 'object') return [];

  const record = stepTypes as Record<string, unknown>;
  const groups: Array<{entries: Array<Record<string, unknown>>; kind: 'task' | 'chunk'}> = [];
  const taskEntries = record['script-module-step'];
  if (Array.isArray(taskEntries)) {
    groups.push({entries: taskEntries as Array<Record<string, unknown>>, kind: 'task'});
  }
  const chunkEntries = record['chunk-script-module-step'];
  if (Array.isArray(chunkEntries)) {
    groups.push({entries: chunkEntries as Array<Record<string, unknown>>, kind: 'chunk'});
  }
  return groups;
}

/**
 * Resolves a step type `module` reference to an absolute file path on disk.
 *
 * `module` is expected to be cartridge-scoped, e.g.
 * `app_custom_core/cartridge/scripts/jobsteps/myStep` (extension optional).
 * The first path segment is the owning cartridge — which may or may not be the
 * cartridge that *declares* the step type, so we try the containing cartridge
 * first and then fall back to any other workspace cartridge with a matching
 * name. Returns undefined when nothing resolves (typo, cartridge outside the
 * workspace, etc.).
 */
export async function resolveStepTypeModule(
  moduleRef: string,
  cartridgeRoot: string,
  otherCartridgeRoots: readonly string[],
): Promise<string | undefined> {
  const trimmed = moduleRef.trim();
  if (!trimmed) return undefined;

  const segments = trimmed.split('/').filter(Boolean);
  if (segments.length === 0) return undefined;

  const [firstSegment, ...rest] = segments;
  const relWithoutCartridge = rest.length > 0 ? rest.join('/') : firstSegment;
  const declaringCartridgeName = path.basename(cartridgeRoot);

  const withJsExt = (candidate: string): string[] =>
    candidate.endsWith('.js') ? [candidate] : [candidate, `${candidate}.js`];

  const candidateBases: string[] = [];

  // 1. Try treating the first segment as the cartridge prefix and looking
  //    inside the declaring cartridge. Covers "<self>/cartridge/scripts/...".
  if (firstSegment === declaringCartridgeName) {
    candidateBases.push(path.join(cartridgeRoot, relWithoutCartridge));
  }
  // 2. Try the module path as-is under the declaring cartridge (legacy form
  //    without the cartridge prefix, e.g. "cartridge/scripts/...").
  candidateBases.push(path.join(cartridgeRoot, trimmed));

  // 3. Look across other workspace cartridges when the module names a
  //    different cartridge (some teams register step types in one cartridge
  //    but implement them in a shared "core" cartridge).
  for (const otherRoot of otherCartridgeRoots) {
    if (path.basename(otherRoot) === firstSegment) {
      candidateBases.push(path.join(otherRoot, relWithoutCartridge));
    }
  }

  for (const base of candidateBases) {
    for (const candidate of withJsExt(base)) {
      if (await pathExists(candidate)) return candidate;
    }
  }
  return undefined;
}

/**
 * Opens `steptypes.json` and jumps the cursor to the line where the given
 * `@type-id` is declared. Falls back to opening the file at the top if the id
 * can't be located (e.g. the file was edited between refresh and click).
 */
export async function openStepTypeDefinition(typeId: string, stepTypesPath: string): Promise<void> {
  const uri = vscode.Uri.file(stepTypesPath);
  const doc = await vscode.workspace.openTextDocument(uri);
  const text = doc.getText();
  const escaped = typeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`"@type-id"\\s*:\\s*"${escaped}"`));
  const options: vscode.TextDocumentShowOptions = {preview: true};
  if (match && typeof match.index === 'number') {
    const position = doc.positionAt(match.index);
    options.selection = new vscode.Range(position, position);
  }
  await vscode.window.showTextDocument(doc, options);
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
