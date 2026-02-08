/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI (Salesforce Commerce API) operations.
 *
 * This module provides functions for working with custom SCAPI APIs,
 * including local discovery, remote management, and utility functions.
 *
 * ## Local Custom API Discovery
 *
 * - {@link scanLocalCustomApis} - Scan workspace for custom API definitions
 *
 * ## Utility Functions
 *
 * - {@link getApiType} - Map security scheme to human-readable API type
 * - {@link getEndpointKey} - Generate unique key for endpoint grouping
 * - {@link rollUpEndpoints} - Roll up endpoints across multiple sites
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   scanLocalCustomApis,
 *   rollUpEndpoints,
 *   getApiType
 * } from '@salesforce/b2c-tooling-sdk/operations/scapi';
 *
 * // Discover custom APIs in current directory
 * const endpoints = scanLocalCustomApis();
 *
 * // With filters
 * const endpoints = scanLocalCustomApis({
 *   directory: './my-project',
 *   includeCartridges: ['app_storefront_base'],
 *   includeApis: ['loyalty-points'],
 * });
 *
 * console.log(`Found ${endpoints.length} custom API endpoints`);
 *
 * // Roll up endpoints across sites
 * const rolledUp = rollUpEndpoints(remoteEndpoints);
 * console.log(`Grouped into ${rolledUp.length} unique endpoints`);
 * ```
 *
 * @module operations/scapi
 */

export {scanLocalCustomApis} from './local-scanner.js';
export type {
  HttpMethod,
  LocalCustomApiEndpoint,
  ScanLocalCustomApisOptions,
  SecurityScheme,
  RolledUpEndpoint,
} from './types.js';
export {getApiType, getEndpointKey, rollUpEndpoints} from './utils.js';
