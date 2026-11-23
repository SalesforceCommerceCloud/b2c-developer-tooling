/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';

import {DISCOVERY_IGNORED_DIRECTORIES} from './discover.js';
import type {CartridgeFileSystemHost} from './host.js';
import {parseCartridgePath} from './order.js';

/** Business Manager's site ID; never picked automatically for storefront code. */
const BUSINESS_MANAGER_SITE_ID = 'Sites-Site';

/** Default directory depth searched by {@link findSiteCartridgePaths}. */
const DEFAULT_MAX_DEPTH = 8;

/** A site's cartridge path found in a site import file (`sites/<id>/site.xml`) in the project. */
export interface SiteCartridgePathFile {
  siteId: string;
  /** Cartridge names from `<custom-cartridges>`, in path order. */
  cartridges: string[];
  /** The site.xml file. */
  file: string;
  /**
   * The timestamp prefix of the nearest directory named like a migration or
   * import set item (`20260901T002537-add-payments`, `2026-09-01_...`), as 14
   * digits. Absent for files outside such a directory (`site_template/`).
   */
  timestamp?: string;
}

/** Options for {@link findSiteCartridgePaths}. */
export interface FindSiteCartridgePathsOptions {
  /** Maximum directory depth below `root` to search. Defaults to 8. */
  maxDepth?: number;
}

/**
 * Finds site cartridge paths in site import files below `root`: any
 * `sites/<id>/site.xml` with a `<custom-cartridges>` element, whether in a
 * site template, a cartridge's `metadata/`, or a dated migration or import
 * set directory. Returns the current file for each site: the one under the
 * directory with the latest timestamp prefix (files in timestamped
 * directories are newer than files outside them), otherwise the last by
 * path. Cartridge code directories and {@link DISCOVERY_IGNORED_DIRECTORIES}
 * are skipped.
 *
 * @example
 * ```typescript
 * const sites = findSiteCartridgePaths('.', createNodeFileSystemHost());
 * // [{siteId: 'RefArch', cartridges: ['app_custom', 'app_storefront_base'],
 * //   file: '.../migrations/20260901T002537-x/sites/RefArch/site.xml', timestamp: '20260901002537'}]
 * ```
 */
export function findSiteCartridgePaths(
  root: string,
  host: CartridgeFileSystemHost,
  options: FindSiteCartridgePathsOptions = {},
): SiteCartridgePathFile[] {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const base = path.resolve(root);
  const latest = new Map<string, SiteCartridgePathFile>();
  const stack: Array<{dir: string; depth: number}> = [{dir: base, depth: 0}];
  while (stack.length > 0) {
    const {dir, depth} = stack.pop()!;
    if (path.basename(path.dirname(dir)) === 'sites') {
      const found = readSiteFile(path.join(dir, 'site.xml'), path.basename(dir), base, host);
      if (found) {
        const current = latest.get(found.siteId);
        if (!current || isNewer(found, current)) latest.set(found.siteId, found);
      }
    }
    if (depth >= maxDepth) continue;
    // Inside a cartridge, only metadata (not cartridge/ code) can hold site files.
    const isCartridge = host.fileExists(path.join(dir, '.project'));
    for (const sub of host.getDirectories(dir)) {
      if (DISCOVERY_IGNORED_DIRECTORIES.has(sub) || sub.startsWith('.')) continue;
      if (isCartridge && sub === 'cartridge') continue;
      stack.push({dir: path.join(dir, sub), depth: depth + 1});
    }
  }
  return [...latest.values()].sort((a, b) => a.siteId.localeCompare(b.siteId));
}

/** How {@link selectSiteCartridgePath} chose a site. */
export interface SiteCartridgePathSelection {
  /**
   * `siteId` when the requested site was found, `only` when there is one
   * site, `best-match` otherwise (including when the requested site isn't listed).
   */
  selection: 'best-match' | 'only' | 'siteId';
  /** Other sites whose cartridge path differs, when the choice was a best match. */
  alternatives: string[];
}

/** The site whose cartridge path was chosen by {@link selectSiteCartridgePath}, and why. */
export type SelectedSiteCartridgePath = SiteCartridgePathFile & SiteCartridgePathSelection;

/**
 * Picks one site's cartridge path: the requested `siteId` when it is listed,
 * else the only site, else the site whose path names the most local
 * cartridges (ties go to the first site ID alphabetically). A `siteId` that
 * isn't listed (often a default for another project) falls through to the
 * automatic choice. Business Manager (`Sites-Site`) is never picked
 * automatically. Returns undefined when nothing matches.
 *
 * Works on site files from {@link findSiteCartridgePaths} or on any list of
 * sites and their cartridge paths, such as the sites on an instance.
 */
export function selectSiteCartridgePath<T extends {siteId: string; cartridges: readonly string[]}>(
  sites: readonly T[],
  localNames: readonly string[],
  siteId?: string,
): (SiteCartridgePathSelection & T) | undefined {
  if (siteId) {
    const requested = sites.find((s) => s.siteId === siteId);
    if (requested) return {...requested, selection: 'siteId', alternatives: []};
  }
  const candidates = [...sites]
    .filter((s) => s.siteId !== BUSINESS_MANAGER_SITE_ID && s.cartridges.length > 0)
    .sort((a, b) => a.siteId.localeCompare(b.siteId));
  if (candidates.length === 1) return {...candidates[0], selection: 'only', alternatives: []};
  const local = new Set(localNames);
  let best: T | undefined;
  let bestScore = 0;
  for (const site of candidates) {
    const score = site.cartridges.filter((c) => local.has(c)).length;
    if (score > bestScore) {
      best = site;
      bestScore = score;
    }
  }
  if (!best) return undefined;
  const key = best.cartridges.join(':');
  const alternatives = candidates.filter((s) => s.cartridges.join(':') !== key).map((s) => s.siteId);
  return {...best, selection: 'best-match', alternatives};
}

function readSiteFile(
  file: string,
  dirSiteId: string,
  root: string,
  host: CartridgeFileSystemHost,
): SiteCartridgePathFile | undefined {
  const text = host.readFile(file);
  if (!text) return undefined;
  const match = text.match(/<custom-cartridges>([^<]*)<\/custom-cartridges>/);
  if (!match) return undefined;
  const siteId = text.match(/<site\b[^>]*\bsite-id="([^"]+)"/)?.[1] ?? dirSiteId;
  const timestamp = timestampOf(path.relative(root, file));
  return {siteId, cartridges: parseCartridgePath(match[1]), file, ...(timestamp ? {timestamp} : {})};
}

const TIMESTAMP_PREFIX = /^(\d{4})-?(\d{2})-?(\d{2})(?:[T_-]?(\d{2})[:-]?(\d{2})(?:[:-]?(\d{2}))?)?(?=$|\D)/;

/**
 * The timestamp of the deepest path segment that starts with an ISO 8601-style
 * date (`20260901T002537-...`, `2026-09-01T00-25-37_...`, `20260901-...`), as 14 digits.
 */
function timestampOf(relPath: string): string | undefined {
  for (const segment of relPath.split(/[\\/]/).reverse()) {
    const m = segment.match(TIMESTAMP_PREFIX);
    if (m)
      return m
        .slice(1)
        .map((part, i) => part ?? (i < 3 ? '01' : '00'))
        .join('');
  }
  return undefined;
}

function isNewer(a: SiteCartridgePathFile, b: SiteCartridgePathFile): boolean {
  if (a.timestamp !== b.timestamp) {
    if (!a.timestamp) return false;
    if (!b.timestamp) return true;
    return a.timestamp > b.timestamp;
  }
  return a.file > b.file;
}
