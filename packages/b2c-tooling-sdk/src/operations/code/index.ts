/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Code deployment operations for B2C Commerce.
 *
 * This module provides functions for managing cartridge code versions
 * on B2C Commerce instances via WebDAV and OCAPI.
 *
 * ## Cartridge Discovery
 *
 * - {@link findCartridges} - Find cartridges by .project files
 *
 * ## Code Versions
 *
 * - {@link listCodeVersions} - List all code versions on an instance
 * - {@link getActiveCodeVersion} - Get the currently active code version
 * - {@link activateCodeVersion} - Activate a code version
 * - {@link reloadCodeVersion} - Reload (re-activate) a code version
 * - {@link deleteCodeVersion} - Delete a code version
 * - {@link createCodeVersion} - Create a new code version
 *
 * ## Deployment
 *
 * - {@link findAndDeployCartridges} - Find and deploy cartridges to an instance
 * - {@link uploadCartridges} - Low-level cartridge upload
 * - {@link deleteCartridges} - Low-level cartridge deletion
 * - {@link watchCartridges} - Watch and sync file changes
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   findCartridges,
 *   findAndDeployCartridges,
 *   listCodeVersions,
 *   activateCodeVersion,
 *   watchCartridges,
 * } from '@salesforce/b2c-tooling-sdk/operations/code';
 * import { B2CInstance } from '@salesforce/b2c-tooling-sdk';
 *
 * const instance = B2CInstance.fromDwJson();
 *
 * // Deploy cartridges (requires instance.config.codeVersion to be set)
 * await findAndDeployCartridges(instance, './cartridges', { reload: true });
 *
 * // List code versions
 * const versions = await listCodeVersions(instance);
 *
 * // Watch for changes
 * const watcher = await watchCartridges(instance, './cartridges');
 * ```
 *
 * ## Authentication
 *
 * - WebDAV operations support both Basic Auth and OAuth
 * - OCAPI operations (code versions) require OAuth
 *
 * @module operations/code
 */

// Cartridge discovery
export {findCartridges} from './cartridges.js';
export type {CartridgeMapping, FindCartridgesOptions} from './cartridges.js';

// Code version management
export {
  listCodeVersions,
  getActiveCodeVersion,
  activateCodeVersion,
  reloadCodeVersion,
  deleteCodeVersion,
  createCodeVersion,
} from './versions.js';
export type {CodeVersion, CodeVersionResult} from './versions.js';

// Deployment
export {findAndDeployCartridges, uploadCartridges, deleteCartridges} from './deploy.js';
export type {DeployOptions, DeployResult} from './deploy.js';

// Watch
export {watchCartridges} from './watch.js';
export type {WatchOptions, WatchResult} from './watch.js';
