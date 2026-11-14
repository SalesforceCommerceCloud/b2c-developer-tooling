/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {type CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';
import {createSitesBackend} from '@salesforce/b2c-tooling-sdk/operations/sites';

import * as vscode from 'vscode';

import type {B2CExtensionConfig} from '../config-provider.js';
import {findCartridgesSafe} from '../workspace-discovery.js';
import {
  type CartridgeOrderResult,
  type InstanceCartridgePath,
  type SiteCartridgePath,
  canQueryInstanceSilently,
  pickSiteForCartridges,
  resolveCartridgeOrder,
  splitCartridgePath,
} from './cartridge-order.js';

const MANUAL_ORDER_KEY = 'b2c-dx.cartridges.manualOrder';
const ORDER_SITE_KEY = 'b2c-dx.cartridges.orderSite';
const INSTANCE_PATH_CACHE_KEY = 'b2c-dx.cartridges.instancePath';

/** Sites whose cartridge path is fetched individually when the list response lacks it. */
const MAX_SITE_PATH_LOOKUPS = 10;

/** The current panel order, why, and the last instance lookup problem (if any). */
export interface CartridgeOrderInfo extends Omit<CartridgeOrderResult<CartridgeMapping>, 'cartridges'> {
  /** Why the instance cartridge path could not be read, from the most recent attempt. */
  instanceError?: string;
}

/** Options for {@link CartridgeService}. */
export interface CartridgeServiceOptions {
  /** Workspace storage for the manual order, chosen site, and cached instance path. */
  workspaceState?: vscode.Memento;
  log?: vscode.OutputChannel;
}

/**
 * Workspace cartridge enumeration shared across features that need to know
 * which directories are cartridges and in what order (Cartridges panel,
 * Script API IntelliSense go-to-definition, ISML template links).
 *
 * The order matches the runtime cartridge path as closely as possible, using
 * the highest-precedence source available:
 *
 *   1. a manual order the user set in the panel (saved per workspace),
 *   2. the `cartridges` value from dw.json / SFCC_CARTRIDGES,
 *   3. a site cartridge path read from the instance (cached; best effort),
 *   4. a guess: discovery order with known base cartridges last.
 *
 * Instance lookups never block or fail loudly. They run in the background only
 * when they can authenticate without user interaction (client credentials);
 * otherwise they run when the user picks a site for the order.
 *
 * Refreshes when any `.project` file is added or removed, when the active
 * config resets, and when a feature calls `refresh()`.
 */
export class CartridgeService implements vscode.Disposable {
  readonly onDidChange: vscode.Event<CartridgeMapping[]>;

  private cartridges: CartridgeMapping[] = [];
  private discovered: CartridgeMapping[] = [];
  private readonly emitter = new vscode.EventEmitter<CartridgeMapping[]>();
  private instanceError: string | undefined;
  private instanceGeneration = 0;
  private instanceLookupAttempted = false;
  private loaded = false;
  private orderResult: CartridgeOrderResult<CartridgeMapping> = {cartridges: [], source: 'guessed'};
  private readonly resetSub: vscode.Disposable;
  private readonly watcher: vscode.FileSystemWatcher;

  constructor(
    private readonly configProvider: B2CExtensionConfig,
    private readonly options: CartridgeServiceOptions = {},
  ) {
    this.onDidChange = this.emitter.event;
    this.watcher = vscode.workspace.createFileSystemWatcher('**/.project');
    this.watcher.onDidCreate(() => this.refresh());
    this.watcher.onDidDelete(() => this.refresh());
    // A config reset can change the order (dw.json edit, instance switch) even
    // when the on-disk set is unchanged. A different instance or site also
    // invalidates the instance lookup.
    this.resetSub = configProvider.onDidReset(() => {
      this.instanceLookupAttempted = false;
      this.instanceError = undefined;
      this.refresh();
    });
  }

  dispose(): void {
    this.watcher.dispose();
    this.resetSub.dispose();
    this.emitter.dispose();
  }

  getCartridgeRoots(): string[] {
    return this.getCartridges().map((c) => c.src);
  }

  getCartridges(): CartridgeMapping[] {
    if (!this.loaded) this.reload();
    return this.cartridges;
  }

  /** Where the current order came from. */
  getOrderInfo(): CartridgeOrderInfo {
    if (!this.loaded) this.reload();
    const {cartridges: _ignored, ...rest} = this.orderResult;
    return {...rest, instanceError: this.instanceError};
  }

  /** The site picked in this workspace for the instance order, if any. */
  getOrderSite(): string | undefined {
    return this.options.workspaceState?.get<string>(ORDER_SITE_KEY);
  }

  /**
   * Re-scans cartridges and re-applies the order.
   *
   * @param options.refetchInstance - Also re-read the instance cartridge path in
   *   the background (only when that needs no user interaction).
   */
  refresh(options: {refetchInstance?: boolean} = {}): void {
    if (options.refetchInstance) this.instanceLookupAttempted = false;
    this.reload();
    this.emitter.fire(this.cartridges);
  }

  /**
   * Reads the instance cartridge path now and re-applies the order.
   *
   * @param interactive - Allow authentication that may prompt the user (an
   *   explicit user action). Background lookups pass false.
   * @returns Whether the lookup succeeded.
   */
  async refreshInstanceOrder(interactive: boolean): Promise<boolean> {
    const config = this.configProvider.getConfig();
    const instance = this.configProvider.getInstance();
    const hostname = config?.values.hostname;
    if (!config || !instance || !hostname) return false;
    if (!interactive && !canQueryInstanceSilently(config.values)) return false;

    const generation = ++this.instanceGeneration;
    this.instanceLookupAttempted = true;
    try {
      const backend = createSitesBackend({instance});
      const pinned = this.getOrderSite();
      const configuredSite = config.values.siteId;
      let result: InstanceCartridgePath | undefined;

      if (pinned || configuredSite) {
        const siteId = (pinned ?? configuredSite)!;
        result = {
          hostname,
          siteId,
          siteSelection: pinned ? 'workspace' : 'config',
          cartridges: splitCartridgePath(await backend.getCartridgePath(siteId)),
        };
      } else {
        const sites = await backend.listSites();
        const candidates: SiteCartridgePath[] = [];
        let lookups = 0;
        for (const site of sites) {
          if (!site.id) continue;
          let path = site.cartridges;
          if (path === undefined && lookups < MAX_SITE_PATH_LOOKUPS) {
            lookups++;
            path = await backend.getCartridgePath(site.id).catch(() => undefined);
          }
          if (path !== undefined) candidates.push({siteId: site.id, cartridges: splitCartridgePath(path)});
        }
        const best = pickSiteForCartridges(
          candidates,
          this.discovered.map((c) => c.name),
        );
        if (best) result = {hostname, siteId: best.siteId, siteSelection: 'auto', cartridges: [...best.cartridges]};
      }

      if (generation !== this.instanceGeneration) return false;
      if (!result) {
        this.instanceError = 'no site on the instance lists these cartridges';
        this.log(`[Cartridges] Instance order: ${this.instanceError}`);
      } else {
        this.instanceError = undefined;
        await this.options.workspaceState?.update(INSTANCE_PATH_CACHE_KEY, result);
        this.log(
          `[Cartridges] Instance order from site ${result.siteId} (${result.siteSelection}): ${result.cartridges.join(':')}`,
        );
      }
      this.reload();
      this.emitter.fire(this.cartridges);
      return result !== undefined;
    } catch (error) {
      if (generation !== this.instanceGeneration) return false;
      this.instanceError = error instanceof Error ? error.message.split('\n')[0] : String(error);
      this.log(`[Cartridges] Could not read the site cartridge path: ${this.instanceError}`);
      this.emitter.fire(this.cartridges);
      return false;
    }
  }

  /** Restores the automatic order (config, instance, or guess). */
  async resetManualOrder(): Promise<void> {
    await this.options.workspaceState?.update(MANUAL_ORDER_KEY, undefined);
    this.refresh();
  }

  /** Saves a manual order for this workspace. */
  async setManualOrder(names: readonly string[]): Promise<void> {
    await this.options.workspaceState?.update(MANUAL_ORDER_KEY, [...names]);
    this.refresh();
  }

  /** Picks the site used for the instance order in this workspace (undefined to auto-detect). */
  async setOrderSite(siteId: string | undefined): Promise<void> {
    await this.options.workspaceState?.update(ORDER_SITE_KEY, siteId);
  }

  /** The cached instance path, if it still applies to the current instance and site choice. */
  private cachedInstancePath(): InstanceCartridgePath | undefined {
    const cached = this.options.workspaceState?.get<InstanceCartridgePath>(INSTANCE_PATH_CACHE_KEY);
    const config = this.configProvider.getConfig();
    if (!cached || !config || cached.hostname !== config.values.hostname) return undefined;
    const pinned = this.getOrderSite();
    if (pinned) return cached.siteId === pinned ? cached : undefined;
    const configuredSite = config.values.siteId;
    if (configuredSite) return cached.siteId === configuredSite ? cached : undefined;
    return cached.siteSelection === 'auto' ? cached : undefined;
  }

  private log(message: string): void {
    this.options.log?.appendLine(message);
  }

  private reload(): void {
    const cwd = this.configProvider.getWorkingDirectory();
    // findCartridgesSafe returns [] for an empty/home/root working directory and
    // depth-bounds the scan, so a workspace with no concrete B2C folder never
    // triggers a recursive walk on the extension-host thread (W-23618508).
    try {
      this.discovered = findCartridgesSafe(cwd);
    } catch {
      this.discovered = [];
    }

    this.orderResult = resolveCartridgeOrder({
      discovered: this.discovered,
      manual: this.options.workspaceState?.get<string[]>(MANUAL_ORDER_KEY),
      configured: this.configProvider.getConfig()?.values.cartridges,
      instance: this.cachedInstancePath(),
    });
    this.cartridges = this.orderResult.cartridges;
    this.loaded = true;

    // Optimistically read the instance path once per session (and after a
    // config reset) when nothing of higher precedence is set.
    const wantsInstance = this.orderResult.source === 'instance' || this.orderResult.source === 'guessed';
    if (wantsInstance && !this.instanceLookupAttempted && this.discovered.length > 0) {
      this.instanceLookupAttempted = true;
      void this.refreshInstanceOrder(false);
    }
  }
}
