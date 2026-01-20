/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Cache operations for Managed Runtime.
 *
 * Handles cache invalidation for MRT environments.
 *
 * @module operations/mrt/cache
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Options for invalidating cache.
 */
export interface InvalidateCacheOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * Path pattern to invalidate on the CDN.
   * Must start with a forward slash (/).
   * Use /* to invalidate all cached paths.
   */
  pattern: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of cache invalidation.
 */
export interface InvalidateCacheResult {
  /**
   * Status message.
   */
  result: string;

  /**
   * Target slug.
   */
  slug: string;
}

/**
 * Invalidates cached objects in the CDN for an MRT environment.
 *
 * Cache invalidations are asynchronous and usually complete within two minutes.
 *
 * @param options - Invalidation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Invalidation result
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { invalidateCache } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * // Invalidate all cached paths
 * const result = await invalidateCache({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'production',
 *   pattern: '/*'
 * }, auth);
 *
 * console.log(result.result);
 *
 * // Invalidate specific path
 * const result2 = await invalidateCache({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'production',
 *   pattern: '/products/*'
 * }, auth);
 * ```
 */
export async function invalidateCache(
  options: InvalidateCacheOptions,
  auth: AuthStrategy,
): Promise<InvalidateCacheResult> {
  const logger = getLogger();
  const {projectSlug, targetSlug, pattern, origin} = options;

  logger.debug({projectSlug, targetSlug, pattern}, '[MRT] Invalidating cache');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.POST('/api/projects/{project_slug}/target/{target_slug}/invalidation/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug},
    },
    body: {
      pattern,
      items: null, // Deprecated but required by schema
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to invalidate cache: ${errorMessage}`);
  }

  // Response has different fields than request schema indicates
  const response = data as unknown as {result?: string; slug?: string};

  logger.debug({pattern}, '[MRT] Cache invalidation started');

  return {
    result: response.result ?? 'Cache invalidation is in progress.',
    slug: response.slug ?? targetSlug,
  };
}
