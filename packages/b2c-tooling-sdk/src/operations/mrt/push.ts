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

    buildData.warnings.forEach((warning: string) => {
      logger.warn(warning);
    });

    return {
      bundleId: buildData.bundle_id,
      projectSlug,
      deployed: false,
      message: bundle.message,
    };
  }
}

/**
 * Bundle list item from API.
 */
export type MrtBundle = components['schemas']['BundleList'];

/**
 * Options for listing bundles.
 */
export interface ListBundlesOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

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
 * Result of listing bundles.
 */
export interface ListBundlesResult {
  /**
   * Total count of bundles.
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
   * Array of bundles.
   */
  bundles: MrtBundle[];
}

/**
 * Lists bundles for an MRT project.
 *
 * @param options - List options including project slug
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of bundles
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listBundles } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listBundles({
 *   projectSlug: 'my-storefront'
 * }, auth);
 *
 * for (const bundle of result.bundles) {
 *   console.log(`Bundle ${bundle.id}: ${bundle.message}`);
 * }
 * ```
 */
export async function listBundles(options: ListBundlesOptions, auth: AuthStrategy): Promise<ListBundlesResult> {
  const logger = getLogger();
  const {projectSlug, limit, offset, origin} = options;

  logger.debug({projectSlug}, '[MRT] Listing bundles');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/bundles/', {
    params: {
      path: {project_slug: projectSlug},
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
    throw new Error(`Failed to list bundles: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Bundles listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    bundles: data.results ?? [],
  };
}

/**
 * Options for downloading a bundle.
 */
export interface DownloadBundleOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * The bundle ID to download.
   */
  bundleId: number;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of getting a bundle download URL.
 */
export interface DownloadBundleResult {
  /**
   * Presigned URL for downloading the bundle archive.
   * Valid for one hour.
   */
  downloadUrl: string;
}

/**
 * Gets a presigned URL to download a bundle archive.
 *
 * The returned URL is valid for one hour.
 *
 * @param options - Download options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Download URL result
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { downloadBundle } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await downloadBundle({
 *   projectSlug: 'my-storefront',
 *   bundleId: 12345
 * }, auth);
 *
 * console.log(`Download URL: ${result.downloadUrl}`);
 * ```
 */
export async function downloadBundle(
  options: DownloadBundleOptions,
  auth: AuthStrategy,
): Promise<DownloadBundleResult> {
  const logger = getLogger();
  const {projectSlug, bundleId, origin} = options;

  logger.debug({projectSlug, bundleId}, '[MRT] Getting bundle download URL');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/bundles/{bundle_id}/download/', {
    params: {
      path: {project_slug: projectSlug, bundle_id: String(bundleId)},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get bundle download URL: ${errorMessage}`);
  }

  logger.debug({bundleId}, '[MRT] Bundle download URL retrieved');

  return {
    downloadUrl: data.download_url,
  };
}
