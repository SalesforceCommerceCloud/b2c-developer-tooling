/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Cartridge path primitives: ordering, discovery, and module resolution.
 *
 * Everything in this module is synchronous, has no dependency on SDK
 * configuration or logging, and reaches the filesystem only through a
 * {@link CartridgeFileSystemHost}. That keeps it usable from the CLI, MCP
 * tools, the VS Code extension, and the TypeScript language service plugin.
 *
 * @example
 * ```typescript
 * import {
 *   CartridgeResolver,
 *   createNodeFileSystemHost,
 *   discoverCartridges,
 *   orderCartridges,
 *   parseCartridgePath,
 * } from '@salesforce/b2c-tooling-sdk/cartridges';
 *
 * const host = createNodeFileSystemHost();
 * const cartridges = orderCartridges(discoverCartridges('./my-project', host), parseCartridgePath('app_custom:app_storefront_base:modules'));
 * const resolver = new CartridgeResolver(cartridges, host);
 *
 * const csrf = resolver.resolveRequire('*\/cartridge/scripts/middleware/csrf', cartridges[0].src + '/cartridge/controllers/Cart.js');
 * ```
 *
 * @module cartridges
 */

export {createNodeFileSystemHost, toForwardSlashes} from './host.js';
export type {CartridgeFileSystemHost} from './host.js';

export {BASE_CARTRIDGE_RANK, orderCartridges, parseCartridgePath} from './order.js';

export {DEFAULT_DISCOVERY_MAX_DEPTH, DISCOVERY_IGNORED_DIRECTORIES, discoverCartridges} from './discover.js';
export type {DiscoverCartridgesOptions, DiscoveredCartridge} from './discover.js';

export {CARTRIDGE_MODULE_EXTENSIONS, CartridgeResolver} from './resolver.js';
export type {
  CartridgeLocation,
  CartridgeResolutionKind,
  ResolveRequireOptions,
  ResolvedCartridgeModule,
} from './resolver.js';
