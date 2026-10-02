/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Project operations for Managed Runtime.
 *
 * Handles CRUD operations for MRT projects.
 *
 * @module operations/mrt/project
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import {
  createStorefrontStorefrontsClient,
  toOrganizationId,
  type StorefrontStorefrontsClient,
  type Storefront,
  type StorefrontCreateType,
  type SsrRegion as StorefrontSsrRegion,
} from '../../clients/storefront-storefronts.js';
import {getLogger} from '../../logging/logger.js';
import {
  runMrtWithFallback,
  type MrtBackend,
  type MrtBackendPreference,
  type ScapiMrtConnection,
} from './mrt-backend.js';

/**
 * MRT project type for create/read operations.
 */
export type MrtProject = components['schemas']['APIProjectV2Create'];

/**
 * MRT project type for update operations.
 */
export type MrtProjectUpdate = components['schemas']['APIProjectV2Update'];

/**
 * Patched project for partial updates.
 */
export type PatchedMrtProject = components['schemas']['PatchedAPIProjectV2Update'];

/**
 * SSR region enum.
 */
export type SsrRegion = components['schemas']['SsrRegionEnum'];

/**
 * Options for listing MRT projects.
 */
export interface ListProjectsOptions {
  /**
   * Filter by organization slug.
   */
  organization?: string;

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
 * Result of listing projects.
 */
export interface ListProjectsResult {
  /**
   * Total count of projects.
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
   * Array of projects.
   */
  projects: MrtProject[];
}

/**
 * Lists projects accessible to the authenticated user.
 *
 * @param options - List options including organization filter and pagination
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of projects
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listProjects } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * // List all projects
 * const result = await listProjects({}, auth);
 *
 * // List projects for a specific organization
 * const orgProjects = await listProjects({ organization: 'my-org' }, auth);
 * ```
 */
export async function listProjects(options: ListProjectsOptions, auth: AuthStrategy): Promise<ListProjectsResult> {
  const logger = getLogger();
  const {organization, limit, offset, origin} = options;

  logger.debug({organization, limit, offset}, '[MRT] Listing projects');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/', {
    params: {
      query: {
        organization,
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
    throw new Error(`Failed to list projects: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Projects listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    projects: data.results ?? [],
  };
}

/**
 * Options for creating an MRT project.
 */
export interface CreateProjectOptions {
  /**
   * User-friendly name for the project.
   */
  name: string;

  /**
   * Project slug/identifier (auto-generated if not provided).
   */
  slug?: string;

  /**
   * Organization slug to create the project in.
   */
  organization: string;

  /**
   * Project URL.
   */
  url?: string;

  /**
   * Default AWS region for new targets.
   */
  ssrRegion?: SsrRegion;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Creates a new MRT project.
 *
 * @param options - Project creation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The created project
 * @throws Error if creation fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const project = await createProject({
 *   name: 'My Storefront',
 *   organization: 'my-org',
 *   ssrRegion: 'us-east-1'
 * }, auth);
 *
 * console.log(`Created project: ${project.slug}`);
 * ```
 */
export async function createProject(options: CreateProjectOptions, auth: AuthStrategy): Promise<MrtProject> {
  const logger = getLogger();
  const {name, slug, organization, url, ssrRegion, origin} = options;

  logger.debug({name, organization}, '[MRT] Creating project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: MrtProject = {
    name,
    organization,
  };

  if (slug) {
    body.slug = slug;
  }

  if (url) {
    body.url = url;
  }

  if (ssrRegion) {
    body.ssr_region = ssrRegion;
  }

  const {data, error} = await client.POST('/api/projects/', {
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to create project: ${errorMessage}`);
  }

  logger.debug({slug: data.slug}, '[MRT] Project created');

  return data;
}

/**
 * Options for getting an MRT project.
 */
export interface GetProjectOptions {
  /**
   * Project slug to retrieve.
   */
  projectSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets a project by slug.
 *
 * @param options - Get options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The project
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const project = await getProject({ projectSlug: 'my-storefront' }, auth);
 * console.log(`Project: ${project.name}`);
 * ```
 */
export async function getProject(options: GetProjectOptions, auth: AuthStrategy): Promise<MrtProjectUpdate> {
  const logger = getLogger();
  const {projectSlug, origin} = options;

  logger.debug({projectSlug}, '[MRT] Getting project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/', {
    params: {
      path: {project_slug: projectSlug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get project: ${errorMessage}`);
  }

  logger.debug({slug: data.slug}, '[MRT] Project retrieved');

  return data;
}

/**
 * Options for updating an MRT project.
 */
export interface UpdateProjectOptions {
  /**
   * Project slug to update.
   */
  projectSlug: string;

  /**
   * New name for the project.
   */
  name?: string;

  /**
   * New URL for the project.
   */
  url?: string;

  /**
   * New default AWS region for new targets.
   */
  ssrRegion?: SsrRegion;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Updates an MRT project.
 *
 * @param options - Update options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The updated project
 * @throws Error if update fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { updateProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const updated = await updateProject({
 *   projectSlug: 'my-storefront',
 *   name: 'My Updated Storefront'
 * }, auth);
 * ```
 */
export async function updateProject(options: UpdateProjectOptions, auth: AuthStrategy): Promise<MrtProjectUpdate> {
  const logger = getLogger();
  const {projectSlug, name, url, ssrRegion, origin} = options;

  logger.debug({projectSlug}, '[MRT] Updating project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: PatchedMrtProject = {};

  if (name !== undefined) {
    body.name = name;
  }

  if (url !== undefined) {
    body.url = url;
  }

  if (ssrRegion !== undefined) {
    body.ssr_region = ssrRegion;
  }

  const {data, error} = await client.PATCH('/api/projects/{project_slug}/', {
    params: {
      path: {project_slug: projectSlug},
    },
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to update project: ${errorMessage}`);
  }

  logger.debug({slug: data.slug}, '[MRT] Project updated');

  return data;
}

/**
 * Options for deleting an MRT project.
 */
export interface DeleteProjectOptions {
  /**
   * Project slug to delete.
   */
  projectSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Deletes an MRT project.
 *
 * @param options - Delete options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if deletion fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { deleteProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * await deleteProject({ projectSlug: 'my-old-project' }, auth);
 * console.log('Project deleted');
 * ```
 */
export async function deleteProject(options: DeleteProjectOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, origin} = options;

  logger.debug({projectSlug}, '[MRT] Deleting project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/', {
    params: {
      path: {project_slug: projectSlug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to delete project: ${errorMessage}`);
  }

  logger.debug({projectSlug}, '[MRT] Project deleted');
}

// ---------------------------------------------------------------------------
// Backend-neutral project view + SCAPI MRT (Storefronts) operations
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
 * An MRT project (= SCAPI storefront), normalized across the legacy and SCAPI
 * backends so the CLI renders one shape regardless of backend.
 *
 * Fields that only one backend reports are optional: `url`/`organization` are
 * legacy-only, `sites`/`architecture` are SCAPI-only. Region and status strings
 * are kept in each backend's own form (legacy `ssr_region`/`deletion_status`,
 * SCAPI `ssrRegion`/`setupStatus`) so display doesn't silently change for
 * existing legacy users.
 */
export interface MrtProjectView {
  /** Project slug (= SCAPI storefront ID). */
  id: string;
  /** Project / storefront name. */
  name: string;
  /** Project type (legacy `project_type`, SCAPI `type`), when reported. */
  type?: string;
  /** Lifecycle status (legacy `deletion_status`, SCAPI `setupStatus`), when reported. */
  status?: string;
  /** Default SSR region, in the backend's own form, when reported. */
  region?: string;
  /** Default SSR architecture (SCAPI only), when reported. */
  architecture?: string | null;
  /** Project URL (legacy only). */
  url?: string;
  /** Owning organization slug (legacy only). */
  organization?: string;
  /** Assigned site IDs (SCAPI only). */
  sites?: string[];
  /** Creation timestamp (ISO 8601), when present. */
  createdAt?: string;
  /** Last-modified timestamp (ISO 8601), when present. */
  updatedAt?: string;
  /** Backend that produced this row. */
  backend: MrtBackend;
}

/** Normalizes a legacy MRT {@link MrtProject} into an {@link MrtProjectView}. */
export function normalizeLegacyProject(project: MrtProject | MrtProjectUpdate): MrtProjectView {
  const p = project as MrtProjectUpdate;
  return {
    id: p.slug ?? '',
    name: p.name,
    type: p.project_type || undefined,
    status: p.deletion_status || 'active',
    region: p.ssr_region || undefined,
    architecture: p.ssr_architecture ?? undefined,
    url: p.url || undefined,
    organization: p.organization || undefined,
    createdAt: p.created_at || undefined,
    updatedAt: p.updated_at || undefined,
    backend: 'legacy',
  };
}

/** Normalizes a SCAPI {@link Storefront} into an {@link MrtProjectView}. */
export function normalizeProjectScapi(storefront: Storefront): MrtProjectView {
  return {
    id: storefront.storefrontId,
    name: storefront.storefrontName,
    type: storefront.type || undefined,
    status: storefront.setupStatus || undefined,
    region: storefront.ssrRegion || undefined,
    architecture: storefront.ssrArchitecture ?? undefined,
    sites: storefront.sites ?? undefined,
    createdAt: storefront.creationDate ?? undefined,
    updatedAt: storefront.lastModified ?? undefined,
    backend: 'scapi',
  };
}

/**
 * Converts a legacy-style SSR region (hyphenated, e.g. `us-east-1`) to the SCAPI
 * Storefronts form (underscored, e.g. `us_east_1`). The CLI validates `--region`
 * against the hyphenated legacy enum; SCAPI expects underscores.
 */
function toScapiSsrRegion(region: string): StorefrontSsrRegion {
  return region.replace(/-/g, '_') as StorefrontSsrRegion;
}

function buildScapiStorefrontsClient(conn: ScapiMrtConnection): StorefrontStorefrontsClient {
  return createStorefrontStorefrontsClient({shortCode: conn.shortCode, tenantId: conn.tenantId}, conn.auth);
}

/**
 * Lists storefronts (MRT projects) for the organization via the SCAPI MRT
 * Storefronts API. The organization is fixed by the connection's tenant, so the
 * legacy `organization` filter does not apply. Forwards the standard SCAPI
 * `limit`/`offset` pagination (max 200 per page, default 25 server-side).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getStorefrontsScapi(
  conn: ScapiMrtConnection,
  params: {limit?: number; offset?: number} = {},
): Promise<{projects: MrtProjectView[]; count: number; raw: unknown}> {
  const logger = getLogger();
  const {limit, offset} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, limit, offset}, '[MRT-SCAPI] Listing storefronts');

  const client = buildScapiStorefrontsClient(conn);
  const {data, error, response} = await client.GET('/organizations/{organizationId}/storefronts', {
    params: {path: {organizationId}, query: {limit, offset}},
    headers: READ_HEADERS,
  });

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to list storefronts');
  }

  return {
    projects: (data.data ?? []).map(normalizeProjectScapi),
    count: data.total ?? data.data?.length ?? 0,
    raw: data,
  };
}

/**
 * Creates a storefront (MRT project) via the SCAPI MRT Storefronts API. Returns
 * 202 Accepted with the storefront in the `in_progress` setup status; poll the
 * storefront by ID to track provisioning.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function createStorefrontScapi(
  conn: ScapiMrtConnection,
  params: {storefrontName: string; type: StorefrontCreateType; sites: string[]},
): Promise<{project: MrtProjectView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontName, type, sites} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontName, type}, '[MRT-SCAPI] Creating storefront');

  const client = buildScapiStorefrontsClient(conn);
  const {data, error, response} = await client.POST('/organizations/{organizationId}/storefronts', {
    params: {path: {organizationId}},
    headers: WRITE_HEADERS,
    body: {storefrontName, type, sites},
  });

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to create storefront');
  }

  return {project: normalizeProjectScapi(data), raw: data};
}

/**
 * Fetches a single storefront (MRT project) by ID via the SCAPI MRT Storefronts
 * API.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getStorefrontByIdScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string},
): Promise<{project: MrtProjectView; raw: unknown}> {
  const {storefrontId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  const client = buildScapiStorefrontsClient(conn);
  const {data, error, response} = await client.GET('/organizations/{organizationId}/storefronts/{storefrontId}', {
    params: {path: {organizationId, storefrontId}},
    headers: READ_HEADERS,
  });

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to get storefront ${storefrontId}`);
  }

  return {project: normalizeProjectScapi(data), raw: data};
}

/**
 * Updates a storefront (MRT project) via the SCAPI MRT Storefronts API. Every
 * field is optional; only supplied fields change. When `sites` is provided it
 * **replaces** the storefront's full set of assigned sites (not an incremental
 * update) — pass the complete desired set. SCAPI cannot rename a storefront.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function updateStorefrontScapi(
  conn: ScapiMrtConnection,
  params: {
    storefrontId: string;
    sites?: string[];
    ssrRegion?: StorefrontSsrRegion;
    ssrArchitecture?: 'x86' | 'arm64' | null;
    allowCookies?: boolean;
    preserveProxyUserAgent?: boolean;
  },
): Promise<{project: MrtProjectView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, sites, ssrRegion, ssrArchitecture, allowCookies, preserveProxyUserAgent} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId}, '[MRT-SCAPI] Updating storefront');

  const body: Record<string, unknown> = {};
  if (sites !== undefined) {
    body.sites = sites;
  }
  if (ssrRegion !== undefined) {
    body.ssrRegion = ssrRegion;
  }
  if (ssrArchitecture !== undefined) {
    body.ssrArchitecture = ssrArchitecture;
  }
  if (allowCookies !== undefined) {
    body.allowCookies = allowCookies;
  }
  if (preserveProxyUserAgent !== undefined) {
    body.preserveProxyUserAgent = preserveProxyUserAgent;
  }

  const client = buildScapiStorefrontsClient(conn);
  const {data, error, response} = await client.PATCH('/organizations/{organizationId}/storefronts/{storefrontId}', {
    params: {path: {organizationId, storefrontId}},
    headers: WRITE_HEADERS,
    body,
  });

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to update storefront ${storefrontId}`);
  }

  return {project: normalizeProjectScapi(data), raw: data};
}

/**
 * Deletes a storefront (MRT project) by ID via the SCAPI MRT Storefronts API.
 * Returns 202 Accepted with the storefront in the `delete_in_progress` setup
 * status; poll the storefront by ID to track deletion.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function deleteStorefrontScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string},
): Promise<{raw: unknown}> {
  const logger = getLogger();
  const {storefrontId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId}, '[MRT-SCAPI] Deleting storefront');

  const client = buildScapiStorefrontsClient(conn);
  // 202 Accepted returns the storefront in delete_in_progress. Inspect `error`
  // only: a successful queued delete must not be rejected for a missing body.
  const {data, error, response} = await client.DELETE('/organizations/{organizationId}/storefronts/{storefrontId}', {
    params: {path: {organizationId, storefrontId}},
    headers: WRITE_HEADERS,
  });

  if (error) {
    throw createScapiRequestError(error, response, `Failed to delete storefront ${storefrontId}`);
  }

  return {raw: data};
}

// ---------------------------------------------------------------------------
// Backend-aware project operations (route legacy ↔ SCAPI)
// ---------------------------------------------------------------------------

/** Common backend-routing options shared by the backend-aware project operations. */
export interface ProjectBackendOptions {
  /** Resolved `--mrt-backend` preference. */
  preference: MrtBackendPreference;
  /** SCAPI connection; when absent, `auto` uses legacy and `scapi` throws. */
  scapiConnection?: ScapiMrtConnection;
  /** Legacy API-key auth strategy. Optional; required only when the legacy backend actually runs. */
  legacyAuth?: AuthStrategy;
  /** Legacy MRT API origin. */
  origin?: string;
  /** Invoked when `auto` falls back from SCAPI to legacy. */
  onFallback?: (reason: string) => void;
  /** Invoked with the backend that serves the call (for `-D` debug). */
  onResolve?: (backend: MrtBackend) => void;
}

/** Backend-neutral project list result. */
export interface MrtProjectsView {
  /** Backend that served the list. */
  backend: MrtBackend;
  /** Number of projects (SCAPI `total`, else the legacy count). */
  count: number;
  /** Normalized project rows, consumed by the CLI table. */
  projects: MrtProjectView[];
  /**
   * The raw, backend-native list response, surfaced verbatim under `--json` so
   * each backend keeps its original machine contract (legacy: the
   * {@link ListProjectsResult} shape; SCAPI: the paginated
   * `{limit, offset, total, data}` envelope). The normalized {@link projects}
   * feed the human table only.
   */
  raw: unknown;
}

/** Backend-neutral single project result (get/create/update). */
export interface MrtProjectResult {
  /** Backend that served the call. */
  backend: MrtBackend;
  /** Normalized project row. */
  project: MrtProjectView;
  /** The raw, backend-native project response, surfaced verbatim under `--json`. */
  raw: unknown;
}

/** The backend that served a write (delete) operation and its raw response. */
export interface MrtProjectWriteResult {
  /** Backend that served the write. */
  backend: MrtBackend;
  /** The raw, backend-native response (SCAPI delete returns the storefront; legacy returns nothing). */
  raw: unknown;
}

/** Options for {@link listProjectsWithBackend}. */
export interface ListProjectsBackendOptions extends ProjectBackendOptions {
  /** Filter by organization slug (legacy only; SCAPI is scoped to the connection's tenant). */
  organization?: string;
  /** Maximum number of results to return (forwarded to both backends). */
  limit?: number;
  /** Pagination offset (forwarded to both backends). */
  offset?: number;
}

/**
 * Lists projects, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). Returns normalized rows.
 */
export async function listProjectsWithBackend(options: ListProjectsBackendOptions): Promise<MrtProjectsView> {
  const {preference, scapiConnection, legacyAuth, organization, limit, offset, origin, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{count: number; projects: MrtProjectView[]; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => getStorefrontsScapi(scapiConnection!, {limit, offset}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await listProjects({organization, limit, offset, origin}, legacyAuth);
        return {count: result.count, projects: result.projects.map(normalizeLegacyProject), raw: result};
      },
    },
  );

  return {backend: run.backend, count: run.value.count, projects: run.value.projects, raw: run.value.raw};
}

/** Options for {@link createProjectWithBackend}. */
export interface CreateProjectBackendOptions extends ProjectBackendOptions {
  /** Project / storefront name (both backends). */
  name: string;
  /** Desired project slug (legacy only; SCAPI generates the storefront ID). */
  slug?: string;
  /** Organization slug (legacy only; SCAPI is scoped to the connection's tenant). */
  organization?: string;
  /** Project URL (legacy only). */
  url?: string;
  /** Default SSR region, hyphenated legacy form (legacy only). */
  ssrRegion?: SsrRegion;
  /** Storefront type (SCAPI only; defaults to `storefront_next`). */
  type?: StorefrontCreateType;
  /** Site IDs to assign (SCAPI only; at least one required for SCAPI). */
  sites?: string[];
}

/**
 * Creates a project, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). The caller is responsible for
 * validating backend-specific required fields (`organization` for legacy,
 * `sites` for SCAPI) against the backend that will actually run.
 */
export async function createProjectWithBackend(options: CreateProjectBackendOptions): Promise<MrtProjectResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    name,
    slug,
    organization,
    url,
    ssrRegion,
    type,
    sites,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{project: MrtProjectView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        createStorefrontScapi(scapiConnection!, {
          storefrontName: name,
          type: type ?? 'storefront_next',
          sites: sites ?? [],
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        if (!organization) {
          throw new Error('The legacy MRT backend requires --organization to create a project.');
        }
        const project = await createProject({name, organization, slug, url, ssrRegion, origin}, legacyAuth);
        return {project: normalizeLegacyProject(project), raw: project};
      },
    },
  );

  return {backend: run.backend, project: run.value.project, raw: run.value.raw};
}

/** Options for {@link getProjectWithBackend}. */
export interface GetProjectBackendOptions extends ProjectBackendOptions {
  /** Project slug (= SCAPI storefront ID) to fetch. */
  projectSlug: string;
}

/**
 * Fetches a single project, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback).
 */
export async function getProjectWithBackend(options: GetProjectBackendOptions): Promise<MrtProjectResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, origin, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{project: MrtProjectView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => getStorefrontByIdScapi(scapiConnection!, {storefrontId: projectSlug}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const project = await getProject({projectSlug, origin}, legacyAuth);
        return {project: normalizeLegacyProject(project), raw: project};
      },
    },
  );

  return {backend: run.backend, project: run.value.project, raw: run.value.raw};
}

/** Options for {@link updateProjectWithBackend}. */
export interface UpdateProjectBackendOptions extends ProjectBackendOptions {
  /** Project slug (= SCAPI storefront ID) to update. */
  projectSlug: string;
  /** New name (legacy only; SCAPI cannot rename a storefront). */
  name?: string;
  /** New URL (legacy only). */
  url?: string;
  /** New default SSR region, hyphenated legacy form (both backends). */
  ssrRegion?: SsrRegion;
  /** Complete replacement set of assigned site IDs (SCAPI only). */
  sites?: string[];
  /** New default SSR architecture (SCAPI only); `null` clears the default. */
  ssrArchitecture?: 'x86' | 'arm64' | null;
  /** Whether cookies are allowed (SCAPI only). */
  allowCookies?: boolean;
  /** Whether the end-user User-Agent is preserved through proxies (SCAPI only). */
  preserveProxyUserAgent?: boolean;
}

/**
 * Updates a project, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). The caller is responsible for
 * validating that supplied fields are honored by the backend that will run
 * (SCAPI ignores `name`/`url`; legacy ignores `sites`/architecture/cookie flags).
 */
export async function updateProjectWithBackend(options: UpdateProjectBackendOptions): Promise<MrtProjectResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    name,
    url,
    ssrRegion,
    sites,
    ssrArchitecture,
    allowCookies,
    preserveProxyUserAgent,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{project: MrtProjectView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        updateStorefrontScapi(scapiConnection!, {
          storefrontId: projectSlug,
          sites,
          ssrRegion: ssrRegion ? toScapiSsrRegion(ssrRegion) : undefined,
          ssrArchitecture,
          allowCookies,
          preserveProxyUserAgent,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const project = await updateProject({projectSlug, name, url, ssrRegion, origin}, legacyAuth);
        return {project: normalizeLegacyProject(project), raw: project};
      },
    },
  );

  return {backend: run.backend, project: run.value.project, raw: run.value.raw};
}

/** Options for {@link deleteProjectWithBackend}. */
export interface DeleteProjectBackendOptions extends ProjectBackendOptions {
  /** Project slug (= SCAPI storefront ID) to delete. */
  projectSlug: string;
}

/**
 * Deletes a project, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback).
 */
export async function deleteProjectWithBackend(options: DeleteProjectBackendOptions): Promise<MrtProjectWriteResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, origin, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => deleteStorefrontScapi(scapiConnection!, {storefrontId: projectSlug}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        await deleteProject({projectSlug, origin}, legacyAuth);
        return {raw: undefined};
      },
    },
  );

  return {backend: run.backend, raw: run.value.raw};
}
