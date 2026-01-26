/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * B2C Commerce configuration operations for Managed Runtime.
 *
 * Handles the connection between MRT targets/environments and B2C Commerce instances.
 *
 * @module operations/mrt/b2c-config
 */
import type {AuthStrategy} from '../../auth/types.js';
import {
  createMrtB2CClient,
  DEFAULT_MRT_B2C_ORIGIN,
  type B2COrgInfo,
  type B2CTargetInfo,
  type PatchedB2CTargetInfo,
} from '../../clients/mrt-b2c.js';
import {getLogger} from '../../logging/logger.js';

// Re-export types
export type {B2COrgInfo, B2CTargetInfo, PatchedB2CTargetInfo};

/**
 * Options for getting B2C organization info.
 */
export interface GetB2COrgInfoOptions {
  /**
   * The organization slug.
   */
  organizationSlug: string;

  /**
   * MRT B2C API origin URL.
   * @default "https://cloud.mobify.com/api/cc/b2c"
   */
  origin?: string;
}

/**
 * Options for getting B2C target info.
 */
export interface GetB2CTargetInfoOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * MRT B2C API origin URL.
   * @default "https://cloud.mobify.com/api/cc/b2c"
   */
  origin?: string;
}

/**
 * Options for setting B2C target info.
 */
export interface SetB2CTargetInfoOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * ID of the B2C Commerce instance to connect.
   */
  instanceId: string;

  /**
   * List of site IDs associated with the B2C Commerce instance.
   * Pass null to clear the sites list.
   */
  sites?: string[] | null;

  /**
   * MRT B2C API origin URL.
   * @default "https://cloud.mobify.com/api/cc/b2c"
   */
  origin?: string;
}

/**
 * Options for updating B2C target info.
 */
export interface UpdateB2CTargetInfoOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The target/environment slug.
   */
  targetSlug: string;

  /**
   * ID of the B2C Commerce instance to connect.
   */
  instanceId?: string;

  /**
   * List of site IDs associated with the B2C Commerce instance.
   * Pass null to clear the sites list.
   */
  sites?: string[] | null;

  /**
   * MRT B2C API origin URL.
   * @default "https://cloud.mobify.com/api/cc/b2c"
   */
  origin?: string;
}

/**
 * Gets B2C Commerce info for an organization.
 *
 * Returns the list of B2C Commerce instances connected to the organization.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns B2C organization info
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getB2COrgInfo } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const info = await getB2COrgInfo({
 *   organizationSlug: 'my-org'
 * }, auth);
 *
 * console.log(`B2C Customer: ${info.is_b2c_customer}`);
 * console.log(`Instances: ${info.instances.join(', ')}`);
 * ```
 */
export async function getB2COrgInfo(options: GetB2COrgInfoOptions, auth: AuthStrategy): Promise<B2COrgInfo> {
  const logger = getLogger();
  const {organizationSlug, origin} = options;

  logger.debug({organizationSlug}, '[MRT-B2C] Getting B2C organization info');

  const client = createMrtB2CClient({origin: origin || DEFAULT_MRT_B2C_ORIGIN}, auth);

  const {data, error} = await client.GET('/b2c-organization-info/{organization_slug}/', {
    params: {
      path: {organization_slug: organizationSlug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get B2C organization info: ${errorMessage}`);
  }

  logger.debug({isB2cCustomer: data.is_b2c_customer}, '[MRT-B2C] B2C organization info retrieved');

  return data;
}

/**
 * Gets B2C Commerce info for a target/environment.
 *
 * Returns the B2C Commerce instance and sites connected to the target.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns B2C target info
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getB2CTargetInfo } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const info = await getB2CTargetInfo({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'production'
 * }, auth);
 *
 * console.log(`Instance: ${info.instance_id}`);
 * console.log(`Sites: ${info.sites?.join(', ')}`);
 * ```
 */
export async function getB2CTargetInfo(options: GetB2CTargetInfoOptions, auth: AuthStrategy): Promise<B2CTargetInfo> {
  const logger = getLogger();
  const {projectSlug, targetSlug, origin} = options;

  logger.debug({projectSlug, targetSlug}, '[MRT-B2C] Getting B2C target info');

  const client = createMrtB2CClient({origin: origin || DEFAULT_MRT_B2C_ORIGIN}, auth);

  const {data, error} = await client.GET('/projects/{project_slug}/b2c-target-info/{target_slug}/', {
    params: {
      path: {project_slug: projectSlug, target_slug: targetSlug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get B2C target info: ${errorMessage}`);
  }

  logger.debug({instanceId: data.instance_id}, '[MRT-B2C] B2C target info retrieved');

  return data;
}

/**
 * Sets (creates/replaces) B2C Commerce info for a target/environment.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Updated B2C target info
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { setB2CTargetInfo } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const info = await setB2CTargetInfo({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'production',
 *   instanceId: 'aaaa_prd',
 *   sites: ['RefArch', 'SiteGenesis']
 * }, auth);
 *
 * console.log(`Connected to instance: ${info.instance_id}`);
 * ```
 */
export async function setB2CTargetInfo(options: SetB2CTargetInfoOptions, auth: AuthStrategy): Promise<B2CTargetInfo> {
  const logger = getLogger();
  const {projectSlug, targetSlug, instanceId, sites, origin} = options;

  logger.debug({projectSlug, targetSlug, instanceId}, '[MRT-B2C] Setting B2C target info');

  const client = createMrtB2CClient({origin: origin || DEFAULT_MRT_B2C_ORIGIN}, auth);

  const body: B2CTargetInfo = {
    instance_id: instanceId,
  };

  if (sites !== undefined) {
    body.sites = sites;
  }

  const {data, error} = await client.PUT('/projects/{project_slug}/b2c-target-info/{target_slug}/', {
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
    throw new Error(`Failed to set B2C target info: ${errorMessage}`);
  }

  logger.debug({instanceId: data.instance_id}, '[MRT-B2C] B2C target info set');

  return data;
}

/**
 * Updates B2C Commerce info for a target/environment.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Updated B2C target info
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { updateB2CTargetInfo } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * // Update only the sites list
 * const info = await updateB2CTargetInfo({
 *   projectSlug: 'my-storefront',
 *   targetSlug: 'production',
 *   sites: ['RefArch', 'SiteGenesis', 'NewSite']
 * }, auth);
 *
 * console.log(`Updated sites: ${info.sites?.join(', ')}`);
 * ```
 */
export async function updateB2CTargetInfo(
  options: UpdateB2CTargetInfoOptions,
  auth: AuthStrategy,
): Promise<B2CTargetInfo> {
  const logger = getLogger();
  const {projectSlug, targetSlug, instanceId, sites, origin} = options;

  logger.debug({projectSlug, targetSlug, instanceId}, '[MRT-B2C] Updating B2C target info');

  const client = createMrtB2CClient({origin: origin || DEFAULT_MRT_B2C_ORIGIN}, auth);

  const body: PatchedB2CTargetInfo = {};

  if (instanceId !== undefined) {
    body.instance_id = instanceId;
  }

  if (sites !== undefined) {
    body.sites = sites;
  }

  const {data, error} = await client.PATCH('/projects/{project_slug}/b2c-target-info/{target_slug}/', {
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
    throw new Error(`Failed to update B2C target info: ${errorMessage}`);
  }

  logger.debug({instanceId: data.instance_id}, '[MRT-B2C] B2C target info updated');

  return data;
}
