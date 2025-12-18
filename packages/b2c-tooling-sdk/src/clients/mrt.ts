/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Managed Runtime (MRT) API client for B2C Commerce.
 *
 * Provides a fully typed client for Managed Runtime API operations using
 * openapi-fetch with API key authentication middleware. Used for
 * managing deployments, bundles, projects, and environments.
 *
 * @module clients/mrt
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './mrt.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed MRT client - this is the openapi-fetch Client with full type safety.
 *
 * @see {@link createMrtClient} for instantiation
 */
export type MrtClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type MrtResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Standard MRT error response structure.
 */
export interface MrtError {
  status: number;
  message: string;
  detail?: string;
}

/**
 * Response from pushing a bundle to MRT.
 *
 * Note: The OpenAPI spec doesn't properly define this response type,
 * so we define it based on the actual API response.
 */
export interface BuildPushResponse {
  /** The bundle ID assigned by MRT */
  bundle_id: number;
  /** Success message from the API */
  message: string;
  /** URL to view the bundle in the MRT dashboard */
  url: string;
  /** Preview URL for the bundle (if available) */
  bundle_preview_url: string | null;
  /** Any warnings from the push operation */
  warnings: string[];
}

/**
 * Configuration for creating an MRT client.
 */
export interface MrtClientConfig {
  /**
   * The origin URL for the MRT API.
   * @default "https://cloud.mobify.com"
   * @example "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Default MRT API origin.
 */
export const DEFAULT_MRT_ORIGIN = 'https://cloud.mobify.com';

/**
 * Creates a typed Managed Runtime API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * @param config - MRT client configuration
 * @param auth - Authentication strategy (typically ApiKeyStrategy)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create MRT client with API key auth
 * const apiKeyStrategy = new ApiKeyStrategy(apiKey, 'Authorization');
 *
 * const client = createMrtClient({}, apiKeyStrategy);
 *
 * // Push a bundle to a project
 * const { data, error } = await client.POST('/api/projects/{projectSlug}/builds/', {
 *   params: {
 *     path: { projectSlug: 'my-project' }
 *   },
 *   body: {
 *     message: 'My bundle',
 *     encoding: 'base64',
 *     data: bundleData,
 *     ssr_parameters: {},
 *     ssr_only: ['ssr.js'],
 *     ssr_shared: ['shared.js']
 *   }
 * });
 *
 * @example
 * // List all projects
 * const { data, error } = await client.GET('/api/projects/', {});
 *
 * @example
 * // Get a specific target/environment
 * const { data, error } = await client.GET('/api/projects/{projectSlug}/target/{targetId}/', {
 *   params: { path: { projectSlug: 'my-project', targetId: 'staging' } }
 * });
 */
export function createMrtClient(config: MrtClientConfig, auth: AuthStrategy): MrtClient {
  let origin = config.origin || DEFAULT_MRT_ORIGIN;

  // Normalize origin: add https:// if no protocol specified
  if (origin && !origin.startsWith('http://') && !origin.startsWith('https://')) {
    origin = `https://${origin}`;
  }

  const client = createClient<paths>({
    baseUrl: origin,
  });

  // Middleware order: auth → logging (logging sees fully modified request)
  client.use(createAuthMiddleware(auth));
  client.use(
    createLoggingMiddleware({
      prefix: 'MRT',
      // Mask large base64-encoded bundle data in logs
      maskBodyKeys: ['data'],
    }),
  );

  return client;
}
