/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import type {SourceMapper} from './source-mapping.js';
import type {CartridgeMapping} from '../code/cartridges.js';

/**
 * Resolve a user-provided file path to an SDAPI script_path.
 *
 * Accepts:
 *   - Absolute local path: `/Users/.../app_storefront/cartridge/controllers/Cart.js`
 *   - Relative local path: `./cartridges/app_storefront/cartridge/controllers/Cart.js`
 *   - Server path: `/app_storefront/cartridge/controllers/Cart.js` (passed through if not a local match)
 *   - Cartridge-name-prefixed: `app_storefront/cartridge/controllers/Cart.js` (prefixed with /)
 *
 * Returns the SDAPI script_path (e.g. `/app_storefront/cartridge/controllers/Cart.js`).
 * Throws with a helpful message if the path cannot be resolved.
 */
export function resolveBreakpointPath(
  input: string,
  sourceMapper: SourceMapper,
  cartridges: CartridgeMapping[],
): string {
  // Always try source mapper first — handles both absolute and relative local paths
  const mapped = sourceMapper.toServerPath(input);
  if (mapped) return mapped;

  // Try resolving relative to cwd (for paths like ./cartridges/app_mysite/...)
  const resolved = path.resolve(input);
  if (resolved !== input) {
    const mappedResolved = sourceMapper.toServerPath(resolved);
    if (mappedResolved) return mappedResolved;
  }

  // If it starts with / and the source mapper didn't match, treat as server path
  if (input.startsWith('/')) {
    return input;
  }

  // Check if the input starts with a known cartridge name — treat as server path missing leading /
  const normalized = input.split(path.sep).join('/');
  const firstSegment = normalized.split('/')[0];
  if (cartridges.some((c) => c.name === firstSegment)) {
    return `/${normalized}`;
  }

  const cartridgeNames = cartridges.map((c) => c.name).join(', ');
  const hint =
    cartridges.length > 0
      ? `Known cartridges: ${cartridgeNames}\n` +
        `Accepted forms:\n` +
        `  /cartridge_name/cartridge/path/to/file.js  (server path)\n` +
        `  cartridge_name/cartridge/path/to/file.js    (server path without leading /)\n` +
        `  ./path/to/cartridge_name/cartridge/file.js  (relative local path)\n` +
        `  /absolute/path/to/cartridge_name/file.js    (absolute local path)`
      : 'No cartridges discovered. Use a server path: /cartridge_name/cartridge/path/file.js';

  throw new Error(`Cannot resolve "${input}" to a server script path.\n${hint}`);
}
