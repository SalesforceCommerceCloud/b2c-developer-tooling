/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Organization operations for Managed Runtime.
 *
 * Handles listing and retrieving MRT organizations.
 *
 * @module operations/mrt/organization
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * MRT organization type from API.
 */
export type MrtOrganization = components['schemas']['APIOrganization'];

/**
 * Organization limits from API.
 */
export type OrganizationLimits = components['schemas']['OrganizationLimits'];

/**
 * Options for listing MRT organizations.
 */
export interface ListOrganizationsOptions {
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
 * Result of listing organizations.
 */
export interface ListOrganizationsResult {
  /**
   * Total count of organizations.
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
   * Array of organizations.
   */
  organizations: MrtOrganization[];
}

/**
 * Lists organizations accessible to the authenticated user.
 *
 * @param options - List options including pagination
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of organizations
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listOrganizations } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listOrganizations({}, auth);
 * console.log(`Found ${result.count} organizations`);
 *
 * for (const org of result.organizations) {
 *   console.log(`- ${org.name} (${org.slug})`);
 * }
 * ```
 */
export async function listOrganizations(
  options: ListOrganizationsOptions,
  auth: AuthStrategy,
): Promise<ListOrganizationsResult> {
  const logger = getLogger();
  const {limit, offset, origin} = options;

  logger.debug({limit, offset}, '[MRT] Listing organizations');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/organizations/', {
    params: {
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
    throw new Error(`Failed to list organizations: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Organizations listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    organizations: data.results ?? [],
  };
}
