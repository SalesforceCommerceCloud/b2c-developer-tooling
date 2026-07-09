/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Two-tier cache for online documentation content (the raw `.md` fetched for
 * corpora whose bodies are not bundled — Script API, Developer Center guides,
 * Salesforce Help).
 *
 * 1. **In-memory** — a per-process `Map`, so repeated reads within a live process
 *    (an MCP server session, a multi-lookup agent) never re-fetch.
 * 2. **On-disk** — a TTL'd file cache under the OS cache dir, so repeated reads
 *    across separate CLI invocations (each a fresh process) hit disk, not the
 *    network. Effectively a lazy, self-populating local mirror.
 *
 * Content is keyed by the fetch URL. Both tiers are best-effort: any disk error
 * is swallowed (logged at trace) so caching never breaks a read.
 *
 * @module docs/content-cache
 */
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import {homedir, platform} from 'node:os';
import * as path from 'node:path';

import {getLogger} from '../logging/logger.js';

/** Default time-to-live for on-disk cache entries: 7 days. */
export const DEFAULT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** In-memory content cache, keyed by fetch URL. Lives for the process. */
const memoryCache = new Map<string, string>();

/**
 * Base cache directory, injected by the CLI/MCP. When set (via
 * {@link initializeContentCache}), the on-disk cache lives under
 * `<cacheDir>/docs-content`. Unset means "use the computed fallback" — for
 * standalone SDK consumers not running under oclif.
 */
let injectedCacheDir: string | undefined;

/**
 * Points the on-disk content cache at oclif's `cacheDir`.
 *
 * The CLI and MCP call this from `BaseCommand.init()` with `this.config.cacheDir`
 * so cached docs live alongside other oclif cache data (e.g. `~/.cache/b2c` on
 * Linux, `~/Library/Caches/b2c` on macOS) and honor any oclif dir overrides —
 * mirroring how {@link initializeStatefulStore} injects `dataDir`. Standalone SDK
 * use (no oclif) falls back to an OS-idiomatic path.
 *
 * @param cacheDir - oclif's resolved `this.config.cacheDir`
 */
export function initializeContentCache(cacheDir: string): void {
  injectedCacheDir = cacheDir;
}

/**
 * OS-idiomatic cache directory fallback for standalone SDK use (no oclif). Uses
 * the oclif `dirname` (`b2c`) so it matches oclif's own `cacheDir` layout.
 */
function computeFallbackCacheDir(): string {
  const home = homedir();
  const name = 'b2c';
  switch (platform()) {
    case 'darwin':
      return path.join(home, 'Library', 'Caches', name);
    case 'win32':
      return path.join(process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local'), name);
    default:
      return path.join(process.env.XDG_CACHE_HOME ?? path.join(home, '.cache'), name);
  }
}

/** The docs-content cache directory: `<injected|fallback cacheDir>/docs-content`. */
function getCacheDir(): string {
  return path.join(injectedCacheDir ?? computeFallbackCacheDir(), 'docs-content');
}

/** Maps a fetch URL to its on-disk cache file (hashed so the name is filesystem-safe). */
function cacheFileFor(url: string): string {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 40);
  return path.join(getCacheDir(), `${hash}.md`);
}

/**
 * Returns cached content for `url` from memory or a fresh-enough disk entry, or
 * `undefined` on a miss. A disk hit repopulates the in-memory tier.
 *
 * @param url - The fetch URL used as the cache key
 * @param ttlMs - Max age for a disk entry to count as a hit (default 7 days)
 */
export function getCachedContent(url: string, ttlMs: number = DEFAULT_CACHE_TTL_MS): string | undefined {
  const mem = memoryCache.get(url);
  if (mem !== undefined) return mem;

  // A non-positive TTL means "never serve from cache" (force refetch),
  // independent of filesystem clock skew on just-written files.
  if (ttlMs <= 0) return undefined;

  const file = cacheFileFor(url);
  try {
    const stat = fs.statSync(file);
    // Age can be marginally negative when a fresh file's mtime rounds ahead of
    // Date.now(); clamp so that only genuinely-old entries are treated as stale.
    if (Date.now() - stat.mtimeMs > ttlMs) return undefined; // stale
    const content = fs.readFileSync(file, 'utf-8');
    memoryCache.set(url, content);
    return content;
  } catch {
    return undefined; // missing / unreadable -> miss
  }
}

/**
 * Stores freshly fetched content in both cache tiers. Disk write is best-effort.
 *
 * @param url - The fetch URL used as the cache key
 * @param content - The fetched content to cache
 */
export function setCachedContent(url: string, content: string): void {
  memoryCache.set(url, content);
  const file = cacheFileFor(url);
  try {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content);
  } catch (err) {
    getLogger().trace({url, err}, 'Failed to write docs content disk cache (non-fatal)');
  }
}

/**
 * Clears the in-memory cache (and optionally the on-disk cache). Intended for
 * tests and an explicit user "refresh docs" action.
 *
 * @param includeDisk - When true, also removes the on-disk cache directory
 */
export function clearContentCache(includeDisk = false): void {
  memoryCache.clear();
  if (includeDisk) {
    try {
      fs.rmSync(getCacheDir(), {recursive: true, force: true});
    } catch (err) {
      getLogger().trace({err}, 'Failed to clear docs content disk cache (non-fatal)');
    }
  }
}
