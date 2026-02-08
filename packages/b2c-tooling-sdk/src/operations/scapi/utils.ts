/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Utility functions for working with custom SCAPI API endpoints.
 *
 * This module provides helper functions for:
 * - Mapping security schemes to human-readable API types
 * - Creating unique keys for endpoint grouping/deduplication
 * - Rolling up endpoints across multiple sites
 *
 * @module operations/scapi/utils
 */

import type {components} from '../../clients/custom-apis.generated.js';
import type {RolledUpEndpoint} from './types.js';

/**
 * Type alias for CustomApiEndpoint from generated types.
 */
type CustomApiEndpoint = components['schemas']['CustomApiEndpoint'];

/**
 * Maps security scheme to human-readable API type.
 *
 * @param securityScheme - The security scheme from the custom API endpoint
 * @returns Human-readable API type (Admin, Shopper, or the scheme itself)
 *
 * @example
 * ```typescript
 * getApiType('AmOAuth2')      // Returns 'Admin'
 * getApiType('ShopperToken')  // Returns 'Shopper'
 * getApiType(undefined)       // Returns '-'
 * ```
 */
export function getApiType(securityScheme?: string): string {
  switch (securityScheme) {
    case 'AmOAuth2': {
      return 'Admin';
    }
    case 'ShopperToken': {
      return 'Shopper';
    }
    default: {
      return securityScheme || '-';
    }
  }
}

/**
 * Creates a unique key for grouping endpoints.
 *
 * Endpoints with the same key will be rolled up into a single entry.
 * The key combines: apiName, apiVersion, cartridgeName, endpointPath,
 * httpMethod, status, and securityScheme.
 *
 * @param endpoint - Custom API endpoint to generate key for
 * @returns Unique string key for the endpoint
 *
 * @example
 * ```typescript
 * const endpoint = {
 *   apiName: 'loyalty-info',
 *   apiVersion: 'v1',
 *   cartridgeName: 'app_custom_apis',
 *   endpointPath: '/customers/{id}',
 *   httpMethod: 'GET',
 *   status: 'active',
 *   securityScheme: 'AmOAuth2',
 *   // ... other fields
 * };
 *
 * const key = getEndpointKey(endpoint);
 * // Returns: "loyalty-info|v1|app_custom_apis|/customers/{id}|GET|active|AmOAuth2"
 * ```
 */
export function getEndpointKey(endpoint: CustomApiEndpoint): string {
  return [
    endpoint.apiName,
    endpoint.apiVersion,
    endpoint.cartridgeName,
    endpoint.endpointPath,
    endpoint.httpMethod,
    endpoint.status,
    endpoint.securityScheme,
  ].join('|');
}

/**
 * Rolls up endpoints by combining those with the same key into a single entry with multiple siteIds.
 *
 * This function groups endpoints that have the same API name, version, path, method, etc.
 * but are deployed to different sites. The result is a cleaner list where each unique
 * endpoint appears once with an array of all site IDs where it's deployed.
 *
 * @param endpoints - Array of custom API endpoints to roll up
 * @returns Array of rolled-up endpoints with combined site IDs
 *
 * @example
 * ```typescript
 * const endpoints = [
 *   { apiName: 'loyalty', apiVersion: 'v1', endpointPath: '/points', httpMethod: 'GET', siteId: 'site-a', ... },
 *   { apiName: 'loyalty', apiVersion: 'v1', endpointPath: '/points', httpMethod: 'GET', siteId: 'site-b', ... },
 * ];
 *
 * const rolledUp = rollUpEndpoints(endpoints);
 * // Returns: [
 * //   { apiName: 'loyalty', apiVersion: 'v1', endpointPath: '/points', httpMethod: 'GET',
 * //     siteIds: ['site-a', 'site-b'], type: 'Admin', ... }
 * // ]
 * ```
 */
export function rollUpEndpoints(endpoints: CustomApiEndpoint[]): RolledUpEndpoint[] {
  const grouped = new Map<string, RolledUpEndpoint>();

  for (const endpoint of endpoints) {
    const key = getEndpointKey(endpoint);
    const existing = grouped.get(key);

    if (existing) {
      // Add site to existing entry if not already present
      if (endpoint.siteId && !existing.siteIds.includes(endpoint.siteId)) {
        existing.siteIds.push(endpoint.siteId);
      }
    } else {
      // Create new rolled-up entry
      const {siteId, ...rest} = endpoint;
      grouped.set(key, {
        ...rest,
        siteIds: siteId ? [siteId] : [],
        type: getApiType(endpoint.securityScheme),
      });
    }
  }

  return [...grouped.values()];
}
