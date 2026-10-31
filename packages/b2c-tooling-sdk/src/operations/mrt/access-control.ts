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
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import {
  createStorefrontEnvironmentsClient,
  toOrganizationId,
  type StorefrontEnvironmentsClient,
  type AccessControlHeaderEntry,
} from '../../clients/storefront-environments.js';
import {getLogger} from '../../logging/logger.js';
import {
  runMrtWithFallback,
  type MrtBackend,
  type MrtBackendPreference,
  type ScapiMrtConnection,
} from './mrt-backend.js';

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

// ---------------------------------------------------------------------------
// Backend-neutral access-control-header view + SCAPI MRT operations
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
 * A single access-control-header row, normalized across the legacy and SCAPI
 * backends so the CLI renders one shape regardless of backend.
 *
 * Values stay masked (both backends return masked values) — the CLI never
 * displays or reconstructs the plaintext header. Status is kept as the backend's
 * own string (legacy `publishing_status_description`, SCAPI `publishingStatus`
 * enum) so display doesn't silently change for existing legacy users.
 */
export interface MrtAccessControlHeaderView {
  /** Header UUID. */
  id: string;
  /** Masked header value. */
  value: string;
  /** Human-readable publishing status, when the backend reports one. */
  status?: string;
  /** Creation timestamp (ISO 8601), when present. */
  createdAt?: string;
  /** Email of the user who created the header, when present. */
  createdBy?: string;
  /** Backend that produced this row. */
  backend: MrtBackend;
}

/** Normalizes a legacy MRT {@link MrtAccessControlHeader} into an {@link MrtAccessControlHeaderView}. */
export function normalizeLegacyAccessControlHeader(header: MrtAccessControlHeader): MrtAccessControlHeaderView {
  return {
    id: header.id ?? '',
    value: header.value ?? '',
    status: header.publishing_status_description || undefined,
    createdAt: header.created_at || undefined,
    createdBy: header.user_email || undefined,
    backend: 'legacy',
  };
}

/** Normalizes a SCAPI {@link AccessControlHeaderEntry} into an {@link MrtAccessControlHeaderView}. */
export function normalizeAccessControlHeaderScapi(header: AccessControlHeaderEntry): MrtAccessControlHeaderView {
  return {
    id: header.id ?? '',
    value: header.value ?? '',
    status: header.publishingStatus ?? undefined,
    createdAt: header.creationDate ?? undefined,
    createdBy: header.createdBy ?? undefined,
    backend: 'scapi',
  };
}

function buildScapiEnvironmentsClient(conn: ScapiMrtConnection): StorefrontEnvironmentsClient {
  return createStorefrontEnvironmentsClient({shortCode: conn.shortCode, tenantId: conn.tenantId}, conn.auth);
}

/**
 * Lists access control headers for an environment via the SCAPI MRT Environments
 * API. Forwards the standard SCAPI `limit`/`offset` pagination query parameters
 * when provided (max 200 per page, default 25 server-side; the response echoes
 * the full `total`). Values are returned masked.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getAccessControlHeadersScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; limit?: number; offset?: number},
): Promise<{headers: MrtAccessControlHeaderView[]; count: number; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, limit, offset} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug(
    {organizationId, storefrontId, environmentId, limit, offset},
    '[MRT-SCAPI] Listing access control headers',
  );

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/access-control-headers',
    {
      params: {path: {organizationId, storefrontId, environmentId}, query: {limit, offset}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to list access control headers');
  }

  return {
    headers: (data.data ?? []).map(normalizeAccessControlHeaderScapi),
    count: data.total ?? data.data?.length ?? 0,
    raw: data,
  };
}

/**
 * Creates an access control header via the SCAPI MRT Environments API. The
 * created value is returned masked (201 Created with the full header object).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function createAccessControlHeaderScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; value: string},
): Promise<{header: MrtAccessControlHeaderView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, value} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId}, '[MRT-SCAPI] Creating access control header');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.POST(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/access-control-headers',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
      body: {value},
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to create access control header');
  }

  return {header: normalizeAccessControlHeaderScapi(data), raw: data};
}

/**
 * Fetches a single access control header by ID via the SCAPI MRT Environments
 * API. The value is returned masked.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getAccessControlHeaderScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; accessControlHeaderId: string},
): Promise<{header: MrtAccessControlHeaderView; raw: unknown}> {
  const {storefrontId, environmentId, accessControlHeaderId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/access-control-headers/{accessControlHeaderId}',
    {
      params: {path: {organizationId, storefrontId, environmentId, accessControlHeaderId}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to get access control header ${accessControlHeaderId}`);
  }

  return {header: normalizeAccessControlHeaderScapi(data), raw: data};
}

/**
 * Deletes an access control header by ID via the SCAPI MRT Environments API. The
 * endpoint returns 204 No Content on success — there is no response body, so
 * only `error` is inspected.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function deleteAccessControlHeaderScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; accessControlHeaderId: string},
): Promise<void> {
  const logger = getLogger();
  const {storefrontId, environmentId, accessControlHeaderId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug(
    {organizationId, storefrontId, environmentId, accessControlHeaderId},
    '[MRT-SCAPI] Deleting access control header',
  );

  const client = buildScapiEnvironmentsClient(conn);
  // 204 No Content on success: no `data` is returned, so check `error` only —
  // treating missing `data` as failure would wrongly reject a successful delete.
  const {error, response} = await client.DELETE(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/access-control-headers/{accessControlHeaderId}',
    {
      params: {path: {organizationId, storefrontId, environmentId, accessControlHeaderId}},
      headers: WRITE_HEADERS,
    },
  );

  if (error) {
    throw createScapiRequestError(error, response, `Failed to delete access control header ${accessControlHeaderId}`);
  }
}

// ---------------------------------------------------------------------------
// Backend-aware access-control-header operations (route legacy ↔ SCAPI)
// ---------------------------------------------------------------------------

/** Common backend-routing options shared by the backend-aware access-control operations. */
export interface AccessControlBackendOptions {
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

/** Backend-neutral access-control-header list result. */
export interface MrtAccessControlHeadersView {
  /** Backend that served the list. */
  backend: MrtBackend;
  /** Number of headers (SCAPI `total`, else the row count). */
  count: number;
  /** Normalized header rows, consumed by the CLI table. */
  headers: MrtAccessControlHeaderView[];
  /**
   * The raw, backend-native list response, surfaced verbatim under `--json` so
   * each backend keeps its original machine contract (legacy: the
   * {@link ListAccessControlHeadersResult} shape; SCAPI: the paginated
   * `{limit, offset, total, data}` envelope). The normalized {@link headers}
   * feed the human table only.
   */
  raw: unknown;
}

/** Backend-neutral single access-control-header result (get/create). */
export interface MrtAccessControlHeaderResult {
  /** Backend that served the call. */
  backend: MrtBackend;
  /** Normalized header row. */
  header: MrtAccessControlHeaderView;
  /** The raw, backend-native header response, surfaced verbatim under `--json`. */
  raw: unknown;
}

/** The backend that served a write (delete) operation. */
export interface MrtAccessControlWriteResult {
  /** Backend that served the write. */
  backend: MrtBackend;
}

/** Options for {@link listAccessControlHeadersWithBackend}. */
export interface ListAccessControlHeadersBackendOptions extends AccessControlBackendOptions {
  /** Maximum number of results to return (forwarded to both backends). */
  limit?: number;
  /** Pagination offset (forwarded to both backends). */
  offset?: number;
}

/**
 * Lists access control headers, routing to the SCAPI or legacy backend per the
 * given preference (with safe `auto` fallback). Returns normalized rows.
 */
export async function listAccessControlHeadersWithBackend(
  options: ListAccessControlHeadersBackendOptions,
): Promise<MrtAccessControlHeadersView> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    environment,
    limit,
    offset,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{count: number; headers: MrtAccessControlHeaderView[]; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        getAccessControlHeadersScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          limit,
          offset,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await listAccessControlHeaders(
          {projectSlug, targetSlug: environment, limit, offset, origin},
          legacyAuth,
        );
        // The legacy list result is the shape legacy `--json` emitted before the
        // backend split, so surface it verbatim under --json.
        return {count: result.count, headers: result.headers.map(normalizeLegacyAccessControlHeader), raw: result};
      },
    },
  );

  return {backend: run.backend, count: run.value.count, headers: run.value.headers, raw: run.value.raw};
}

/** Options for {@link createAccessControlHeaderWithBackend}. */
export interface CreateAccessControlHeaderBackendOptions extends AccessControlBackendOptions {
  /** The header value to create. */
  value: string;
}

/**
 * Creates an access control header, routing to the SCAPI or legacy backend per
 * the given preference (with safe `auto` fallback).
 */
export async function createAccessControlHeaderWithBackend(
  options: CreateAccessControlHeaderBackendOptions,
): Promise<MrtAccessControlHeaderResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, value, origin, onFallback, onResolve} =
    options;

  const run = await runMrtWithFallback<{header: MrtAccessControlHeaderView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        createAccessControlHeaderScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          value,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const header = await createAccessControlHeader(
          {projectSlug, targetSlug: environment, value, origin},
          legacyAuth,
        );
        return {header: normalizeLegacyAccessControlHeader(header), raw: header};
      },
    },
  );

  return {backend: run.backend, header: run.value.header, raw: run.value.raw};
}

/** Options for {@link getAccessControlHeaderWithBackend}. */
export interface GetAccessControlHeaderBackendOptions extends AccessControlBackendOptions {
  /** The header UUID to fetch. */
  headerId: string;
}

/**
 * Fetches a single access control header by ID, routing to the SCAPI or legacy
 * backend per the given preference (with safe `auto` fallback).
 */
export async function getAccessControlHeaderWithBackend(
  options: GetAccessControlHeaderBackendOptions,
): Promise<MrtAccessControlHeaderResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, headerId, origin, onFallback, onResolve} =
    options;

  const run = await runMrtWithFallback<{header: MrtAccessControlHeaderView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        getAccessControlHeaderScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          accessControlHeaderId: headerId,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const header = await getAccessControlHeader(
          {projectSlug, targetSlug: environment, headerId, origin},
          legacyAuth,
        );
        return {header: normalizeLegacyAccessControlHeader(header), raw: header};
      },
    },
  );

  return {backend: run.backend, header: run.value.header, raw: run.value.raw};
}

/** Options for {@link deleteAccessControlHeaderWithBackend}. */
export interface DeleteAccessControlHeaderBackendOptions extends AccessControlBackendOptions {
  /** The header UUID to delete. */
  headerId: string;
}

/**
 * Deletes an access control header by ID, routing to the SCAPI or legacy backend
 * per the given preference (with safe `auto` fallback).
 */
export async function deleteAccessControlHeaderWithBackend(
  options: DeleteAccessControlHeaderBackendOptions,
): Promise<MrtAccessControlWriteResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, headerId, origin, onFallback, onResolve} =
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
        deleteAccessControlHeaderScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          accessControlHeaderId: headerId,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        await deleteAccessControlHeader({projectSlug, targetSlug: environment, headerId, origin}, legacyAuth);
      },
    },
  );

  return {backend: run.backend};
}
