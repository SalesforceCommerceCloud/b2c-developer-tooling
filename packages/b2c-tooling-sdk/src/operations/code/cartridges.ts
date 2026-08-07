/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {globSync, globIterateSync} from 'glob';
import path from 'node:path';

/**
 * Represents a discovered cartridge in the local filesystem.
 */
export interface CartridgeMapping {
  /** Cartridge name (directory name containing .project) */
  name: string;
  /** Absolute path to the cartridge directory */
  src: string;
  /** Destination name (same as name, used for WebDAV path) */
  dest: string;
}

/**
 * Options for finding cartridges.
 */
export interface FindCartridgesOptions {
  /** Cartridge names to include (if empty, all are included) */
  include?: string[];
  /** Cartridge names to exclude */
  exclude?: string[];
  /**
   * Maximum directory depth to recurse when searching for `.project` files,
   * counted in path segments relative to the search directory (so a cartridge
   * at `cartridges/<name>/.project` is depth 3). When omitted the search is
   * unbounded (default), preserving behavior for callers that expect a full
   * recursive walk. Bound this for untrusted/broad roots (e.g. an MCP server
   * that may be launched from a home directory) to avoid scanning the whole
   * filesystem tree.
   */
  maxDepth?: number;
  /**
   * When true, stop at the first matching cartridge and return only that one.
   * Useful for existence checks (e.g. workspace-type detection) where the full
   * list is not needed — it lets the underlying scan short-circuit instead of
   * enumerating every `.project` file. Filters from `include`/`exclude` are
   * applied while scanning, so the returned cartridge always satisfies them.
   */
  firstMatchOnly?: boolean;
}

/**
 * Find cartridges recursively in a directory.
 *
 * Cartridges are identified by the presence of a `.project` file
 * (Eclipse project marker commonly used in SFCC development).
 *
 * @param directory - Directory to search for cartridges (defaults to cwd)
 * @param options - Filter options for including/excluding cartridges
 * @returns Array of discovered cartridge mappings
 *
 * @example
 * ```typescript
 * // Find all cartridges in current directory
 * const cartridges = findCartridges();
 *
 * // Find cartridges in specific directory
 * const cartridges = findCartridges('./my-project');
 *
 * // Find specific cartridges only
 * const cartridges = findCartridges('.', { include: ['app_storefront_base'] });
 *
 * // Find all except certain cartridges
 * const cartridges = findCartridges('.', { exclude: ['test_cartridge'] });
 * ```
 */
export function findCartridges(directory?: string, options: FindCartridgesOptions = {}): CartridgeMapping[] {
  const searchDir = directory ? path.resolve(directory) : process.cwd();

  // Ignore common non-cartridge dirs to keep discovery fast when the search
  // root is broad (e.g. an MCP server's working directory).
  const globOptions = {
    cwd: searchDir,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.cache/**',
      '**/tmp/**',
      '**/temp/**',
    ],
    // maxDepth is only forwarded when set so unbounded callers keep prior behavior.
    ...(options.maxDepth === undefined ? {} : {maxDepth: options.maxDepth}),
  };

  const toCartridge = (f: string): CartridgeMapping => {
    const dirname = path.resolve(searchDir, path.dirname(f));
    const cartridgeName = path.basename(dirname);
    return {name: cartridgeName, dest: cartridgeName, src: dirname};
  };

  const matches = (c: CartridgeMapping): boolean => {
    if (options.include && options.include.length > 0 && !options.include.includes(c.name)) {
      return false;
    }
    if (options.exclude && options.exclude.length > 0 && options.exclude.includes(c.name)) {
      return false;
    }
    return true;
  };

  // Existence-check fast path: stream matches and stop at the first one that
  // passes the filters, so a large tree isn't fully enumerated.
  if (options.firstMatchOnly) {
    for (const f of globIterateSync('**/.project', globOptions)) {
      const cartridge = toCartridge(f);
      if (matches(cartridge)) {
        return [cartridge];
      }
    }
    return [];
  }

  // Find all .project files (Eclipse project markers).
  return globSync('**/.project', globOptions).map(toCartridge).filter(matches);
}
