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
import {createBundle, createBundleV2} from './bundle.js';
import type {CreateBundleOptions, Bundle, BundleV2, CreateBundleV2Options} from './bundle.js';

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

  /**
   * Non-blocking warnings returned by MRT for this push/deploy (e.g. x86 deprecation).
   */
  warnings?: string[];
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
        bundle_metadata: bundle.bundle_metadata,
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
      warnings: buildData.warnings ?? [],
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
        bundle_metadata: bundle.bundle_metadata,
      },
    });

    if (error) {
      throw new Error(`Failed to push bundle: ${JSON.stringify(error)}`);
    }

    const buildData = data as unknown as BuildPushResponse;

    // Return warnings for the caller (e.g. the CLI) to surface — we don't log them
    // here, to avoid double-printing.
    return {
      bundleId: buildData.bundle_id,
      projectSlug,
      deployed: false,
      message: bundle.message,
      warnings: buildData.warnings ?? [],
    };
  }
}

/**
 * Options for pushing a v2-format bundle to MRT.
 */
export interface PushV2Options extends CreateBundleV2Options {
  /**
   * The project slug to upload to.
   */
  projectSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of a v2 push (upload) operation.
 */
export interface PushV2Result {
  /**
   * The bundle ID assigned by MRT.
   */
  bundleId: number;

  /**
   * The project slug the bundle was uploaded to.
   */
  projectSlug: string;

  /**
   * The bundle message.
   */
  message: string;

  /**
   * Non-blocking warnings returned by MRT (e.g. deprecated runtime).
   */
  warnings: string[];

  /**
   * Server-computed ssrOnly/ssrShared file matches.
   */
  matches: Record<string, unknown>;
}

/**
 * Builds a v2-format archive from a build directory and uploads it to MRT.
 *
 * This is upload-only: it does not deploy the bundle. Deploy separately with
 * {@link createDeployment} (or the `b2c mrt bundle deploy <bundleId>` command).
 *
 * @param options - v2 push configuration options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Result of the upload operation
 * @throws Error if the upload fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { pushBundleV2 } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await pushBundleV2({
 *   projectSlug: 'my-storefront',
 *   ssrOnly: ['ssr.js'],
 *   ssrShared: ['static/**\/*'],
 *   buildDirectory: './build',
 *   message: 'Release v1.0.0'
 * }, auth);
 *
 * console.log(`Bundle ${result.bundleId} uploaded to ${result.projectSlug}`);
 * ```
 */
export async function pushBundleV2(options: PushV2Options, auth: AuthStrategy): Promise<PushV2Result> {
  const logger = getLogger();
  const {projectSlug, origin} = options;

  logger.debug({projectSlug}, '[MRT] Pushing v2 bundle');

  const bundle = await createBundleV2(options);
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);
  const result = await uploadBundleV2(client, projectSlug, bundle);

  logger.debug({bundleId: result.bundleId}, '[MRT] v2 bundle uploaded successfully');

  return result;
}

/**
 * Uploads a pre-built v2 bundle archive to MRT as multipart/form-data.
 *
 * Use this if you've already built a v2 bundle with {@link createBundleV2} and
 * want to upload it separately.
 *
 * @param client - MRT client instance
 * @param projectSlug - Project to upload to
 * @param bundle - v2 bundle to upload
 * @returns Result of the upload
 * @throws Error if the upload fails or the response omits a bundle id
 */
export async function uploadBundleV2(client: MrtClient, projectSlug: string, bundle: BundleV2): Promise<PushV2Result> {
  const logger = getLogger();

  logger.debug({projectSlug, rootDir: bundle.rootDir}, '[MRT] Uploading v2 bundle (no deployment)');

  // Build the multipart body. openapi-fetch passes a FormData body through
  // unchanged and lets fetch set the multipart Content-Type + boundary.
  const form = new FormData();
  form.append('bundle', new Blob([bundle.archive]), 'bundle.tar.gz');
  form.append('message', bundle.message);
  form.append('rootDir', bundle.rootDir);
  form.append('configPath', bundle.configPath);
  form.append('matchMode', bundle.matchMode);

  const {data, error, response} = await client.POST('/api/v2/projects/{project_slug}/bundles/', {
    params: {
      path: {
        project_slug: projectSlug,
      },
    },
    // The generated body type describes the multipart fields; we pass a real
    // FormData instance (with the binary archive) instead.
    body: form as unknown as {bundle: string},
  });

  // Capture the status before the error narrowing: the generated types model no
  // error responses for this path, so `response` is narrowed away inside the
  // `if (error)` block.
  const {status} = response;

  if (error) {
    // Include the status code so callers (e.g. the CLI's 403 hint) can react to
    // auth failures even when the error body carries no descriptive text.
    throw new Error(`Failed to push bundle (HTTP ${status}): ${JSON.stringify(error)}`);
  }

  if (!data || data.id === undefined) {
    throw new Error(`v2 bundle upload succeeded but the response omitted a bundle id: ${JSON.stringify(data)}`);
  }

  return {
    bundleId: data.id,
    projectSlug,
    message: bundle.message,
    warnings: data.warnings ?? [],
    matches: data.matches ?? {},
  };
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

/**
 * Options for deleting a single bundle.
 */
export interface DeleteBundleOptions {
  /** The project slug containing the bundle. */
  projectSlug: string;
  /** The bundle ID to delete. */
  bundleId: number;
  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Requests deletion of a single bundle. Bundles are deleted asynchronously.
 * Only project admins can perform this operation.
 *
 * @param options - Delete options
 * @param auth - Authentication strategy
 * @throws Error if the request fails
 */
export async function deleteBundle(options: DeleteBundleOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, bundleId, origin} = options;

  logger.debug({projectSlug, bundleId}, '[MRT] Deleting bundle');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/bundles/{bundle_id}/', {
    params: {
      path: {project_slug: projectSlug, bundle_id: String(bundleId)},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to delete bundle: ${errorMessage}`);
  }

  logger.debug({bundleId}, '[MRT] Bundle queued for deletion');
}

/**
 * Options for bulk-deleting bundles.
 */
export interface BulkDeleteBundlesOptions {
  /** The project slug containing the bundles. */
  projectSlug: string;
  /** Bundle IDs to delete. */
  bundleIds: number[];
  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * A bundle that the server rejected during a bulk-delete request.
 */
export interface BulkDeleteRejectedBundle {
  /** Bundle ID that was rejected. May be null when the server returned a batch error without a specific id. */
  bundleId?: number;
  /** Reason the bundle was rejected. */
  reason: string;
}

/**
 * Result of a bulk-delete request.
 */
export interface BulkDeleteBundlesResult {
  /** Bundle IDs that were queued for asynchronous deletion. */
  queued: number[];
  /** Bundles the server rejected, with reasons. */
  rejected: BulkDeleteRejectedBundle[];
}

/**
 * Requests deletion of multiple bundles in a single call.
 *
 * The response indicates which bundles were queued and which were rejected.
 * Only project admins can perform this operation.
 *
 * @param options - Bulk delete options
 * @param auth - Authentication strategy
 * @returns Lists of queued and rejected bundle IDs
 * @throws Error if the request itself fails
 */
export async function bulkDeleteBundles(
  options: BulkDeleteBundlesOptions,
  auth: AuthStrategy,
): Promise<BulkDeleteBundlesResult> {
  const logger = getLogger();
  const {projectSlug, bundleIds, origin} = options;

  logger.debug({projectSlug, count: bundleIds.length}, '[MRT] Bulk-deleting bundles');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.POST('/api/projects/{project_slug}/bundles/bulk-delete/', {
    params: {
      path: {project_slug: projectSlug},
    },
    body: {bundle_ids: bundleIds},
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to bulk-delete bundles: ${errorMessage}`);
  }

  const rejected: BulkDeleteRejectedBundle[] = (data?.rejected_bundles ?? []).map((entry) => ({
    bundleId: entry.bundle_id,
    reason: entry.errors,
  }));

  return {
    queued: data?.bundles_queued_for_cleanup ?? [],
    rejected,
  };
}
