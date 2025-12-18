/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Managed Runtime (MRT) operations.
 *
 * This module provides functions for managing bundles and deployments
 * on Salesforce Managed Runtime.
 *
 * ## Bundle Operations
 *
 * - {@link createBundle} - Create a bundle from a build directory
 * - {@link pushBundle} - Push a bundle to MRT (creates and uploads)
 * - {@link uploadBundle} - Upload a pre-created bundle
 * - {@link listBundles} - List bundles for a project
 *
 * ## Usage
 *
 * ```typescript
 * import { pushBundle } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * // Push and deploy a bundle
 * const result = await pushBundle({
 *   projectSlug: 'my-storefront',
 *   ssrOnly: ['ssr.js'],
 *   ssrShared: ['**\/*.js', 'static/**\/*'],
 *   buildDirectory: './build',
 *   message: 'Release v1.0.0',
 *   target: 'staging'
 * }, auth);
 *
 * console.log(`Bundle ${result.bundleId} deployed to ${result.target}`);
 * ```
 *
 * ## Authentication
 *
 * MRT operations use API key authentication. Get your API key from the
 * [Runtime Admin](https://runtime.commercecloud.com/) dashboard.
 *
 * @module operations/mrt
 */

// Bundle creation
export {createBundle, createGlobFilter, getDefaultMessage, DEFAULT_SSR_PARAMETERS} from './bundle.js';
export type {CreateBundleOptions, Bundle} from './bundle.js';

// Push operations
export {pushBundle, uploadBundle, listBundles} from './push.js';
export type {PushOptions, PushResult} from './push.js';

// Environment variable operations
export {listEnvVars, setEnvVar, setEnvVars, deleteEnvVar} from './env-var.js';
export type {
  EnvVarOptions,
  SetEnvVarOptions,
  SetEnvVarsOptions,
  DeleteEnvVarOptions,
  ListEnvVarsResult,
  EnvironmentVariable,
} from './env-var.js';

// Environment (target) operations
export {createEnv, deleteEnv} from './env.js';
export type {CreateEnvOptions, DeleteEnvOptions, MrtEnvironment} from './env.js';
