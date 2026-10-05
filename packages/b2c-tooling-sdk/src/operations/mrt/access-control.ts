/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Access control header operations for Managed Runtime.
 *
 * Handles listing, creating, and deleting access control headers.
 *
 * @module operations/mrt/access-control
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Access control header type from API.
 */
export type MrtAccessControlHeader = components['schemas']['APIAccessControlHeaderV2Create'];

/**
 * Options for listing access control headers.
 */
export interface ListAccessControlHeadersOptions {
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
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of listing access control headers.
 */
export interface ListAccessControlHeadersResult {
  /**
   * Total count of headers.
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
   * Array of access control headers.
   */
  headers: MrtAccessControlHeader[];
}

/**
 * Lists access control headers for an MRT environment.
 *
 * @param options - List options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of headers
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listAccessControlHeaders } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listAccessControlHeaders({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'production'
 * }, auth);
 *
 * console.log(`Found ${result.count} access control headers`);
 * ```
 */
export async function listAccessControlHeaders(
  options: ListAccessControlHeadersOptions,
  auth: AuthStrategy,
): Promise<ListAccessControlHeadersResult> {
  const logger = getLogger();
  const {projectSlug, targetSlug, limit, offset, origin} = options;

  logger.debug({projectSlug, targetSlug}, '[MRT] Listing access control headers');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/target/{target_slug}/access-control-header/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug},
      query: {
        limit,
        offset,
      },
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to list access control headers: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Access control headers listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    headers: data.results ?? [],
  };
}

/**
 * Options for creating an access control header.
 */
export interface CreateAccessControlHeaderOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The header value.
   */
  value: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Creates an access control header for an MRT environment.
 *
 * @param options - Create options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The created header
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createAccessControlHeader } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const header = await createAccessControlHeader({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'production',
 *   value: 'my-secret-header-value'
 * }, auth);
 *
 * console.log(`Created access control header: ${header.id}`);
 * ```
 */
export async function createAccessControlHeader(
  options: CreateAccessControlHeaderOptions,
  auth: AuthStrategy,
): Promise<MrtAccessControlHeader> {
  const logger = getLogger();
  const {projectSlug, targetSlug, value, origin} = options;

  logger.debug({projectSlug, targetSlug}, '[MRT] Creating access control header');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.POST('/api/projects/{project_slug}/target/{target_slug}/access-control-header/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug},
    },
    body: {
      value,
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to create access control header: ${errorMessage}`);
  }

  logger.debug({id: data.id}, '[MRT] Access control header created');

  return data;
}

/**
 * Options for getting an access control header.
 */
export interface GetAccessControlHeaderOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The header ID.
   */
  headerId: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets an access control header from an MRT environment.
 *
 * @param options - Get options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The header
 * @throws Error if request fails
 */
export async function getAccessControlHeader(
  options: GetAccessControlHeaderOptions,
  auth: AuthStrategy,
): Promise<MrtAccessControlHeader> {
  const logger = getLogger();
  const {projectSlug, targetSlug, headerId, origin} = options;

  logger.debug({projectSlug, targetSlug, headerId}, '[MRT] Getting access control header');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET(
    '/api/projects/{project_slug}/target/{target_slug}/access-control-header/{id}/',
    {
      params: {
        path: {project_slug: projectSlug, target_slug: targetSlug, id: headerId},
      },
    },
  );

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get access control header: ${errorMessage}`);
  }

  logger.debug({id: data.id}, '[MRT] Access control header retrieved');

  return data;
}

/**
 * Options for deleting an access control header.
 */
export interface DeleteAccessControlHeaderOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The header ID.
   */
  headerId: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Deletes an access control header from an MRT environment.
 *
 * @param options - Delete options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if request fails
 */
export async function deleteAccessControlHeader(
  options: DeleteAccessControlHeaderOptions,
  auth: AuthStrategy,
): Promise<void> {
  const logger = getLogger();
  const {projectSlug, targetSlug, headerId, origin} = options;

  logger.debug({projectSlug, targetSlug, headerId}, '[MRT] Deleting access control header');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/target/{target_slug}/access-control-header/{id}/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug, id: headerId},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to delete access control header: ${errorMessage}`);
  }

  logger.debug({headerId}, '[MRT] Access control header deleted');
}
