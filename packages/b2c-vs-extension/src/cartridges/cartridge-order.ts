/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {orderCartridges} from '@salesforce/b2c-tooling-sdk/cartridges';

/**
 * Where the Cartridges panel order came from, highest precedence first:
 *
 * - `manual`: the user reordered the panel (drag and drop or move up/down); saved per workspace.
 * - `config`: the `cartridges` value from dw.json or SFCC_CARTRIDGES.
 * - `instance`: the cartridge path of a site on the connected instance.
 * - `guessed`: discovery order with known base cartridges (app_storefront_base, modules) last.
 */
export type CartridgeOrderSource = 'config' | 'guessed' | 'instance' | 'manual';

/** A site cartridge path read from the instance. */
export interface InstanceCartridgePath {
  hostname: string;
  siteId: string;
  /** How the site was chosen: picked in this workspace, from config `siteId`, or detected. */
  siteSelection: 'auto' | 'config' | 'workspace';
  cartridges: string[];
}

/** Inputs to {@link resolveCartridgeOrder}. */
export interface CartridgeOrderInputs<T extends {name: string}> {
  discovered: readonly T[];
  manual?: readonly string[];
  configured?: readonly string[];
  instance?: InstanceCartridgePath;
}

/** The resolved panel order and why. */
export interface CartridgeOrderResult<T extends {name: string}> {
  cartridges: T[];
  source: CartridgeOrderSource;
  /** The ordered names the order was taken from (absent for `guessed`). */
  path?: readonly string[];
  /** Set when the order came from the instance. */
  instance?: InstanceCartridgePath;
}

/**
 * Orders discovered cartridges by the highest-precedence source available:
 * manual, then config, then instance, then a guess. Cartridges that are on
 * disk but not named by the chosen source are appended in guessed order.
 */
export function resolveCartridgeOrder<T extends {name: string}>(
  inputs: CartridgeOrderInputs<T>,
): CartridgeOrderResult<T> {
  const {discovered} = inputs;
  const apply = (names: readonly string[]): T[] => {
    const named = orderCartridges(discovered, names).filter((c) => names.includes(c.name));
    const rest = orderCartridges(discovered.filter((c) => !names.includes(c.name)));
    return [...named, ...rest];
  };

  if (inputs.manual && inputs.manual.length > 0) {
    return {cartridges: apply(inputs.manual), source: 'manual', path: inputs.manual};
  }
  if (inputs.configured && inputs.configured.length > 0) {
    return {cartridges: apply(inputs.configured), source: 'config', path: inputs.configured};
  }
  if (inputs.instance && inputs.instance.cartridges.length > 0) {
    return {
      cartridges: apply(inputs.instance.cartridges),
      source: 'instance',
      path: inputs.instance.cartridges,
      instance: inputs.instance,
    };
  }
  return {cartridges: orderCartridges(discovered), source: 'guessed'};
}

/** A site and its cartridge path, as candidates for {@link pickSiteForCartridges}. */
export interface SiteCartridgePath {
  siteId: string;
  cartridges: readonly string[];
}

/** Business Manager's site ID; never auto-selected for storefront code. */
export const BUSINESS_MANAGER_SITE_ID = 'Sites-Site';

/**
 * Picks the site whose cartridge path best matches the local cartridges: the
 * one naming the most local cartridges, ties broken by listing order.
 * Business Manager is skipped. Returns undefined when no site names any.
 */
export function pickSiteForCartridges(
  sites: readonly SiteCartridgePath[],
  localNames: readonly string[],
): SiteCartridgePath | undefined {
  const local = new Set(localNames);
  let best: SiteCartridgePath | undefined;
  let bestScore = 0;
  for (const site of sites) {
    if (site.siteId === BUSINESS_MANAGER_SITE_ID) continue;
    const score = site.cartridges.filter((c) => local.has(c)).length;
    if (score > bestScore) {
      best = site;
      bestScore = score;
    }
  }
  return best;
}

/** Parses a colon-separated cartridge path into names. */
export function splitCartridgePath(value: string | undefined): string[] {
  return (value ?? '')
    .split(':')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Moves `name` within `order` so it lands immediately before `before`, or at
 * the end when `before` is undefined. Returns a new array; unknown names are
 * ignored.
 */
export function moveCartridge(order: readonly string[], name: string, before: string | undefined): string[] {
  if (!order.includes(name) || name === before) return [...order];
  const without = order.filter((n) => n !== name);
  const index = before === undefined ? -1 : without.indexOf(before);
  if (index < 0) return [...without, name];
  return [...without.slice(0, index), name, ...without.slice(index)];
}

/** Moves `name` one position toward the front (`-1`) or back (`1`). Returns a new array. */
export function shiftCartridge(order: readonly string[], name: string, delta: -1 | 1): string[] {
  const i = order.indexOf(name);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= order.length) return [...order];
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** One-line description of the order source for the panel header. */
export function describeOrderSource(result: Pick<CartridgeOrderResult<{name: string}>, 'instance' | 'source'>): string {
  switch (result.source) {
    case 'manual':
      return 'Order: reordered in this workspace';
    case 'config':
      return 'Order: cartridges config';
    case 'instance':
      return `Order: ${result.instance?.siteId} on instance`;
    default:
      return 'Order: guessed';
  }
}

/**
 * Whether instance API calls can run without user interaction: client
 * credentials are configured and not excluded by `authMethods`. User (browser)
 * auth would open a login page, so background order discovery skips it.
 */
export function canQueryInstanceSilently(values: {
  authMethods?: readonly string[];
  clientId?: string;
  clientSecret?: string;
}): boolean {
  if (!values.clientId || !values.clientSecret) return false;
  return !values.authMethods || values.authMethods.length === 0 || values.authMethods.includes('client-credentials');
}
