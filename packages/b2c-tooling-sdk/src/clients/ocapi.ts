/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * OCAPI client for B2C Commerce Data API operations.
 *
 * Provides a fully typed client for OCAPI Data API operations using
 * openapi-fetch with authentication middleware.
 *
 * @module clients/ocapi
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './ocapi.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';

const DEFAULT_API_VERSION = 'v25_6';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed OCAPI client - this is the openapi-fetch Client with full type safety.
 *
 * **Note:** This client is typically accessed via `B2CInstance.ocapi` rather
 * than created directly. The `B2CInstance` class handles authentication setup.
 *
 * @see {@link createOcapiClient} for direct instantiation
 */
export type OcapiClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type OcapiResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * OCAPI error/fault response type from the generated schema.
 *
 * @example
 * ```typescript
 * const { data, error } = await client.DELETE('/code_versions/{code_version_id}', {
 *   params: { path: { code_version_id: 'v1' } }
 * });
 * if (error) {
 *   // Access the structured error message
 *   console.error(error.fault?.message);
 *   // e.g., "Code version 'v1' was not found"
 * }
 * ```
 */
export type OcapiError = components['schemas']['fault'];

// Re-export middleware for backwards compatibility
export {createAuthMiddleware, createLoggingMiddleware};

/**
 * Options for creating an OCAPI client.
 */
export interface OcapiClientOptions {
  /**
   * API version (defaults to v25_6).
   */
  apiVersion?: string;
  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed OCAPI Data API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * **Note:** This client is typically accessed via `B2CInstance.ocapi` rather
 * than created directly. The `B2CInstance` class handles authentication setup.
 *
 * @param hostname - B2C instance hostname
 * @param auth - Authentication strategy (typically OAuth)
 * @param options - Optional configuration including API version and middleware registry
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Via B2CInstance (recommended)
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 * const config = resolveConfig();
 * const instance = config.createB2CInstance();
 * const { data, error } = await instance.ocapi.GET('/sites', {});
 *
 * @example
 * // Direct instantiation (advanced)
 * const client = createOcapiClient('sandbox.demandware.net', authStrategy);
 *
 * // Fully typed GET request
 * const { data, error } = await client.GET('/sites', {
 *   params: { query: { select: '(**)' } }
 * });
 *
 * // Path parameters are type-checked
 * const { data, error } = await client.GET('/sites/{site_id}', {
 *   params: { path: { site_id: 'RefArch' } }
 * });
 *
 * // Request bodies are typed
 * const { data, error } = await client.PATCH('/code_versions/{code_version_id}', {
 *   params: { path: { code_version_id: 'v1' } },
 *   body: { active: true }
 * });
 */
export function createOcapiClient(
  hostname: string,
  auth: AuthStrategy,
  options?: OcapiClientOptions | string,
): OcapiClient {
  // Support legacy string parameter for apiVersion (backwards compatibility)
  const opts: OcapiClientOptions = typeof options === 'string' ? {apiVersion: options} : (options ?? {});

  const apiVersion = opts.apiVersion ?? DEFAULT_API_VERSION;
  const registry = opts.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${hostname}/s/-/dw/data/${apiVersion}`,
  });

  // Core middleware: auth first
  client.use(createAuthMiddleware(auth));

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('ocapi')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('OCAPI'));

  return client;
}
