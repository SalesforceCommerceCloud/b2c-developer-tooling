/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'path';
import * as vscode from 'vscode';

const DW_JSON_GLOB = '**/dw.json';
const DISCOVERY_EXCLUDE_GLOB = '**/{node_modules,.git}/**';

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
