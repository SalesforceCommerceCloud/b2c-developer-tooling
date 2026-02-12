/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Security scheme utilities for OpenAPI schemas.
 *
 * This module provides utility functions for processing security schemes
 * from SCAPI (Salesforce Commerce API) schemas, particularly for custom
 * API endpoints.
 *
 * @module schemas/security-schemes
 */

/**
 * Maps security scheme to human-readable API type.
 *
 * This utility processes security schemes from SCAPI schemas (typically found
 * in custom API endpoints) and maps them to user-friendly API type names.
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
