/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Configuration loading utilities.
 *
 * This module provides utilities for loading B2C Commerce configuration.
 * The preferred high-level API is {@link resolveConfig}, which returns
 * a rich configuration object with factory methods.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig({
 *   hostname: process.env.SFCC_SERVER,
 *   clientId: process.env.SFCC_CLIENT_ID,
 *   mrtApiKey: process.env.MRT_API_KEY,
 * });
 *
 * // Check what's available and create objects
 * if (config.hasB2CInstanceConfig()) {
 *   const instance = config.createB2CInstance();
 *   await instance.webdav.propfind('Cartridges');
 * }
 *
 * if (config.hasMrtConfig()) {
 *   const mrtClient = config.createMrtClient({ project: 'my-project' });
 * }
 * ```
 *
 * ## Resolution Priority
 *
 * Configuration is resolved with the following precedence (highest to lowest):
 *
 * 1. **Explicit overrides** - Values passed to `resolve()`, `createInstance()`, etc.
 * 2. **Configuration sources** - dw.json, ~/.mobify (in order)
 *
 * Later sources only fill in missing values—they do not override values from
 * higher-priority sources.
 *
 * ## Hostname Mismatch Protection
 *
 * The configuration system includes safety protection against accidentally using
 * credentials from one instance with a different hostname. When you explicitly
 * specify a hostname that differs from the dw.json hostname:
 *
 * - The entire base configuration from dw.json is ignored
 * - Only your explicit overrides are used
 * - A warning is included in the resolution result
 *
 * This prevents credential leakage between different B2C instances.
 *
 * ## Default Configuration Sources
 *
 * The default sources loaded by {@link createConfigResolver} are:
 *
 * - **dw.json** - Project configuration file, searched upward from cwd
 * - **~/.mobify** - Home directory file for MRT API key
 *
 * ## Custom Configuration Sources
 *
 * Implement the {@link ConfigSource} interface to create custom sources:
 *
 * ```typescript
 * import { ConfigResolver, type ConfigSource } from '@salesforce/b2c-tooling-sdk/config';
 *
 * class MySource implements ConfigSource {
 *   name = 'my-source';
 *   load(options) { return { hostname: 'custom.example.com' }; }
 * }
 *
 * const resolver = new ConfigResolver([new MySource()]);
 * ```
 *
 * ## Lower-Level APIs
 *
 * For advanced use cases, you can use the lower-level dw.json loading functions:
 *
 * ```typescript
 * import { loadDwJson, findDwJson } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const dwJsonPath = findDwJson();
 * const config = loadDwJson({ path: dwJsonPath, instance: 'staging' });
 * ```
 *
 * @module config
 */

// High-level API (preferred)
export {resolveConfig, ConfigResolver, createConfigResolver} from './resolver.js';

// Types
export type {
  NormalizedConfig,
  ConfigSource,
  ConfigSourceInfo,
  ConfigResolutionResult,
  ConfigWarning,
  ConfigWarningCode,
  ResolveConfigOptions,
  ResolvedB2CConfig,
  CreateOAuthOptions,
  CreateMrtClientOptions,
} from './types.js';

// Instance creation utility (public API for CLI commands)
export {createInstanceFromConfig} from './mapping.js';

// Low-level dw.json API (still available for advanced use)
export {loadDwJson, findDwJson} from './dw-json.js';
export type {DwJsonConfig, DwJsonMultiConfig, LoadDwJsonOptions, LoadDwJsonResult} from './dw-json.js';
