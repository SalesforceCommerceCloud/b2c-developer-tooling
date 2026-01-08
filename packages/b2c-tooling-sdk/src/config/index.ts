/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Configuration loading utilities.
 *
 * This module provides utilities for loading B2C Commerce configuration.
 * The preferred high-level API is {@link ConfigResolver}, which provides
 * consistent configuration resolution from multiple sources.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { createConfigResolver } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const resolver = createConfigResolver();
 *
 * // Resolve configuration with overrides
 * const { config, warnings } = resolver.resolve({
 *   hostname: process.env.SFCC_SERVER,
 *   clientId: process.env.SFCC_CLIENT_ID,
 * });
 *
 * // Or create a B2CInstance directly
 * const instance = resolver.createInstance({ hostname: '...' });
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
 * @module config
 */

// High-level API (preferred)
export {ConfigResolver, createConfigResolver} from './resolver.js';

// Types
export type {
  NormalizedConfig,
  ConfigSource,
  ConfigSourceInfo,
  ConfigResolutionResult,
  ConfigWarning,
  ConfigWarningCode,
  ResolveConfigOptions,
} from './types.js';

// Mapping utilities
export {
  mapDwJsonToNormalizedConfig,
  mergeConfigsWithProtection,
  getPopulatedFields,
  buildAuthConfigFromNormalized,
  createInstanceFromConfig,
} from './mapping.js';
export type {MergeConfigOptions, MergeConfigResult} from './mapping.js';

// Low-level dw.json API (still available for advanced use)
export {loadDwJson, findDwJson} from './dw-json.js';
export type {DwJsonConfig, DwJsonMultiConfig, LoadDwJsonOptions} from './dw-json.js';
