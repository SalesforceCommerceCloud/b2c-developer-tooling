/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Push operations for Managed Runtime.
 *
 * Handles uploading bundles to MRT projects and optionally deploying them.
 *
 * @module operations/mrt/push
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {MrtClient, BuildPushResponse, components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';
import {createBundle} from './bundle.js';
import type {CreateBundleOptions, Bundle} from './bundle.js';

/**
 * Options for pushing a bundle to MRT.
 */
export interface PushOptions extends CreateBundleOptions {
  /**
   * Target environment to deploy to after push.
   * If not provided, bundle is uploaded but not deployed.
   */
  target?: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of a push operation.
 */
export interface PushResult {
  /**
   * The bundle ID assigned by MRT.
   */
  bundleId: number;

  /**
   * The project slug the bundle was pushed to.
   */
  projectSlug: string;

  /**
   * The target environment if deployed.
   */
  target?: string;

  /**
   * Whether the bundle was deployed to the target.
   */
  deployed: boolean;

  /**
   * The bundle message.
   */
  message: string;
}

/**
 * Pushes a bundle to a Managed Runtime project.
 *
 * This function creates a bundle from the build directory and uploads it
 * to the specified MRT project. Optionally, it can also deploy the bundle
 * to a target environment.
 *
 * @param options - Push configuration options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Result of the push operation
 * @throws Error if push fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { pushBundle } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await pushBundle({
 *   projectSlug: 'my-storefront',
 *   ssrOnly: ['ssr.js'],
 *   ssrShared: ['**\/*.js', 'static/**\/*'],
 *   buildDirectory: './build',
 *   message: 'Release v1.0.0',
 *   target: 'staging'  // Optional: deploy after push
 * }, auth);
 *
 * console.log(`Bundle ${result.bundleId} pushed to ${result.projectSlug}`);
 * if (result.deployed) {
 *   console.log(`Deployed to ${result.target}`);
 * }
 * ```
 */
export async function pushBundle(options: PushOptions, auth: AuthStrategy): Promise<PushResult> {
  const logger = getLogger();
  const {projectSlug, target, origin} = options;

  logger.debug({projectSlug, target}, '[MRT] Pushing bundle');

  // Create the bundle
  const bundle = await createBundle(options);

  // Create MRT client
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  // Upload the bundle
  const result = await uploadBundle(client, projectSlug, bundle, target);

  logger.debug({bundleId: result.bundleId, deployed: result.deployed}, '[MRT] Bundle pushed successfully');

  return result;
}

/**
 * Uploads a pre-created bundle to MRT.
 *
 * Use this if you've already created a bundle and want to upload it separately.
 *
 * @param client - MRT client instance
 * @param projectSlug - Project to upload to
 * @param bundle - Bundle to upload
 * @param target - Optional target to deploy to
 * @returns Result of the upload
 */
export async function uploadBundle(
  client: MrtClient,
  projectSlug: string,
  bundle: Bundle,
  target?: string,
): Promise<PushResult> {
  const logger = getLogger();

  // Choose endpoint based on whether we're deploying
  if (target) {
    logger.debug({projectSlug, target}, '[MRT] Uploading and deploying bundle');

    const {data, error} = await client.POST('/api/projects/{project_slug}/builds/{target_slug}/', {
      params: {
        path: {
          project_slug: projectSlug,
          target_slug: target,
        },
      },
      body: {
        message: bundle.message,
        encoding: bundle.encoding,
        data: bundle.data,
        ssr_parameters: bundle.ssr_parameters,
        ssr_only: bundle.ssr_only,
        ssr_shared: bundle.ssr_shared,
      },
    });

    if (error) {
      throw new Error(`Failed to push bundle: ${JSON.stringify(error)}`);
    }

    const buildData = data as unknown as BuildPushResponse;

    return {
      bundleId: buildData.bundle_id,
      projectSlug,
      target,
      deployed: true,
      message: bundle.message,
    };
  } else {
    logger.debug({projectSlug}, '[MRT] Uploading bundle (no deployment)');

    const {data, error} = await client.POST('/api/projects/{project_slug}/builds/', {
      params: {
        path: {
          project_slug: projectSlug,
        },
      },
      body: {
        message: bundle.message,
        encoding: bundle.encoding,
        data: bundle.data,
        ssr_parameters: bundle.ssr_parameters,
        ssr_only: bundle.ssr_only,
        ssr_shared: bundle.ssr_shared,
      },
    });

    if (error) {
      throw new Error(`Failed to push bundle: ${JSON.stringify(error)}`);
    }

    const buildData = data as unknown as BuildPushResponse;

    return {
      bundleId: buildData.bundle_id,
      projectSlug,
      deployed: false,
      message: bundle.message,
    };
  }
}

/**
 * Gets the list of bundles for a project.
 *
 * @param client - MRT client instance
 * @param projectSlug - Project to list bundles for
 * @param options - Pagination options
 * @returns List of bundles
 */
export async function listBundles(
  client: MrtClient,
  projectSlug: string,
  options?: {limit?: number; offset?: number},
): Promise<components['schemas']['BundleList'][]> {
  const logger = getLogger();

  logger.debug({projectSlug}, '[MRT] Listing bundles');

  const {data, error} = await client.GET('/api/projects/{project_slug}/bundles/', {
    params: {
      path: {project_slug: projectSlug},
      query: {
        limit: options?.limit,
        offset: options?.offset,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to list bundles: ${JSON.stringify(error)}`);
  }

  return data?.results || [];
}
