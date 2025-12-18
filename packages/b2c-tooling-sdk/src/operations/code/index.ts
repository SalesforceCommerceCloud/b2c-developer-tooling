/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
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
