/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as fs from 'node:fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import {type CartridgeOrderSource, describeOrderSource} from '../cartridges/cartridge-order.js';
import type {CartridgeService} from '../cartridges/cartridge-service.js';
import type {ProjectIndex} from '@salesforce/b2c-tooling-sdk/project-index';
import type {ProjectIndexService} from '../cartridges/project-index-service.js';
import {applyRow, openCommand} from '../endpoints/endpoints-tree.js';
import {
  cartridgeCustomApis,
  cartridgeHookRows,
  controllerFiles,
  customApiEndpointRow,
  type ControllerFile,
  type CustomApiGroup,
  type RowModel,
} from '../endpoints/model.js';

/**
 * Each cartridge expands into what it contributes: controllers, hooks, and
 * Custom APIs (from the shared project index, so they match the Endpoints
 * view), plus custom job steps registered in `steptypes.json`.
 */
export type CartridgeCategory = 'controllers' | 'customApis' | 'hooks' | 'stepTypes';

// Extensions a cartridge script module can have. `.ds` is the legacy
// pipeline-era script extension, still resolvable by the platform.
const SCRIPT_EXTENSIONS = ['.js', '.ts', '.ds'];

function isScriptFile(name: string): boolean {
  return SCRIPT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export type CartridgeNode =
  | CartridgeItem
  | CartridgeCategoryItem
  | ControllerFileItem
  | ControllerStatementItem
  | CartridgeRowItem
  | CustomApiItem
  | CartridgeStepTypeItem
  | CartridgeCategoryEmptyItem;

/** Where a cartridge sits in the panel order, for its description and tooltip. */
export interface CartridgeItemOrder {
  /** 1-based position. */
  position: number;
  total: number;
  source: CartridgeOrderSource;
  sourceLabel: string;
  /** False when the order comes from a cartridge path that doesn't name this cartridge. */
  onPath?: boolean;
}

export class CartridgeItem extends vscode.TreeItem {
  readonly kind = 'cartridge' as const;

  constructor(
    public readonly cartridge: CartridgeMapping,
    order?: CartridgeItemOrder,
  ) {
    super(cartridge.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart:${cartridge.src}`;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    const location = workspaceFolders ? path.relative(workspaceFolders[0].uri.fsPath, cartridge.src) : undefined;
    const notOnPath = order?.onPath === false;
    this.description = [location, notOnPath ? 'not on cartridge path' : undefined].filter(Boolean).join(' · ');

    this.iconPath = new vscode.ThemeIcon('package');
    this.contextValue = 'cartridge';
    this.tooltip = order
      ? `${cartridge.src}\nPosition ${order.position} of ${order.total} · ${order.sourceLabel}` +
        (notOnPath ? '\nNot named in the cartridge path this order comes from.' : '') +
        (order.source === 'guessed'
          ? '\nTo use the real order: choose a site for the cartridge order, set "cartridges" in your configuration, or drag to reorder.'
          : '')
      : cartridge.src;
  }
}

const CATEGORY_LABELS: Record<CartridgeCategory, string> = {
  controllers: 'Controllers',
  customApis: 'Custom APIs',
  hooks: 'Hooks',
  stepTypes: 'Custom Job Steps',
};

const CATEGORY_ICONS: Record<CartridgeCategory, string> = {
  controllers: 'symbol-class',
  customApis: 'globe',
  hooks: 'plug',
  stepTypes: 'symbol-method',
};

const CATEGORY_EMPTY_HINTS: Record<CartridgeCategory, {label: string; description: string}> = {
  controllers: {label: 'No controllers', description: 'Add a controller under cartridge/controllers/'},
  customApis: {label: 'No Custom APIs', description: 'Add one under cartridge/rest-apis/'},
  hooks: {label: 'No hooks registered', description: 'Add a hooks.json to register one'},
  stepTypes: {label: 'No custom job steps registered', description: 'Add a steptypes.json in the cartridge root'},
};

/** Grouping node beneath a cartridge ("Controllers", "Hooks", "Custom APIs", "Custom Job Steps"). */
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

/** A controller file under a cartridge's Controllers category. */
export class ControllerFileItem extends vscode.TreeItem {
  readonly kind = 'controllerFile' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    readonly file: ControllerFile,
  ) {
    super(file.relPath.split('/').at(-1) ?? file.relPath, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = `cart-controller:${cartridge.src}:${file.relPath}`;
    this.description = file.extends ? `extends ${file.extends}` : undefined;
    this.resourceUri = vscode.Uri.file(path.join(cartridge.src, file.relPath));
    this.iconPath = file.rows.some((r) => r.warning)
      ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'))
      : new vscode.ThemeIcon('symbol-class');
    this.contextValue = 'cartridge-controller-file';
    this.command = openCommand(path.join(cartridge.src, file.relPath));
  }
}

/** One route statement (`post AddProduct`, `replace Show`, `exports.Submit`) in a controller file. */
export class ControllerStatementItem extends vscode.TreeItem {
  readonly kind = 'controllerStatement' as const;

  constructor(
    readonly cartridge: CartridgeMapping,
    row: RowModel,
    position: number,
  ) {
    super(row.label, vscode.TreeItemCollapsibleState.None);
    this.id = `cart-controller-row:${cartridge.src}:${row.location?.relPath}:${position}`;
    this.description = row.description;
    this.tooltip = row.tooltip;
    this.iconPath = row.warning
      ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'))
      : new vscode.ThemeIcon('symbol-method');
    this.contextValue = 'cartridge-controller-statement';
    if (row.location) this.command = openCommand(path.join(cartridge.src, row.location.relPath), row.location.line);
  }
}

/** A project-index row (hook registration, Custom API endpoint) under a cartridge category. */
export class CartridgeRowItem extends vscode.TreeItem {
  readonly kind = 'row' as const;

  constructor(index: ProjectIndex, row: RowModel, id: string, icon: string, contextValue: string) {
    super(row.label, vscode.TreeItemCollapsibleState.None);
    applyRow(this, index, row, id, icon, contextValue);
  }
}

/** A Custom API defined in a cartridge; expands into its endpoints. */
export class CustomApiItem extends vscode.TreeItem {
  readonly kind = 'customApi' as const;

  constructor(
    index: ProjectIndex,
    readonly cartridge: CartridgeMapping,
    readonly group: CustomApiGroup,
  ) {
    super(group.api, vscode.TreeItemCollapsibleState.Collapsed);
    applyRow(this, index, group.row, `cart-api:${cartridge.src}:${group.api}`, 'globe', 'cartridge-custom-api');
    this.description = group.types.join('/');
    if (group.endpoints.some((e) => e.problems.length > 0)) {
      this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
    }
  }
}

export type CartridgeTreeItem = CartridgeNode;

export class CartridgeTreeProvider implements vscode.TreeDataProvider<CartridgeNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<CartridgeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly cartridgesSub: vscode.Disposable;

  private readonly indexSub: vscode.Disposable;

  constructor(
    private readonly cartridgeService: CartridgeService,
    private readonly indexService: ProjectIndexService,
  ) {
    this.cartridgesSub = cartridgeService.onDidChange(() => this._onDidChangeTreeData.fire());
    this.indexSub = indexService.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this.cartridgeService.refresh();
  }

  getTreeItem(element: CartridgeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CartridgeNode): Promise<CartridgeNode[]> {
    if (!element) {
      const cartridges = this.cartridgeService.getCartridges();
      const info = this.cartridgeService.getOrderInfo();
      const sourceLabel = describeOrderSource(info).replace(/^Order: /, 'order from ');
      const checkPath = info.source === 'config' || info.source === 'instance';
      return cartridges.map(
        (c, i) =>
          new CartridgeItem(c, {
            position: i + 1,
            total: cartridges.length,
            source: info.source,
            sourceLabel,
            onPath: checkPath ? info.path?.includes(c.name) : undefined,
          }),
      );
    }

    if (element instanceof CartridgeItem) {
      return [
        new CartridgeCategoryItem(element.cartridge, 'controllers'),
        new CartridgeCategoryItem(element.cartridge, 'hooks'),
        new CartridgeCategoryItem(element.cartridge, 'customApis'),
        new CartridgeCategoryItem(element.cartridge, 'stepTypes'),
      ];
    }

    if (element instanceof CartridgeCategoryItem) {
      return this.getCategoryChildren(element);
    }

    if (element instanceof ControllerFileItem) {
      return element.file.rows.map((row, i) => new ControllerStatementItem(element.cartridge, row, i));
    }

    if (element instanceof CustomApiItem) {
      const index = this.indexService.getIndex();
      return element.group.endpoints.map(
        (e, i) =>
          new CartridgeRowItem(
            index,
            customApiEndpointRow(e),
            `cart-api-endpoint:${element.cartridge.src}:${element.group.api}:${i}`,
            'symbol-method',
            'cartridge-custom-api-endpoint',
          ),
      );
    }

    return [];
  }

  /**
   * Enumerates the children for a category. Controllers, hooks, and Custom
   * APIs come from the project index; custom job steps from any
   * `steptypes.json` in the cartridge root or under it.
   */
  private async getCategoryChildren(node: CartridgeCategoryItem): Promise<CartridgeNode[]> {
    const cartridgeRoot = node.cartridge.src;

    if (node.category === 'controllers') {
      const files = controllerFiles(this.indexService.getIndex(), node.cartridge.name);
      if (files.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'controllers')];
      return files.map((file) => new ControllerFileItem(node.cartridge, file));
    }

    if (node.category === 'hooks') {
      const index = this.indexService.getIndex();
      const rows = cartridgeHookRows(index, node.cartridge.name);
      if (rows.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'hooks')];
      return rows.map(
        (row, i) =>
          new CartridgeRowItem(index, row, `cart-hook:${node.cartridge.src}:${i}`, 'symbol-function', 'cartridge-hook'),
      );
    }

    if (node.category === 'customApis') {
      const index = this.indexService.getIndex();
      const groups = cartridgeCustomApis(index, node.cartridge.name);
      if (groups.length === 0) return [new CartridgeCategoryEmptyItem(node.cartridge, 'customApis')];
      return groups.map((group) => new CustomApiItem(index, node.cartridge, group));
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
    this.indexSub.dispose();
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

  const withScriptExt = (candidate: string): string[] =>
    isScriptFile(candidate) ? [candidate] : [candidate, ...SCRIPT_EXTENSIONS.map((ext) => `${candidate}${ext}`)];

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
    for (const candidate of withScriptExt(base)) {
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
