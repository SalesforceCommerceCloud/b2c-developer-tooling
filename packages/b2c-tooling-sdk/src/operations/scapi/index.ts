/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * SCAPI (Salesforce Commerce API) operations.
 *
 * This module provides utility functions for working with custom SCAPI APIs.
 *
 * ## Utility Functions
 *
 * - {@link getApiType} - Map security scheme to human-readable API type
 *
 * ## Usage
 *
 * ```typescript
 * import { getApiType } from '@salesforce/b2c-tooling-sdk/operations/scapi';
 *
 * // Map security scheme to API type
 * const apiType = getApiType('AmOAuth2');      // Returns 'Admin'
 * const shopperType = getApiType('ShopperToken');  // Returns 'Shopper'
 * ```
 *
 * @module operations/scapi
 */

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
