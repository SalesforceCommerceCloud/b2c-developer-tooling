/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Site operations for B2C Commerce instances.
 *
 * This module provides functions for managing site cartridge paths
 * on B2C Commerce instances. Operations work via OCAPI Data API with
 * automatic fallback to site archive import/export when OCAPI permissions
 * are unavailable. Business Manager (Sites-Site) is supported via the
 * import/export mechanism.
 *
 * ## Cartridge Path Functions
 *
 * - {@link getCartridgePath} - Get the current cartridge path for a site
 * - {@link addCartridge} - Add a cartridge at a specific position
 * - {@link removeCartridge} - Remove a cartridge from the path
 * - {@link setCartridgePath} - Replace the entire cartridge path
 *
 * ## Usage
 *
 * ```typescript
 * import {getCartridgePath, addCartridge, setCartridgePath} from '@salesforce/b2c-tooling-sdk/operations/sites';
 * import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig();
 * const instance = config.createB2CInstance();
 *
 * // List cartridge path
 * const result = await getCartridgePath(instance, 'RefArch');
 * console.log(result.cartridgeList);
 *
 * // Add a cartridge
 * await addCartridge(instance, 'RefArch', { name: 'my_cartridge', position: 'first' });
 *
 * // Business Manager
 * await addCartridge(instance, 'Sites-Site', { name: 'bm_ext', position: 'first' });
 * ```
 *
 * ## Authentication
 *
 * Cartridge path operations require OAuth authentication. For OCAPI direct updates,
 * grant POST/PUT/DELETE on `/sites/∗/cartridges`. For import/export fallback,
 * grant job execution permissions and WebDAV write access.
 *
 * @module operations/sites
 */
export {getCartridgePath, addCartridge, removeCartridge, setCartridgePath, BM_SITE_ID} from './cartridges.js';

export type {
  CartridgePathResult,
  AddCartridgeOptions,
  CartridgePosition,
  CartridgeUpdateOptions,
} from './cartridges.js';
