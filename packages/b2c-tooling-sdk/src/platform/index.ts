/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Platform API clients for Salesforce Commerce Cloud services.
 *
 * This module provides low-level clients for platform-level APIs that operate
 * outside of individual B2C instances.
 *
 * ## Available Clients
 *
 * - {@link MrtClient} - Managed Runtime (MRT) API for deployments
 * - {@link OdsClient} - On-Demand Sandbox API for sandbox management
 *
 * ## Usage
 *
 * ```typescript
 * import { MrtClient, OdsClient } from '@salesforce/b2c-tooling-sdk/platform';
 * import { ApiKeyStrategy, OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * // MRT operations use API key authentication
 * const mrtAuth = new ApiKeyStrategy('your-api-key');
 * const mrt = new MrtClient(
 *   { org: 'my-org', project: 'my-project', env: 'production' },
 *   mrtAuth
 * );
 *
 * // ODS operations use OAuth authentication
 * const odsAuth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 * const ods = new OdsClient({ region: 'us' }, odsAuth);
 * ```
 *
 * @module platform
 */
export {MrtClient} from './mrt.js';
export type {MrtProject} from './mrt.js';
export {OdsClient} from './ods.js';
export type {OdsConfig} from './ods.js';
