/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Maps local filesystem paths to SDAPI server script paths and vice-versa.
 *
 * SDAPI script paths are cartridge-relative, e.g. `/app_storefront/cartridge/controllers/Cart.js`.
 * Local paths are absolute filesystem paths resolved from discovered cartridge directories.
 *
 * @module operations/debug/source-mapping
 */
import path from 'node:path';
import type {CartridgeMapping} from '../code/cartridges.js';

export interface SourceMapper {
  /** Convert a local filesystem path to an SDAPI script_path. */
  toServerPath(localPath: string): string | undefined;
  /** Convert an SDAPI script_path to a local filesystem path. */
  toLocalPath(scriptPath: string): string | undefined;
}

/**
 * Creates a SourceMapper from discovered cartridge mappings.
 *
 * @param cartridges - Array of cartridge mappings from `findCartridges()`
 */
export function createSourceMapper(cartridges: CartridgeMapping[]): SourceMapper {
  // Pre-compute normalized cartridge source paths for fast comparison
  const mappings = cartridges.map((c) => ({
    name: c.name,
    // Normalize and ensure trailing separator for prefix matching
    srcPrefix: path.resolve(c.src) + path.sep,
    src: path.resolve(c.src),
  }));

  // Index by cartridge name for fast server→local lookup
  const byName = new Map(mappings.map((m) => [m.name, m]));

  return {
    toServerPath(localPath: string): string | undefined {
      const resolved = path.resolve(localPath);
      for (const m of mappings) {
        if (resolved.startsWith(m.srcPrefix) || resolved === m.src) {
          const relative = resolved.slice(m.srcPrefix.length);
          // SDAPI paths use forward slashes
          return `/${m.name}/${relative.split(path.sep).join('/')}`;
        }
      }
      return undefined;
    },

    toLocalPath(scriptPath: string): string | undefined {
      // scriptPath format: /cartridge_name/rest/of/path.js
      const withoutLeadingSlash = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
      const slashIndex = withoutLeadingSlash.indexOf('/');
      if (slashIndex === -1) return undefined;

      const cartridgeName = withoutLeadingSlash.slice(0, slashIndex);
      const rest = withoutLeadingSlash.slice(slashIndex + 1);

      const mapping = byName.get(cartridgeName);
      if (!mapping) return undefined;

      return path.join(mapping.src, rest);
    },
  };
}
