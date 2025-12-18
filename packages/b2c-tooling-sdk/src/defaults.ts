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
