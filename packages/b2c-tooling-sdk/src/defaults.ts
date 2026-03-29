/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Centralized default values for B2C Commerce APIs.
 *
 * These defaults are used across auth strategies, clients, and CLI commands.
 * Override via environment variables or CLI flags.
 *
 * @module defaults
 */

/**
 * Default Account Manager host for OAuth authentication.
 * Used for client credentials and implicit OAuth flows.
 *
 * Environment variable: SFCC_ACCOUNT_MANAGER_HOST
 */
export const DEFAULT_ACCOUNT_MANAGER_HOST = 'account.demandware.com';

/**
 * Default ODS (On-Demand Sandbox) API host.
 * Used for sandbox management operations.
 *
 * Environment variable: SFCC_SANDBOX_API_HOST
 */
export const DEFAULT_ODS_HOST = 'admin.dx.commercecloud.salesforce.com';

/**
 * Default public client ID for implicit OAuth flows.
 * Used as a fallback when no client ID is configured for platform-level
 * commands (Account Manager, Sandbox, SLAS) that support public client tokens.
 */
export const DEFAULT_PUBLIC_CLIENT_ID = '7eee11e3-375b-498f-a087-e450a330d202';

/**
 * Host-specific overrides for the default public client ID.
 * Some Account Manager instances require a different public client registration.
 */
const HOST_CLIENT_ID_OVERRIDES: Record<string, string> = {
  'account-pod5.demandware.net': 'c44527fe-66ff-4455-9eec-7287b2c66485',
};

/**
 * Returns the default public client ID for the given Account Manager host.
 * Falls back to {@link DEFAULT_PUBLIC_CLIENT_ID} for hosts without an override.
 *
 * @param accountManagerHost - The Account Manager hostname
 * @returns The appropriate public client ID for that host
 */
export function getDefaultPublicClientId(accountManagerHost?: string): string {
  if (accountManagerHost && accountManagerHost in HOST_CLIENT_ID_OVERRIDES) {
    return HOST_CLIENT_ID_OVERRIDES[accountManagerHost];
  }
  return DEFAULT_PUBLIC_CLIENT_ID;
}
