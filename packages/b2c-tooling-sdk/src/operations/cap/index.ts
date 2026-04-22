/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Commerce App Package (CAP) operations for B2C Commerce.
 *
 * This module provides functions for validating, packaging, installing, and
 * uninstalling Commerce App Packages (CAPs) on B2C Commerce instances.
 *
 * ## CAP Operations
 *
 * - {@link validateCap} - Validate CAP structure and manifest (local, no instance required)
 * - {@link commerceAppInstall} - Install a CAP via the sfcc-install-commerce-app job
 * - {@link commerceAppUninstall} - Uninstall a CAP via the sfcc-uninstall-commerce-app job
 * - {@link commerceAppPackage} - Package a CAP directory into a distributable .zip
 * - {@link discoverLocalApps} - Discover local CAPs by finding commerce-app.json files
 * - {@link listInstalledApps} - List installed apps on an instance via commerce_feature_states export
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   validateCap,
 *   commerceAppInstall,
 *   commerceAppUninstall,
 *   commerceAppPackage,
 *   discoverLocalApps,
 *   listInstalledApps,
 * } from '@salesforce/b2c-tooling-sdk/operations/cap';
 *
 * // Validate locally
 * const result = await validateCap('./my-commerce-app');
 * if (!result.valid) console.error(result.errors);
 *
 * // Package for distribution
 * const pkg = await commerceAppPackage('./my-commerce-app');
 *
 * // Install on an instance
 * await commerceAppInstall(instance, './my-commerce-app', { siteId: 'RefArch' });
 *
 * // Uninstall
 * await commerceAppUninstall(instance, 'my-app', 'tax', { siteId: 'RefArch' });
 * ```
 *
 * @module operations/cap
 */

export {validateCap} from './validate.js';
export type {CapValidationResult, CommerceAppManifest} from './validate.js';

// Re-export JobExecutionError for convenience in CLI commands
export {JobExecutionError} from '../jobs/run.js';

export {commerceAppInstall, readManifest} from './install.js';
export type {CommerceAppInstallOptions, CommerceAppInstallResult} from './install.js';

export {commerceAppUninstall} from './uninstall.js';
export type {CommerceAppUninstallOptions, CommerceAppUninstallResult} from './uninstall.js';

export {commerceAppPackage} from './package.js';
export type {CommerceAppPackageOptions, CommerceAppPackageResult} from './package.js';

export {discoverLocalApps, listInstalledApps, parseCommerceFeatureStatesXml} from './list.js';

export {pullCommerceApps} from './pull.js';
export type {PullCommerceAppsOptions, PullCommerceAppsResult, PulledApp, PullSource} from './pull.js';
export type {
  CommerceFeatureState,
  LocalCommerceApp,
  ListInstalledAppsOptions,
  ListInstalledAppsResult,
} from './list.js';
