/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Deployment operations for Managed Runtime.
 *
 * Handles listing and creating deployments for MRT environments.
 *
 * @module operations/mrt/deployment
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Deployment list item from API.
 */
export type MrtDeployment = components['schemas']['DeployList'];

/**
 * Deployment creation request.
 */
export type MrtDeploymentCreate = components['schemas']['DeployCreate'];

/**
 * Options for listing MRT deployments.
 */
export interface ListDeploymentsOptions {
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
 * Result of listing deployments.
 */
export interface ListDeploymentsResult {
  /**
   * Total count of deployments.
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
   * Array of deployments.
   */
  deployments: MrtDeployment[];
}

/**
 * Lists deployment history for an MRT environment.
 *
 * @param options - List options including project and target slugs
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of deployments
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listDeployments } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listDeployments({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'staging'
 * }, auth);
 *
 * for (const deploy of result.deployments) {
 *   console.log(`Bundle ${deploy.bundle_id}: ${deploy.status}`);
 * }
 * ```
 */
export async function listDeployments(
  options: ListDeploymentsOptions,
  auth: AuthStrategy,
): Promise<ListDeploymentsResult> {
  const logger = getLogger();
  const {projectSlug, targetSlug, limit, offset, origin} = options;

  logger.debug({projectSlug, targetSlug}, '[MRT] Listing deployments');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/target/{target_slug}/deploy/', {
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
    throw new Error(`Failed to list deployments: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Deployments listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    deployments: data.results ?? [],
  };
}

/**
 * Options for creating a deployment.
 */
export interface CreateDeploymentOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * The bundle ID to deploy.
   */
  bundleId: number;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Deployment creation response.
 */
export interface CreateDeploymentResult {
  /**
   * The bundle ID being deployed.
   */
  bundleId: number;

  /**
   * The target slug.
   */
  targetSlug: string;

  /**
   * Initial deployment status.
   */
  status: string;
}

/**
 * Deploys a bundle to an MRT environment.
 *
 * This endpoint is asynchronous - the deployment will happen in the background.
 * Request the target for progress updates.
 *
 * @param options - Deployment options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Initial deployment status
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createDeployment } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await createDeployment({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'staging',
 *   bundleId: 12345
 * }, auth);
 *
 * console.log(`Deployment started: ${result.status}`);
 * ```
 */
export async function createDeployment(
  options: CreateDeploymentOptions,
  auth: AuthStrategy,
): Promise<CreateDeploymentResult> {
  const logger = getLogger();
  const {projectSlug, targetSlug, bundleId, origin} = options;

  logger.debug({projectSlug, targetSlug, bundleId}, '[MRT] Creating deployment');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.POST('/api/projects/{project_slug}/target/{target_slug}/deploy/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug},
    },
    body: {
      bundle_id: bundleId,
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to create deployment: ${errorMessage}`);
  }

  logger.debug({bundleId}, '[MRT] Deployment created');

  return {
    bundleId,
    targetSlug,
    status: 'pending',
  };
}
