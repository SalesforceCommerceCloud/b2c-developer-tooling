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
  /** Cartridge name (directory name containing .project or cartridge/*.properties) */
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
   * Maximum directory depth to recurse when searching for cartridges,
   * expressed as the number of path segments to the marker file relative to
   * the search directory. A cartridge at `cartridges/<name>/.project` is
   * depth 3; the equivalent `cartridge/*.properties` marker at
   * `cartridges/<name>/cartridge/<name>.properties` is automatically adjusted
   * to depth 4 (maxDepth + 1) so both discovery methods honour the same
   * logical cartridge-nesting bound. When omitted the search is unbounded
   * (default). Bound this for untrusted/broad roots (e.g. an MCP server
   * launched from a home directory) to avoid scanning the whole filesystem.
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
 * Cartridges are identified by two markers, tried in order:
 * 1. `.project` — Eclipse project marker (primary, used by UX Studio / SFRA).
 * 2. `cartridge/<name>.properties` — SFCC structural marker (fallback, used by
 *    pwa-kit, storefront-next, and cartridge packages that omit the Eclipse marker).
 *
 * The fallback is only attempted when **no** `.project` files are found under
 * the search directory. If `.project` files exist but are all filtered out by
 * `include`/`exclude`, the function returns an empty array rather than
 * switching to the properties marker.
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

  // The properties file sits one extra level inside the cartridge root
  // (<name>/cartridge/<name>.properties vs <name>/.project), so add 1 to the
  // depth bound so both markers honour the same logical cartridge-nesting limit.
  const propertiesGlobOptions =
    options.maxDepth === undefined ? globOptions : {...globOptions, maxDepth: options.maxDepth + 1};

  const toCartridge = (f: string): CartridgeMapping => {
    const dirname = path.resolve(searchDir, path.dirname(f));
    const cartridgeName = path.basename(dirname);
    return {name: cartridgeName, dest: cartridgeName, src: dirname};
  };

  const toCartridgeFromProperties = (f: string): CartridgeMapping => {
    // f = "<name>/cartridge/<name>.properties" — cartridge root is two levels up
    const dirname = path.resolve(searchDir, path.dirname(path.dirname(f)));
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
    let hasProjectFiles = false;
    for (const f of globIterateSync('**/.project', globOptions)) {
      hasProjectFiles = true;
      const cartridge = toCartridge(f);
      if (matches(cartridge)) {
        return [cartridge];
      }
    }
    if (!hasProjectFiles) {
      for (const f of globIterateSync('**/cartridge/*.properties', propertiesGlobOptions)) {
        const cartridge = toCartridgeFromProperties(f);
        if (matches(cartridge)) {
          return [cartridge];
        }
      }
    }
    return [];
  }

  // Primary: .project (Eclipse marker).
  const projectFiles = globSync('**/.project', globOptions);
  if (projectFiles.length > 0) {
    return projectFiles.map(toCartridge).filter(matches);
  }

  // Fallback: cartridge/<name>.properties (SFCC structural marker).
  return globSync('**/cartridge/*.properties', propertiesGlobOptions).map(toCartridgeFromProperties).filter(matches);
}
