/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Redirect operations for Managed Runtime.
 *
 * Handles listing, creating, updating, and deleting redirects for MRT environments.
 *
 * @module operations/mrt/redirect
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Redirect type from API.
 */
export type MrtRedirect = components['schemas']['APIRedirectV2CreateUpdate'];

/**
 * Patched redirect for updates.
 */
export type PatchedMrtRedirect = components['schemas']['PatchedAPIRedirectV2CreateUpdate'];

/**
 * HTTP status code for redirects (301 or 302).
 */
export type RedirectHttpStatusCode = 301 | 302;

/**
 * Options for listing redirects.
 */
export interface ListRedirectsOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * Maximum number of results to return.
   */
  limit?: number;

  /**
   * Offset for pagination.
   */
  offset?: number;

  /**
   * Search term for filtering.
   */
  search?: string;

  /**
   * Field to order results by.
   */
  ordering?: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of listing redirects.
 */
export interface ListRedirectsResult {
  /**
   * Total count of redirects.
   */
  count: number;

  /**
   * URL for next page of results.
   */
  next: string | null;

  /**
   * URL for previous page of results.
   */
  previous: string | null;

  /**
   * Array of redirects.
   */
  redirects: MrtRedirect[];
}

/**
 * Lists redirects for an MRT environment.
 *
 * @param options - List options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of redirects
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listRedirects } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listRedirects({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'staging'
 * }, auth);
 *
 * for (const redirect of result.redirects) {
 *   console.log(`${redirect.from_path} -> ${redirect.to_url}`);
 * }
 * ```
 */
export async function listRedirects(options: ListRedirectsOptions, auth: AuthStrategy): Promise<ListRedirectsResult> {
  const logger = getLogger();
  const {projectSlug, targetSlug, limit, offset, search, ordering, origin} = options;

  logger.debug({projectSlug, targetSlug}, '[MRT] Listing redirects');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/target/{target_slug}/redirect/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug},
      query: {
        limit,
        offset,
        search,
        ordering,
      },
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to list redirects: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Redirects listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    redirects: data.results ?? [],
  };
}

/**
 * Options for creating a redirect.
 */
export interface CreateRedirectOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The source path to redirect from.
   */
  fromPath: string;

  /**
   * The destination URL to redirect to.
   */
  toUrl: string;

  /**
   * HTTP status code (301 or 302).
   * @default 301
   */
  httpStatusCode?: RedirectHttpStatusCode;

  /**
   * Forward query string parameters.
   */
  forwardQuerystring?: boolean;

  /**
   * Forward wildcard path.
   */
  forwardWildcard?: boolean;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Creates a redirect for an MRT environment.
 *
 * @param options - Create redirect options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The created redirect
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createRedirect } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const redirect = await createRedirect({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'staging',
 *   fromPath: '/old-page',
 *   toUrl: '/new-page',
 *   httpStatusCode: 301
 * }, auth);
 * ```
 */
export async function createRedirect(options: CreateRedirectOptions, auth: AuthStrategy): Promise<MrtRedirect> {
  const logger = getLogger();
  const {projectSlug, targetSlug, fromPath, toUrl, httpStatusCode, forwardQuerystring, forwardWildcard, origin} =
    options;

  logger.debug({projectSlug, targetSlug, fromPath, toUrl}, '[MRT] Creating redirect');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: MrtRedirect = {
    from_path: fromPath,
    to_url: toUrl,
    http_status_code: httpStatusCode,
    forward_querystring: forwardQuerystring,
    forward_wildcard: forwardWildcard,
  };

  const {data, error} = await client.POST('/api/projects/{project_slug}/target/{target_slug}/redirect/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug},
    },
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to create redirect: ${errorMessage}`);
  }

  logger.debug({fromPath}, '[MRT] Redirect created');

  return data;
}

/**
 * Options for getting a redirect.
 */
export interface GetRedirectOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The from_path of the redirect.
   */
  fromPath: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets a redirect from an MRT environment.
 *
 * @param options - Get redirect options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The redirect
 * @throws Error if request fails
 */
export async function getRedirect(options: GetRedirectOptions, auth: AuthStrategy): Promise<MrtRedirect> {
  const logger = getLogger();
  const {projectSlug, targetSlug, fromPath, origin} = options;

  logger.debug({projectSlug, targetSlug, fromPath}, '[MRT] Getting redirect');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/target/{target_slug}/redirect/{from_path}', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug, from_path: fromPath},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get redirect: ${errorMessage}`);
  }

  logger.debug({fromPath}, '[MRT] Redirect retrieved');

  return data;
}

/**
 * Options for updating a redirect.
 */
export interface UpdateRedirectOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The from_path of the redirect to update.
   */
  fromPath: string;

  /**
   * New destination URL.
   */
  toUrl?: string;

  /**
   * HTTP status code (301 or 302).
   */
  httpStatusCode?: RedirectHttpStatusCode;

  /**
   * Forward query string parameters.
   */
  forwardQuerystring?: boolean;

  /**
   * Forward wildcard path.
   */
  forwardWildcard?: boolean;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Updates a redirect in an MRT environment.
 *
 * @param options - Update redirect options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The updated redirect
 * @throws Error if request fails
 */
export async function updateRedirect(options: UpdateRedirectOptions, auth: AuthStrategy): Promise<MrtRedirect> {
  const logger = getLogger();
  const {projectSlug, targetSlug, fromPath, toUrl, httpStatusCode, forwardQuerystring, forwardWildcard, origin} =
    options;

  logger.debug({projectSlug, targetSlug, fromPath}, '[MRT] Updating redirect');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: PatchedMrtRedirect = {};

  if (toUrl !== undefined) {
    body.to_url = toUrl;
  }
  if (httpStatusCode !== undefined) {
    body.http_status_code = httpStatusCode;
  }
  if (forwardQuerystring !== undefined) {
    body.forward_querystring = forwardQuerystring;
  }
  if (forwardWildcard !== undefined) {
    body.forward_wildcard = forwardWildcard;
  }

  const {data, error} = await client.PATCH('/api/projects/{project_slug}/target/{target_slug}/redirect/{from_path}', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug, from_path: fromPath},
    },
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to update redirect: ${errorMessage}`);
  }

  logger.debug({fromPath}, '[MRT] Redirect updated');

  return data;
}

/**
 * Options for deleting a redirect.
 */
export interface DeleteRedirectOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The from_path of the redirect to delete.
   */
  fromPath: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Deletes a redirect from an MRT environment.
 *
 * @param options - Delete redirect options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if request fails
 */
export async function deleteRedirect(options: DeleteRedirectOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, targetSlug, fromPath, origin} = options;

  logger.debug({projectSlug, targetSlug, fromPath}, '[MRT] Deleting redirect');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/target/{target_slug}/redirect/{from_path}', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug, from_path: fromPath},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to delete redirect: ${errorMessage}`);
  }

  logger.debug({fromPath}, '[MRT] Redirect deleted');
}

/**
 * Options for cloning redirects.
 */
export interface CloneRedirectsOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The source target/environment slug to clone from.
   */
  fromTargetSlug: string;

  /**
   * The destination target/environment slug to clone to.
   */
  toTargetSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of cloning redirects.
 */
export interface CloneRedirectsResult {
  /**
   * Number of redirects cloned.
   */
  count: number;

  /**
   * The cloned redirects.
   */
  redirects: MrtRedirect[];
}

/**
 * Clones redirects from one target to another.
 *
 * Important: When you clone redirects, you're replacing all redirects
 * in the destination target with all redirects from the source target.
 *
 * @param options - Clone redirects options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Result with cloned redirects
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { cloneRedirects } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await cloneRedirects({
 *   projectSlug: 'my-storefront',
 *   fromTargetSlug: 'staging',
 *   toTargetSlug: 'production'
 * }, auth);
 *
 * console.log(`Cloned ${result.count} redirects`);
 * ```
 */
export async function cloneRedirects(
  options: CloneRedirectsOptions,
  auth: AuthStrategy,
): Promise<CloneRedirectsResult> {
  const logger = getLogger();
  const {projectSlug, fromTargetSlug, toTargetSlug, origin} = options;

  logger.debug({projectSlug, fromTargetSlug, toTargetSlug}, '[MRT] Cloning redirects');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.POST('/api/projects/{project_slug}/target/{to_target_slug}/redirect/clone/', {
    params: {
      path: {project_slug: projectSlug, to_target_slug: toTargetSlug},
    },
    body: {
      from_target_slug: fromTargetSlug,
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to clone redirects: ${errorMessage}`);
  }

  // The clone API may return a paginated response or just confirmation
  const responseData = data as {count?: number; results?: MrtRedirect[]};

  logger.debug({count: responseData.count}, '[MRT] Redirects cloned');

  return {
    count: responseData.count ?? 0,
    redirects: responseData.results ?? [],
  };
}
