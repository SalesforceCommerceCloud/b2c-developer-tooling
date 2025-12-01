import {globSync} from 'glob';
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

  // Find all .project files (Eclipse project markers)
  const projectFiles = globSync('**/.project', {
    cwd: searchDir,
    ignore: ['**/node_modules/**'],
  });

  let cartridges = projectFiles.map((f) => {
    const dirname = path.resolve(searchDir, path.dirname(f));
    const cartridgeName = path.basename(dirname);
    return {
      name: cartridgeName,
      dest: cartridgeName,
      src: dirname,
    };
  });

  // Apply include filter
  if (options.include && options.include.length > 0) {
    cartridges = cartridges.filter((c) => options.include!.includes(c.name));
  }

  // Apply exclude filter
  if (options.exclude && options.exclude.length > 0) {
    cartridges = cartridges.filter((c) => !options.exclude!.includes(c.name));
  }

  return cartridges;
}
