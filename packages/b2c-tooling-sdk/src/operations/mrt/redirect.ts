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
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import {
  createStorefrontEnvironmentsClient,
  toOrganizationId,
  type StorefrontEnvironmentsClient,
  type RedirectEntry,
} from '../../clients/storefront-environments.js';
import {getLogger} from '../../logging/logger.js';
import {
  runMrtWithFallback,
  type MrtBackend,
  type MrtBackendPreference,
  type ScapiMrtConnection,
} from './mrt-backend.js';

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

// ---------------------------------------------------------------------------
// Backend-neutral redirect view + SCAPI MRT operations
// ---------------------------------------------------------------------------

const READ_HEADERS = {[SCOPE_MODE_HEADER]: 'read'};
const WRITE_HEADERS = {[SCOPE_MODE_HEADER]: 'write'};

/**
 * Thrown when a backend-aware operation resolves to the legacy backend but no
 * legacy auth was supplied. `legacyAuth` is optional so SCAPI-only callers
 * aren't forced to configure a `~/.mobify` API key; this guards the case where
 * legacy is actually needed (explicit `legacy`, or `auto` falling back).
 */
const LEGACY_AUTH_REQUIRED_MESSAGE =
  'Legacy MRT credentials are required for this backend but none were provided. ' +
  'Provide an API key (--api-key / MRT_API_KEY / ~/.mobify) or use the SCAPI MRT backend.';

/**
 * A single redirect row, normalized across the legacy and SCAPI backends so the
 * CLI renders one shape regardless of backend.
 *
 * The two backends identify a redirect differently: the legacy MRT Cloud API
 * keys a redirect by its `from_path`, while the SCAPI Environments API assigns a
 * UUID `redirectId` and treats the source path as an ordinary (mutable) field.
 * {@link id} therefore carries the backend-appropriate identifier to pass back to
 * `get`/`update`/`delete` — the `from_path` on legacy, the UUID on SCAPI — while
 * {@link source} always holds the human-readable source path. On legacy the two
 * are equal; on SCAPI they differ.
 */
export interface MrtRedirectView {
  /** Identifier for get/update/delete: the `from_path` on legacy, the UUID on SCAPI. */
  id: string;
  /** The source path that triggers the redirect (legacy `from_path` / SCAPI `source`). */
  source: string;
  /** The destination path or URL (legacy `to_url` / SCAPI `destination`). */
  destination: string;
  /** HTTP status code (301 or 302), when reported. */
  httpStatusCode?: number;
  /** Whether the incoming query string is forwarded to the destination. */
  forwardQuerystring?: boolean;
  /** Whether a trailing wildcard match on the source is forwarded to the destination. */
  forwardWildcard?: boolean;
  /** Human-readable publishing status, when the backend reports one. */
  status?: string;
  /** Creation timestamp (ISO 8601), when present. */
  createdAt?: string;
  /** Email of the user who created the redirect, when present. */
  createdBy?: string;
  /** Backend that produced this row. */
  backend: MrtBackend;
}

/** Normalizes a legacy MRT {@link MrtRedirect} into an {@link MrtRedirectView}. */
export function normalizeLegacyRedirect(redirect: MrtRedirect): MrtRedirectView {
  return {
    // Legacy keys a redirect by its from_path, so that is the identifier the
    // get/update/delete operations expect back.
    id: redirect.from_path ?? '',
    source: redirect.from_path ?? '',
    destination: redirect.to_url ?? '',
    httpStatusCode: redirect.http_status_code,
    forwardQuerystring: redirect.forward_querystring ?? undefined,
    forwardWildcard: redirect.forward_wildcard ?? undefined,
    status: redirect.publishing_status || undefined,
    createdAt: redirect.created_at || undefined,
    createdBy: redirect.user_email || undefined,
    backend: 'legacy',
  };
}

/** Normalizes a SCAPI {@link RedirectEntry} into an {@link MrtRedirectView}. */
export function normalizeRedirectScapi(redirect: RedirectEntry): MrtRedirectView {
  return {
    // SCAPI keys a redirect by its UUID; the source path is a mutable field.
    id: redirect.redirectId ?? '',
    source: redirect.source ?? '',
    destination: redirect.destination ?? '',
    httpStatusCode: redirect.httpStatusCode,
    forwardQuerystring: redirect.forwardQuerystring,
    forwardWildcard: redirect.forwardWildcard,
    status: redirect.publishingStatus ?? undefined,
    createdAt: redirect.creationDate ?? undefined,
    createdBy: redirect.createdBy ?? undefined,
    backend: 'scapi',
  };
}

function buildScapiEnvironmentsClient(conn: ScapiMrtConnection): StorefrontEnvironmentsClient {
  return createStorefrontEnvironmentsClient({shortCode: conn.shortCode, tenantId: conn.tenantId}, conn.auth);
}

/** The redirect fields a SCAPI create accepts. */
export interface ScapiRedirectInput {
  source: string;
  destination: string;
  httpStatusCode?: RedirectHttpStatusCode;
  forwardQuerystring?: boolean;
  forwardWildcard?: boolean;
}

/**
 * Lists redirects for an environment via the SCAPI MRT Environments API.
 * Forwards the standard SCAPI `limit`/`offset` pagination query parameters when
 * provided (max 200 per page, default 25 server-side; the response echoes the
 * full `total`).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getRedirectsScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; limit?: number; offset?: number},
): Promise<{redirects: MrtRedirectView[]; count: number; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, limit, offset} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId, limit, offset}, '[MRT-SCAPI] Listing redirects');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/redirects',
    {
      params: {path: {organizationId, storefrontId, environmentId}, query: {limit, offset}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to list redirects');
  }

  return {
    redirects: (data.data ?? []).map(normalizeRedirectScapi),
    count: data.total ?? data.data?.length ?? 0,
    raw: data,
  };
}

/**
 * Creates a redirect via the SCAPI MRT Environments API (201 Created returns the
 * full redirect object).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function createRedirectScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; redirect: ScapiRedirectInput},
): Promise<{redirect: MrtRedirectView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, redirect} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId}, '[MRT-SCAPI] Creating redirect');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.POST(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/redirects',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
      body: {
        source: redirect.source,
        destination: redirect.destination,
        httpStatusCode: redirect.httpStatusCode,
        forwardQuerystring: redirect.forwardQuerystring ?? false,
        forwardWildcard: redirect.forwardWildcard ?? false,
      },
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to create redirect');
  }

  return {redirect: normalizeRedirectScapi(data), raw: data};
}

/**
 * Fetches a single redirect by its UUID via the SCAPI MRT Environments API.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getRedirectScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; redirectId: string},
): Promise<{redirect: MrtRedirectView; raw: unknown}> {
  const {storefrontId, environmentId, redirectId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/redirects/{redirectId}',
    {
      params: {path: {organizationId, storefrontId, environmentId, redirectId}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to get redirect ${redirectId}`);
  }

  return {redirect: normalizeRedirectScapi(data), raw: data};
}

/**
 * Partially updates a redirect by its UUID via the SCAPI MRT Environments API.
 * Only the supplied fields are changed (200 OK returns the updated redirect).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function updateRedirectScapi(
  conn: ScapiMrtConnection,
  params: {
    storefrontId: string;
    environmentId: string;
    redirectId: string;
    changes: Partial<ScapiRedirectInput>;
  },
): Promise<{redirect: MrtRedirectView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, redirectId, changes} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId, redirectId}, '[MRT-SCAPI] Updating redirect');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.PATCH(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/redirects/{redirectId}',
    {
      params: {path: {organizationId, storefrontId, environmentId, redirectId}},
      headers: WRITE_HEADERS,
      body: changes,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to update redirect ${redirectId}`);
  }

  return {redirect: normalizeRedirectScapi(data), raw: data};
}

/**
 * Deletes a redirect by its UUID via the SCAPI MRT Environments API. The
 * endpoint returns 204 No Content on success — there is no response body, so
 * only `error` is inspected.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function deleteRedirectScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; redirectId: string},
): Promise<void> {
  const logger = getLogger();
  const {storefrontId, environmentId, redirectId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId, redirectId}, '[MRT-SCAPI] Deleting redirect');

  const client = buildScapiEnvironmentsClient(conn);
  // 204 No Content on success: no `data` is returned, so check `error` only —
  // treating missing `data` as failure would wrongly reject a successful delete.
  const {error, response} = await client.DELETE(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/redirects/{redirectId}',
    {
      params: {path: {organizationId, storefrontId, environmentId, redirectId}},
      headers: WRITE_HEADERS,
    },
  );

  if (error) {
    throw createScapiRequestError(error, response, `Failed to delete redirect ${redirectId}`);
  }
}

/**
 * Clones all redirects from a source environment into the environment named by
 * `environmentId`, via the SCAPI MRT Environments API. Returns 201 Created with
 * no response body on success — so there is no cloned-count to report.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function cloneRedirectsScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; sourceEnvironmentId: string},
): Promise<void> {
  const logger = getLogger();
  const {storefrontId, environmentId, sourceEnvironmentId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId, sourceEnvironmentId}, '[MRT-SCAPI] Cloning redirects');

  const client = buildScapiEnvironmentsClient(conn);
  // 201 Created with no body on success. openapi-fetch only short-circuits empty
  // bodies on 204 / Content-Length: 0, so parse as text to avoid a JSON.parse
  // throw on the empty 201; then check `error` only.
  const {error, response} = await client.POST(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/redirects/actions/clone',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
      body: {sourceEnvironmentId},
      parseAs: 'text',
    },
  );

  if (error) {
    throw createScapiRequestError(error, response, 'Failed to clone redirects');
  }
}

// ---------------------------------------------------------------------------
// Backend-aware redirect operations (route legacy ↔ SCAPI)
// ---------------------------------------------------------------------------

/** Common backend-routing options shared by the backend-aware redirect operations. */
export interface RedirectBackendOptions {
  /** Resolved `--mrt-backend` preference. */
  preference: MrtBackendPreference;
  /** SCAPI connection; when absent, `auto` uses legacy and `scapi` throws. */
  scapiConnection?: ScapiMrtConnection;
  /** Legacy API-key auth strategy. Optional; required only when the legacy backend actually runs. */
  legacyAuth?: AuthStrategy;
  /** Project slug (= SCAPI storefront ID). */
  projectSlug: string;
  /** Target/environment slug (= SCAPI environment ID). */
  environment: string;
  /** Legacy MRT API origin. */
  origin?: string;
  /** Invoked when `auto` falls back from SCAPI to legacy. */
  onFallback?: (reason: string) => void;
  /** Invoked with the backend that serves the call (for `-D` debug). */
  onResolve?: (backend: MrtBackend) => void;
}

/** Backend-neutral redirect list result. */
export interface MrtRedirectsView {
  /** Backend that served the list. */
  backend: MrtBackend;
  /** Number of redirects (SCAPI `total`, else the row count). */
  count: number;
  /** Normalized redirect rows, consumed by the CLI table. */
  redirects: MrtRedirectView[];
  /**
   * The raw, backend-native list response, surfaced verbatim under `--json` so
   * each backend keeps its original machine contract (legacy: the
   * {@link ListRedirectsResult} shape; SCAPI: the paginated
   * `{limit, offset, total, data}` envelope). The normalized {@link redirects}
   * feed the human table only.
   */
  raw: unknown;
}

/** Backend-neutral single redirect result (get/create/update). */
export interface MrtRedirectResult {
  /** Backend that served the call. */
  backend: MrtBackend;
  /** Normalized redirect row. */
  redirect: MrtRedirectView;
  /** The raw, backend-native redirect response, surfaced verbatim under `--json`. */
  raw: unknown;
}

/** The backend that served a delete operation. */
export interface MrtRedirectWriteResult {
  /** Backend that served the write. */
  backend: MrtBackend;
}

/** Backend-neutral clone result. */
export interface MrtRedirectCloneResult {
  /** Backend that served the clone. */
  backend: MrtBackend;
  /**
   * Number of redirects cloned, when the backend reports it. The legacy MRT
   * Cloud API returns the cloned redirects; the SCAPI backend returns 201 with
   * no body, so this is `null` there.
   */
  count: number | null;
  /**
   * The raw, backend-native clone response: the legacy
   * {@link CloneRedirectsResult} shape, or `null` for SCAPI's empty 201.
   */
  raw: unknown;
}

/** Options for {@link listRedirectsWithBackend}. */
export interface ListRedirectsBackendOptions extends RedirectBackendOptions {
  /** Maximum number of results to return (forwarded to both backends). */
  limit?: number;
  /** Pagination offset (forwarded to both backends). */
  offset?: number;
  /** Legacy-only search term (ignored by the SCAPI backend). */
  search?: string;
}

/**
 * Lists redirects, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). Returns normalized rows.
 */
export async function listRedirectsWithBackend(options: ListRedirectsBackendOptions): Promise<MrtRedirectsView> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    environment,
    limit,
    offset,
    search,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{count: number; redirects: MrtRedirectView[]; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        getRedirectsScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          limit,
          offset,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await listRedirects(
          {projectSlug, targetSlug: environment, limit, offset, search, origin},
          legacyAuth,
        );
        // The legacy list result is the shape legacy `--json` emitted before the
        // backend split, so surface it verbatim under --json.
        return {count: result.count, redirects: result.redirects.map(normalizeLegacyRedirect), raw: result};
      },
    },
  );

  return {backend: run.backend, count: run.value.count, redirects: run.value.redirects, raw: run.value.raw};
}

/** Options for {@link createRedirectWithBackend}. */
export interface CreateRedirectBackendOptions extends RedirectBackendOptions {
  /** The source path to redirect from. */
  source: string;
  /** The destination path or URL. */
  destination: string;
  /** HTTP status code (301 or 302). */
  httpStatusCode?: RedirectHttpStatusCode;
  /** Forward the incoming query string. */
  forwardQuerystring?: boolean;
  /** Forward a trailing wildcard match. */
  forwardWildcard?: boolean;
}

/**
 * Creates a redirect, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback).
 */
export async function createRedirectWithBackend(options: CreateRedirectBackendOptions): Promise<MrtRedirectResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    environment,
    source,
    destination,
    httpStatusCode,
    forwardQuerystring,
    forwardWildcard,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{redirect: MrtRedirectView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        createRedirectScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          redirect: {source, destination, httpStatusCode, forwardQuerystring, forwardWildcard},
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const redirect = await createRedirect(
          {
            projectSlug,
            targetSlug: environment,
            fromPath: source,
            toUrl: destination,
            httpStatusCode,
            forwardQuerystring,
            forwardWildcard,
            origin,
          },
          legacyAuth,
        );
        return {redirect: normalizeLegacyRedirect(redirect), raw: redirect};
      },
    },
  );

  return {backend: run.backend, redirect: run.value.redirect, raw: run.value.raw};
}

/** Options for {@link getRedirectWithBackend}. */
export interface GetRedirectBackendOptions extends RedirectBackendOptions {
  /** Redirect identifier: the `from_path` on legacy, the UUID on SCAPI. */
  identifier: string;
}

/**
 * Fetches a single redirect, routing to the SCAPI or legacy backend per the
 * given preference (with safe `auto` fallback). The identifier is the
 * `from_path` on legacy and the redirect UUID on SCAPI.
 */
export async function getRedirectWithBackend(options: GetRedirectBackendOptions): Promise<MrtRedirectResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, identifier, origin, onFallback, onResolve} =
    options;

  const run = await runMrtWithFallback<{redirect: MrtRedirectView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        getRedirectScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          redirectId: identifier,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const redirect = await getRedirect(
          {projectSlug, targetSlug: environment, fromPath: identifier, origin},
          legacyAuth,
        );
        return {redirect: normalizeLegacyRedirect(redirect), raw: redirect};
      },
    },
  );

  return {backend: run.backend, redirect: run.value.redirect, raw: run.value.raw};
}

/** Options for {@link updateRedirectWithBackend}. */
export interface UpdateRedirectBackendOptions extends RedirectBackendOptions {
  /** Redirect identifier: the `from_path` on legacy, the UUID on SCAPI. */
  identifier: string;
  /** New destination path or URL. */
  destination?: string;
  /** New HTTP status code (301 or 302). */
  httpStatusCode?: RedirectHttpStatusCode;
  /** Forward the incoming query string. */
  forwardQuerystring?: boolean;
  /** Forward a trailing wildcard match. */
  forwardWildcard?: boolean;
}

/**
 * Partially updates a redirect, routing to the SCAPI or legacy backend per the
 * given preference (with safe `auto` fallback). Only the supplied fields change.
 *
 * The source path is immutable here: the legacy backend keys the redirect by its
 * `from_path`, so renaming it is not expressible as an update on both backends.
 */
export async function updateRedirectWithBackend(options: UpdateRedirectBackendOptions): Promise<MrtRedirectResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    environment,
    identifier,
    destination,
    httpStatusCode,
    forwardQuerystring,
    forwardWildcard,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{redirect: MrtRedirectView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => {
        // Build the SCAPI merge-PATCH body from only the supplied fields.
        const changes: Partial<ScapiRedirectInput> = {};
        if (destination !== undefined) changes.destination = destination;
        if (httpStatusCode !== undefined) changes.httpStatusCode = httpStatusCode;
        if (forwardQuerystring !== undefined) changes.forwardQuerystring = forwardQuerystring;
        if (forwardWildcard !== undefined) changes.forwardWildcard = forwardWildcard;
        return updateRedirectScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          redirectId: identifier,
          changes,
        });
      },
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const redirect = await updateRedirect(
          {
            projectSlug,
            targetSlug: environment,
            fromPath: identifier,
            toUrl: destination,
            httpStatusCode,
            forwardQuerystring,
            forwardWildcard,
            origin,
          },
          legacyAuth,
        );
        return {redirect: normalizeLegacyRedirect(redirect), raw: redirect};
      },
    },
  );

  return {backend: run.backend, redirect: run.value.redirect, raw: run.value.raw};
}

/** Options for {@link deleteRedirectWithBackend}. */
export interface DeleteRedirectBackendOptions extends RedirectBackendOptions {
  /** Redirect identifier: the `from_path` on legacy, the UUID on SCAPI. */
  identifier: string;
}

/**
 * Deletes a redirect, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). The identifier is the `from_path` on
 * legacy and the redirect UUID on SCAPI.
 */
export async function deleteRedirectWithBackend(
  options: DeleteRedirectBackendOptions,
): Promise<MrtRedirectWriteResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, identifier, origin, onFallback, onResolve} =
    options;

  const run = await runMrtWithFallback<void>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        deleteRedirectScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          redirectId: identifier,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        await deleteRedirect({projectSlug, targetSlug: environment, fromPath: identifier, origin}, legacyAuth);
      },
    },
  );

  return {backend: run.backend};
}

/** Options for {@link cloneRedirectsWithBackend}. */
export interface CloneRedirectsBackendOptions {
  /** Resolved `--mrt-backend` preference. */
  preference: MrtBackendPreference;
  /** SCAPI connection; when absent, `auto` uses legacy and `scapi` throws. */
  scapiConnection?: ScapiMrtConnection;
  /** Legacy API-key auth strategy. Optional; required only when the legacy backend actually runs. */
  legacyAuth?: AuthStrategy;
  /** Project slug (= SCAPI storefront ID). */
  projectSlug: string;
  /** Source environment slug to copy redirects from. */
  sourceEnvironment: string;
  /** Destination environment slug to copy redirects into (= SCAPI path environment ID). */
  targetEnvironment: string;
  /** Legacy MRT API origin. */
  origin?: string;
  /** Invoked when `auto` falls back from SCAPI to legacy. */
  onFallback?: (reason: string) => void;
  /** Invoked with the backend that serves the call (for `-D` debug). */
  onResolve?: (backend: MrtBackend) => void;
}

/**
 * Clones all redirects from a source environment into a destination environment,
 * routing to the SCAPI or legacy backend per the given preference (with safe
 * `auto` fallback). Callers must ensure the source and destination differ; both
 * backends reject a same-environment clone, but the CLI rejects it up front for a
 * uniform message.
 */
export async function cloneRedirectsWithBackend(
  options: CloneRedirectsBackendOptions,
): Promise<MrtRedirectCloneResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    sourceEnvironment,
    targetEnvironment,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{count: number | null; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: async () => {
        await cloneRedirectsScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: targetEnvironment,
          sourceEnvironmentId: sourceEnvironment,
        });
        // SCAPI clone returns 201 with no body: there is no cloned-count or
        // payload to surface.
        return {count: null, raw: null};
      },
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await cloneRedirects(
          {projectSlug, fromTargetSlug: sourceEnvironment, toTargetSlug: targetEnvironment, origin},
          legacyAuth,
        );
        return {count: result.count, raw: result};
      },
    },
  );

  return {backend: run.backend, count: run.value.count, raw: run.value.raw};
}
