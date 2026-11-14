/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createSitesBackend} from '@salesforce/b2c-tooling-sdk/operations/sites';

import * as vscode from 'vscode';

import {
  BUSINESS_MANAGER_SITE_ID,
  describeOrderSource,
  moveCartridge,
  shiftCartridge,
} from '../cartridges/cartridge-order.js';
import type {CartridgeService} from '../cartridges/cartridge-service.js';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {setCartridgeViewLabel} from './cartridge-view-labels.js';
import {CartridgeItem, type CartridgeNode} from './cartridge-tree-provider.js';

const DRAG_MIME = 'application/vnd.code.tree.b2ccartridgeexplorer';

/**
 * Drag and drop for reordering cartridges in the Cartridges view. Dropping a
 * cartridge onto another places it before that cartridge; dropping onto empty
 * space moves it to the end. The result is saved as this workspace's manual
 * order.
 */
export class CartridgeOrderDragAndDrop implements vscode.TreeDragAndDropController<CartridgeNode> {
  readonly dragMimeTypes = [DRAG_MIME];
  readonly dropMimeTypes = [DRAG_MIME];

  constructor(private readonly cartridgeService: CartridgeService) {}

  handleDrag(source: readonly CartridgeNode[], dataTransfer: vscode.DataTransfer): void {
    const names = source.filter((n): n is CartridgeItem => n instanceof CartridgeItem).map((n) => n.cartridge.name);
    if (names.length > 0) dataTransfer.set(DRAG_MIME, new vscode.DataTransferItem(names));
  }

  async handleDrop(target: CartridgeNode | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
    const item = dataTransfer.get(DRAG_MIME);
    const names = item?.value as string[] | undefined;
    if (!names || names.length === 0) return;
    // Dropping onto a child node (a hook, a category) is treated as dropping on its cartridge.
    const before = target ? (target as {cartridge?: {name: string}}).cartridge?.name : undefined;
    let order = this.cartridgeService.getCartridges().map((c) => c.name);
    for (const name of names) order = moveCartridge(order, name, before);
    await this.cartridgeService.setManualOrder(order);
  }
}

/** Keeps the view description, message, and context key in sync with the order source. */
export function bindCartridgeOrderDisplay(
  treeView: vscode.TreeView<CartridgeNode>,
  cartridgeService: CartridgeService,
  configProvider: B2CExtensionConfig,
): vscode.Disposable {
  const update = () => {
    const info = cartridgeService.getOrderInfo();
    setCartridgeViewLabel(treeView, 'order', describeOrderSource(info));
    void vscode.commands.executeCommand('setContext', 'b2c-dx.cartridgeOrderSource', info.source);
    // Only speak up when we tried the instance and fell back to a guess.
    treeView.message =
      info.source === 'guessed' && info.instanceError && configProvider.getInstance()
        ? `Cartridge order is guessed: couldn't read the site cartridge path (${info.instanceError}). ` +
          'Choose a site for the order, set "cartridges" in your configuration, or drag cartridges to reorder.'
        : undefined;
  };
  update();
  return cartridgeService.onDidChange(update);
}

/** Commands for the cartridge order: move up/down, reset, and choose the site. */
export function registerCartridgeOrderCommands(
  cartridgeService: CartridgeService,
  configProvider: B2CExtensionConfig,
): vscode.Disposable[] {
  const shift = (delta: -1 | 1) => async (item?: CartridgeItem) => {
    if (!item?.cartridge) return;
    const order = cartridgeService.getCartridges().map((c) => c.name);
    await cartridgeService.setManualOrder(shiftCartridge(order, item.cartridge.name, delta));
  };

  return [
    registerSafeCommand('b2c-dx.cartridges.moveUp', shift(-1)),
    registerSafeCommand('b2c-dx.cartridges.moveDown', shift(1)),
    registerSafeCommand('b2c-dx.cartridges.resetOrder', () => cartridgeService.resetManualOrder()),
    registerSafeCommand('b2c-dx.cartridges.chooseOrderSite', () => chooseOrderSite(cartridgeService, configProvider)),
  ];
}

async function chooseOrderSite(cartridgeService: CartridgeService, configProvider: B2CExtensionConfig): Promise<void> {
  const instance = configProvider.getInstance();
  if (!instance) {
    void vscode.window.showWarningMessage('B2C DX: Configure an instance to read a site cartridge path.');
    return;
  }

  type SiteItem = vscode.QuickPickItem & {siteId?: string};
  const current = cartridgeService.getOrderSite();
  const items: SiteItem[] = [
    {label: 'Auto-detect', description: 'Site whose cartridge path best matches this workspace', siteId: undefined},
  ];
  try {
    const sites = await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Window, title: 'B2C DX: Listing sites'},
      () => createSitesBackend({instance}).listSites(),
    );
    for (const site of sites) {
      if (site.id && site.id !== BUSINESS_MANAGER_SITE_ID) {
        items.push({label: site.id, description: site.displayName, detail: site.cartridges, siteId: site.id});
      }
    }
  } catch {
    // Listing needs OAuth; the user can still type a site ID below.
  }
  items.push({label: 'Business Manager', description: BUSINESS_MANAGER_SITE_ID, siteId: BUSINESS_MANAGER_SITE_ID});
  items.push({label: 'Enter a site ID…', siteId: '__input__'});
  for (const item of items)
    if (item.siteId === current && current) item.description = `${item.description ?? ''} (current)`.trim();

  const picked = await vscode.window.showQuickPick(items, {
    title: 'Site for cartridge order',
    placeHolder:
      'The Cartridges view follows this site’s cartridge path unless a manual order or cartridges config is set',
  });
  if (!picked) return;

  let siteId = picked.siteId;
  if (siteId === '__input__') {
    siteId = (await vscode.window.showInputBox({title: 'Site ID', placeHolder: 'RefArch'}))?.trim();
    if (!siteId) return;
  }

  await cartridgeService.setOrderSite(siteId);
  const ok = await vscode.window.withProgress(
    {location: vscode.ProgressLocation.Window, title: 'B2C DX: Reading site cartridge path'},
    () => cartridgeService.refreshInstanceOrder(true),
  );
  const info = cartridgeService.getOrderInfo();
  if (!ok) {
    void vscode.window.showWarningMessage(
      `B2C DX: Couldn't read the site cartridge path${info.instanceError ? `: ${info.instanceError}` : '.'}`,
    );
  } else if (info.source === 'manual' || info.source === 'config') {
    void vscode.window.showInformationMessage(
      `B2C DX: Read the cartridge path for ${info.instance?.siteId ?? siteId ?? 'the site'}, but the view keeps the ` +
        `${info.source === 'manual' ? 'manual order' : 'cartridges config'}, which takes precedence.`,
    );
  }
}
