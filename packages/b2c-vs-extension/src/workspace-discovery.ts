/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  findCartridges,
  type CartridgeMapping,
  type FindCartridgesOptions,
} from '@salesforce/b2c-tooling-sdk/operations/code';

import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const DW_JSON_GLOB = '**/dw.json';
const DISCOVERY_EXCLUDE_GLOB = '**/{node_modules,.git}/**';

/**
 * Maximum directory depth for recursive workspace scans (cartridge/storefront
 * detection) triggered during activation. Depth is counted in path segments
 * relative to the project directory; 5 covers the common layouts — a cartridge
 * at `cartridges/<name>/.project` (depth 3) and a monorepo cartridge at
 * `packages/<app>/cartridges/<name>/.project` (depth 5) — without fanning out
 * across an unrelated deep tree. Mirrors the MCP server's `DISCOVERY_MAX_DEPTH`.
 */
export const WORKSPACE_DISCOVERY_MAX_DEPTH = 5;

/**
 * Returns true when `dir` is a location that should never be recursively
 * scanned for a B2C project: the user's home directory or a filesystem root.
 *
 * The extension is activated implicitly by its `typescriptServerPlugins`
 * contribution (VS Code loads TS server plugins for every JS/TS file), so it
 * can wake up in an empty window or a home-directory-as-folder layout where the
 * resolved working directory is `~` or `/`. Recursively globbing those roots on
 * the shared extension-host thread would stall every other extension (see
 * W-23618508), and it would not identify a meaningful workspace anyway. Callers
 * skip discovery for these directories.
 *
 * An empty string (no working directory) is treated as unscannable.
 */
export function isUnscannableRoot(dir: string): boolean {
  if (!dir) return true;
  const resolved = path.resolve(dir);
  // Filesystem root: parent equals self (handles `/` and Windows drive roots).
  if (path.dirname(resolved) === resolved) {
    return true;
  }
  const home = os.homedir();
  return Boolean(home) && path.resolve(home) === resolved;
}

/**
 * Extension-safe wrapper around the SDK's {@link findCartridges}.
 *
 * The bare SDK function resolves an empty/undefined directory to
 * `process.cwd()` and, by default, walks the tree with no depth bound. In the
 * VS Code extension that is dangerous: the extension is activated implicitly by
 * its `typescriptServerPlugins` contribution and can wake up with no workspace
 * folder or a home-directory-as-folder layout, where an unbounded recursive
 * `**\/.project` glob would run on the shared extension-host thread and stall
 * every other extension (W-23618508).
 *
 * This wrapper enforces two invariants for ALL extension cartridge discovery:
 *   1. Never scan a home directory, filesystem root, or an empty/undefined
 *      directory — returns `[]` instead (so we never fall back to cwd).
 *   2. Always depth-bound the scan ({@link WORKSPACE_DISCOVERY_MAX_DEPTH}
 *      unless the caller overrides `maxDepth`).
 *
 * Use this instead of importing `findCartridges` directly anywhere in the
 * extension.
 */
export function findCartridgesSafe(
  directory: string | undefined,
  options: FindCartridgesOptions = {},
): CartridgeMapping[] {
  if (isUnscannableRoot(directory ?? '')) {
    return [];
  }
  return findCartridges(directory, {maxDepth: WORKSPACE_DISCOVERY_MAX_DEPTH, ...options});
}

function pathDepth(relativePath: string): number {
  return relativePath.split(path.sep).length;
}

/**
 * Find the first dw.json in workspace-folder order.
 *
 * Within each workspace folder, the shallowest file wins. Ties are resolved
 * lexically so discovery remains stable when a folder contains multiple B2C
 * projects.
 */
export async function findWorkspaceDwJson(): Promise<vscode.Uri | undefined> {
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const matches = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, DW_JSON_GLOB),
      DISCOVERY_EXCLUDE_GLOB,
    );
    matches.sort((left, right) => {
      const leftRelative = path.relative(folder.uri.fsPath, left.fsPath);
      const rightRelative = path.relative(folder.uri.fsPath, right.fsPath);
      return pathDepth(leftRelative) - pathDepth(rightRelative) || leftRelative.localeCompare(rightRelative);
    });
    if (matches.length > 0) {
      return matches[0];
    }
  }
  return undefined;
}

export async function workspaceHasDwJson(): Promise<boolean> {
  return (await findWorkspaceDwJson()) !== undefined;
}
