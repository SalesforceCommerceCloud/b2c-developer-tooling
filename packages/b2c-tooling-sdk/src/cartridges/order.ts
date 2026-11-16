/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Cartridges that conventionally sit at the end of the cartridge path when no
 * explicit order is configured. Higher rank means further right (lower
 * priority). SFRA's runtime path ends with `app_storefront_base:modules`, so
 * `modules` sorts strictly last.
 */
export const BASE_CARTRIDGE_RANK: Readonly<Record<string, number>> = Object.freeze({
  app_storefront_base: 1,
  modules: 2,
});

/**
 * Parses a cartridge path value into an ordered list of cartridge names.
 *
 * Accepts the forms used by `dw.json`/`SFCC_CARTRIDGES` and Business Manager:
 * a colon- or comma-separated string, or an array of names. Empty entries are
 * dropped; anything else returns an empty list.
 *
 * @example
 * ```typescript
 * parseCartridgePath('app_custom:app_storefront_base:modules');
 * // ['app_custom', 'app_storefront_base', 'modules']
 * ```
 */
export function parseCartridgePath(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/[,:]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim());
  }
  return [];
}

/**
 * Orders discovered cartridges to match the runtime cartridge path.
 *
 * When `configured` names an order (from `dw.json`, `SFCC_CARTRIDGES`, or a
 * site's cartridge path), named cartridges come first in that order and any
 * remaining discovered cartridges follow in discovery order. Names that are
 * not present on disk are dropped. Without a configured order, discovery order
 * is kept and known base cartridges ({@link BASE_CARTRIDGE_RANK}) sort last.
 *
 * The input array is not modified.
 *
 * @example
 * ```typescript
 * const ordered = orderCartridges(findCartridges(), parseCartridgePath(config.cartridges));
 * ```
 */
export function orderCartridges<T extends {name: string}>(
  discovered: readonly T[],
  configured?: readonly string[],
): T[] {
  if (configured && configured.length > 0) {
    const byName = new Map(discovered.map((c) => [c.name, c]));
    const ordered: T[] = [];
    const seen = new Set<string>();
    for (const name of configured) {
      const found = byName.get(name);
      if (found && !seen.has(name)) {
        ordered.push(found);
        seen.add(name);
      }
    }
    for (const c of discovered) {
      if (!seen.has(c.name)) ordered.push(c);
    }
    return ordered;
  }

  const indexed = discovered.map((c, i) => ({c, i}));
  indexed.sort((a, b) => {
    const ar = BASE_CARTRIDGE_RANK[a.c.name] ?? 0;
    const br = BASE_CARTRIDGE_RANK[b.c.name] ?? 0;
    if (ar !== br) return ar - br;
    return a.i - b.i;
  });
  return indexed.map((x) => x.c);
}
