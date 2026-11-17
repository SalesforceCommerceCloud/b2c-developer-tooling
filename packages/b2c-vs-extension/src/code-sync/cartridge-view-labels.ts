/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type * as vscode from 'vscode';

/** Parts of the Cartridges view description, in display order. */
export type CartridgeViewLabel = 'codeVersion' | 'order';

const ORDER: CartridgeViewLabel[] = ['codeVersion', 'order'];
const labels = new WeakMap<vscode.TreeView<unknown>, Partial<Record<CartridgeViewLabel, string>>>();

/**
 * Sets one part of the Cartridges view description (for example the code
 * version or the cartridge order source) without clobbering the others.
 */
export function setCartridgeViewLabel(
  treeView: vscode.TreeView<unknown>,
  key: CartridgeViewLabel,
  value: string | undefined,
): void {
  const current = {...labels.get(treeView), [key]: value};
  labels.set(treeView, current);
  treeView.description = ORDER.map((k) => current[k])
    .filter((v): v is string => Boolean(v))
    .join(' · ');
}
