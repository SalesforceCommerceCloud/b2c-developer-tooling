/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';

import type {CartridgeFileSystemHost} from './host.js';

/**
 * Directory names skipped while searching for cartridges. Shared by every
 * discovery implementation so the CLI, the VS Code extension, and the
 * TypeScript plugin agree on what counts as a cartridge.
 */
export const DISCOVERY_IGNORED_DIRECTORIES: ReadonlySet<string> = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.cache',
  'tmp',
  'temp',
]);

/** Default maximum directory depth for {@link discoverCartridges}. */
export const DEFAULT_DISCOVERY_MAX_DEPTH = 8;

/** A cartridge found on disk. */
export interface DiscoveredCartridge {
  /** Cartridge name (the directory name that contains `.project`). */
  name: string;
  /** Path to the cartridge directory. */
  src: string;
}

/** Options for {@link discoverCartridges}. */
export interface DiscoverCartridgesOptions {
  /** Maximum directory depth below `root` to search. Defaults to {@link DEFAULT_DISCOVERY_MAX_DEPTH}. */
  maxDepth?: number;
}

/**
 * Synchronously finds cartridges below `root` through a filesystem host.
 *
 * A cartridge is a directory containing a `.project` file. The search does not
 * descend into a cartridge once found, skips {@link DISCOVERY_IGNORED_DIRECTORIES},
 * and is depth-limited. Results are sorted by path for deterministic output.
 *
 * Use this where only a synchronous host is available (for example inside the
 * TypeScript language service). Node callers that want project-root pruning and
 * warnings should use `findCartridges()` from `@salesforce/b2c-tooling-sdk/operations/code`.
 */
export function discoverCartridges(
  root: string,
  host: CartridgeFileSystemHost,
  options: DiscoverCartridgesOptions = {},
): DiscoveredCartridge[] {
  const maxDepth = options.maxDepth ?? DEFAULT_DISCOVERY_MAX_DEPTH;
  const found: DiscoveredCartridge[] = [];
  const stack: {dir: string; depth: number}[] = [{dir: root, depth: 0}];
  while (stack.length > 0) {
    const {dir, depth} = stack.pop()!;
    if (host.fileExists(path.join(dir, '.project'))) {
      found.push({name: path.basename(dir), src: dir});
      continue;
    }
    if (depth >= maxDepth) continue;
    for (const sub of host.getDirectories(dir)) {
      if (DISCOVERY_IGNORED_DIRECTORIES.has(sub)) continue;
      stack.push({dir: path.join(dir, sub), depth: depth + 1});
    }
  }
  found.sort((a, b) => a.src.localeCompare(b.src));
  return found;
}
