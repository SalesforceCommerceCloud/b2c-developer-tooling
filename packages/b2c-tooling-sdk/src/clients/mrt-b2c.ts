/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Managed Runtime B2C Commerce API client.
 *
 * Provides a typed client for the MRT B2C Commerce integration API,
 * which manages the connection between MRT targets and B2C Commerce instances.
 *
 * @module clients/mrt-b2c
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './mrt-b2c.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed MRT B2C client - openapi-fetch Client with full type safety.
 *
 * @see {@link createMrtB2CClient} for instantiation
 */
export type MrtB2CClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type MrtB2CResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * B2C organization info from MRT.
 */
export type B2COrgInfo = components['schemas']['APIB2COrgInfo'];

/**
 * B2C target info - connection between MRT target and B2C instance.
 */
export type B2CTargetInfo = components['schemas']['APIB2CTargetInfo'];

/**
 * Partial B2C target info for updates.
 */
export type PatchedB2CTargetInfo = components['schemas']['PatchedAPIB2CTargetInfo'];

/**
 * Standard MRT B2C error response structure.
 */
export interface MrtB2CError {
  status: number;
  message: string;
  detail?: string;
}

/**
 * Configuration for creating an MRT B2C client.
 */
export interface MrtB2CClientConfig {
  /**
   * The origin URL for the MRT B2C API.
   * @default "https://cloud.mobify.com/api/cc/b2c"
   * @example "https://cloud.mobify.com/api/cc/b2c"
   */
  origin?: string;

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Default MRT B2C API origin.
 */
export const DEFAULT_MRT_B2C_ORIGIN = 'https://cloud.mobify.com/api/cc/b2c';

/**
 * Creates a typed Managed Runtime B2C Commerce API client.
 *
 * This client handles the B2C Commerce integration endpoints, which manage
 * the connection between MRT targets/environments and B2C Commerce instances.
 *
 * @param config - MRT B2C client configuration
 * @param auth - Authentication strategy (typically ApiKeyStrategy)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create MRT B2C client with API key auth
 * const apiKeyStrategy = new ApiKeyStrategy(apiKey, 'Authorization');
 *
 * const client = createMrtB2CClient({}, apiKeyStrategy);
 *
 * // Get B2C organization info
 * const { data, error } = await client.GET('/b2c-organization-info/{organization_slug}/', {
 *   params: {
 *     path: { organization_slug: 'my-org' }
 *   }
 * });
 *
 * @example
 * // Get B2C target info
 * const { data, error } = await client.GET('/projects/{project_slug}/b2c-target-info/{target_slug}/', {
 *   params: {
 *     path: { project_slug: 'my-project', target_slug: 'staging' }
 *   }
 * });
 *
 * @example
 * // Update B2C target info
 * const { data, error } = await client.PUT('/projects/{project_slug}/b2c-target-info/{target_slug}/', {
 *   params: {
 *     path: { project_slug: 'my-project', target_slug: 'staging' }
 *   },
 *   body: {
 *     instance_id: 'zzxy_prd',
 *     sites: ['RefArch', 'SiteGenesis']
 *   }
 * });
 */
export function createMrtB2CClient(config: MrtB2CClientConfig, auth: AuthStrategy): MrtB2CClient {
  let origin = config.origin || DEFAULT_MRT_B2C_ORIGIN;
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  // Normalize origin: add https:// if no protocol specified
  if (origin && !origin.startsWith('http://') && !origin.startsWith('https://')) {
    origin = `https://${origin}`;
  }

  const client = createClient<paths>({
    baseUrl: origin,
  });

  // Core middleware: auth first
  client.use(createAuthMiddleware(auth));

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('mrt-b2c')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(
    createLoggingMiddleware({
      prefix: 'MRT-B2C',
    }),
  );

  return client;
}
