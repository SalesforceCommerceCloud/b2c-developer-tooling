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
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import {
  createStorefrontDeploymentsClient,
  toOrganizationId,
  type StorefrontDeploymentsClient,
  type Deployment as DeploymentScapi,
  type DeploymentStatus as DeploymentStatusScapi,
} from '../../clients/storefront-deployments.js';
import {getLogger} from '../../logging/logger.js';
import {
  runMrtWithFallback,
  type MrtBackend,
  type MrtBackendPreference,
  type ScapiMrtConnection,
} from './mrt-backend.js';

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

  /**
   * Non-blocking warnings returned by MRT for this deployment (e.g. x86 deprecation).
   * Optional — absent if the deploy endpoint returns no warnings.
   */
  warnings?: string[];
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

  const {data, error} = await client.POST('/api/projects/{project_slug}/target/{target_slug}/deploy/', {
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

  // Defensive: the deploy endpoint response shape is not strongly typed and may not
  // include `warnings`; default to [] so nothing breaks. We return these for the caller
  // (e.g. the CLI) to surface — we don't log them here, to avoid double-printing.
  const deployData = (data ?? {}) as {warnings?: string[]};
  const warnings = deployData.warnings ?? [];

  logger.debug({bundleId}, '[MRT] Deployment created');

  return {
    bundleId,
    targetSlug,
    status: 'pending',
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Backend-neutral deployment view + SCAPI MRT operations
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

/** SCAPI deployment statuses that end the poll loop. */
const SCAPI_TERMINAL_STATUSES = new Set<DeploymentStatusScapi>(['finished', 'failed']);

/**
 * A single deployment history row, normalized across the legacy and SCAPI
 * backends so the CLI table renders one shape regardless of backend.
 *
 * Status and type strings are kept **raw** per backend (legacy `"Finished"` /
 * `"Publish"`, SCAPI `"finished"` / `"publish"`) so display doesn't silently
 * change for existing legacy users; terminal-state logic for `--wait` lives in
 * {@link waitForDeploymentScapi} and operates on the SCAPI enum directly.
 */
export interface MrtDeploymentView {
  /** SCAPI deployment UUID. Undefined for legacy (its list has no per-deploy id). */
  deploymentId?: string;
  /** Numeric bundle identifier. */
  bundleId?: number;
  /** Human-readable bundle message/description. */
  bundleMessage?: string;
  /** Raw backend status string. */
  status?: string;
  /** Raw backend deployment type. */
  deploymentType?: string;
  /** Creation timestamp (ISO 8601). */
  creationDate?: string;
  /** Email of the user who triggered the deployment. */
  createdBy?: string;
  /** Backend that produced this row. */
  backend: MrtBackend;
}

/** Normalizes a legacy MRT deployment list item into an {@link MrtDeploymentView}. */
export function normalizeLegacyDeployment(deploy: MrtDeployment): MrtDeploymentView {
  return {
    bundleId: deploy.bundle?.id ?? undefined,
    bundleMessage: deploy.bundle?.message ?? undefined,
    status: deploy.status ?? undefined,
    deploymentType: deploy.deploy_type ?? undefined,
    creationDate: deploy.created_at ?? undefined,
    createdBy: deploy.user ?? undefined,
    backend: 'legacy',
  };
}

/** Normalizes a SCAPI MRT {@link DeploymentScapi} into an {@link MrtDeploymentView}. */
export function normalizeDeploymentScapi(deployment: DeploymentScapi): MrtDeploymentView {
  return {
    deploymentId: deployment.deploymentId ?? undefined,
    bundleId: deployment.bundle?.bundleId ?? undefined,
    bundleMessage: deployment.bundle?.description ?? undefined,
    status: deployment.status ?? undefined,
    deploymentType: deployment.deploymentType ?? undefined,
    creationDate: deployment.creationDate ?? undefined,
    createdBy: deployment.createdBy ?? undefined,
    backend: 'scapi',
  };
}

function buildScapiDeploymentsClient(conn: ScapiMrtConnection): StorefrontDeploymentsClient {
  return createStorefrontDeploymentsClient({shortCode: conn.shortCode, tenantId: conn.tenantId}, conn.auth);
}

/**
 * Lists deployments for an environment via the SCAPI MRT Deployments API.
 *
 * Forwards the standard SCAPI `limit`/`offset` pagination query parameters when
 * provided (max 200 per page, default 25 server-side; the response echoes the
 * full `total`), mirroring the legacy list and the other SCAPI collection
 * clients (`scapi-sites`, `scapi-catalogs`).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function listDeploymentsScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; limit?: number; offset?: number},
): Promise<{deployments: MrtDeploymentView[]; count: number; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, limit, offset} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId, limit, offset}, '[MRT-SCAPI] Listing deployments');

  const client = buildScapiDeploymentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/deployments',
    {
      params: {path: {organizationId, storefrontId, environmentId}, query: {limit, offset}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to list deployments');
  }

  return {
    deployments: (data.data ?? []).map(normalizeDeploymentScapi),
    count: data.total ?? data.data?.length ?? 0,
    raw: data,
  };
}

/** Result of a SCAPI deployment create. */
export interface CreateDeploymentScapiResult {
  /** Deployment UUID assigned by SCAPI (used by `--wait`). */
  deploymentId?: string;
  /** Initial deployment status (typically `queued`). */
  status?: string;
  /** Bundle that was deployed. */
  bundleId: number;
  /** Raw, native SCAPI create response, surfaced verbatim under `--json`. */
  raw: unknown;
}

/**
 * Creates (queues) a deployment via the SCAPI MRT Deployments API.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response
 *   (including 409 Conflict — the caller decides whether that is fatal).
 */
export async function createDeploymentScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; bundleId: number},
): Promise<CreateDeploymentScapiResult> {
  const logger = getLogger();
  const {storefrontId, environmentId, bundleId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId, bundleId}, '[MRT-SCAPI] Creating deployment');

  const client = buildScapiDeploymentsClient(conn);
  const {data, error, response} = await client.POST(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/deployments',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
      body: {bundleId},
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to deploy bundle ${bundleId}`);
  }

  return {deploymentId: data.deploymentId, status: data.status, bundleId, raw: data};
}

/**
 * Fetches a single deployment by ID via the SCAPI MRT Deployments API.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getDeploymentScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; deploymentId: string},
): Promise<DeploymentScapi> {
  const {storefrontId, environmentId, deploymentId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  const client = buildScapiDeploymentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/deployments/{deploymentId}',
    {
      params: {path: {organizationId, storefrontId, environmentId, deploymentId}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to get deployment ${deploymentId}`);
  }

  return data;
}

/** Progress info reported on each poll of {@link waitForDeploymentScapi}. */
export interface DeploymentScapiPollInfo {
  /** Seconds elapsed since waiting started. */
  elapsedSeconds: number;
  /** Current raw deployment status. */
  status: string;
  /** Human-readable stage description, when present. */
  description?: string;
  /** Percentage complete, when present. */
  percentage?: number | null;
}

/** Options for {@link waitForDeploymentScapi}. */
export interface WaitForDeploymentScapiOptions {
  storefrontId: string;
  environmentId: string;
  /** Deployment UUID returned by {@link createDeploymentScapi}. */
  deploymentId: string;
  /**
   * Polling interval in seconds.
   * @default 30
   */
  pollIntervalSeconds?: number;
  /**
   * Maximum time to wait in seconds (0 for no timeout).
   * @default 600
   */
  timeoutSeconds?: number;
  /** Optional callback invoked on each poll with current status. */
  onPoll?: (info: DeploymentScapiPollInfo) => void;
  /** Custom sleep function for testing. */
  sleep?: (ms: number) => Promise<void>;
  /** Custom clock for testing. Defaults to Date.now. */
  now?: () => number;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Polls a SCAPI deployment by ID until it reaches a terminal status
 * (`finished` or `failed`) or the timeout elapses.
 *
 * Uses `getDeploymentById`, which shares the `sfcc.storefront.deployments` read
 * scope with the list — a direct by-ID poll costs no extra scope over
 * list-polling and avoids page-scanning ambiguity.
 *
 * @throws Error if the timeout is reached or the deployment fails.
 */
export async function waitForDeploymentScapi(
  conn: ScapiMrtConnection,
  options: WaitForDeploymentScapiOptions,
): Promise<DeploymentScapi> {
  const logger = getLogger();
  const {storefrontId, environmentId, deploymentId, pollIntervalSeconds = 30, timeoutSeconds = 600, onPoll} = options;

  const sleepFn = options.sleep ?? defaultSleep;
  const nowFn = options.now ?? Date.now;
  const startTime = nowFn();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  logger.debug({deploymentId, pollIntervalSeconds, timeoutSeconds}, '[MRT-SCAPI] Waiting for deployment');

  // Poll immediately (before any sleep) so an already-finished deployment
  // returns without waiting a full interval, and so a timeout shorter than the
  // poll interval still gets at least one status check.
  while (true) {
    const elapsedSeconds = Math.round((nowFn() - startTime) / 1000);

    if (timeoutSeconds > 0 && nowFn() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for deployment "${deploymentId}" after ${timeoutSeconds}s`);
    }

    const deployment = await getDeploymentScapi(conn, {storefrontId, environmentId, deploymentId});
    const status = deployment.status ?? 'unknown';

    logger.trace({deploymentId, elapsedSeconds, status}, '[MRT-SCAPI] Deployment poll');
    onPoll?.({
      elapsedSeconds,
      status,
      description: deployment.progress?.description ?? undefined,
      percentage: deployment.progress?.percentage ?? undefined,
    });

    if (deployment.status && SCAPI_TERMINAL_STATUSES.has(deployment.status)) {
      if (deployment.status === 'failed') {
        const detail = deployment.statusMessage ? `: ${deployment.statusMessage}` : '';
        throw new Error(`Deployment ${deploymentId} failed${detail}`);
      }
      logger.debug({deploymentId, status: deployment.status}, '[MRT-SCAPI] Deployment reached terminal status');
      return deployment;
    }

    await sleepFn(pollIntervalMs);
  }
}

// ---------------------------------------------------------------------------
// Backend-aware deployment operations (route legacy ↔ SCAPI)
// ---------------------------------------------------------------------------

/** Options for {@link listMrtDeployments}. */
export interface ListMrtDeploymentsBackendOptions {
  /** Resolved `--mrt-backend` preference. */
  preference: MrtBackendPreference;
  /** SCAPI connection; when absent, `auto` uses legacy and `scapi` throws. */
  scapiConnection?: ScapiMrtConnection;
  /** Legacy API-key auth strategy. Optional; required only when the legacy backend actually runs. */
  legacyAuth?: AuthStrategy;
  /** Project slug (= SCAPI storefront ID). */
  projectSlug: string;
  /** Target/environment slug (= SCAPI environment ID). */
  targetSlug: string;
  /** Maximum results per page (forwarded to both backends; SCAPI caps at 200). */
  limit?: number;
  /** Pagination offset (forwarded to both backends). */
  offset?: number;
  /** Legacy MRT API origin. */
  origin?: string;
  /** Invoked when `auto` falls back from SCAPI to legacy. */
  onFallback?: (reason: string) => void;
  /** Invoked with the backend that serves the call (for `-D` debug). */
  onResolve?: (backend: MrtBackend) => void;
}

/** Backend-neutral deployment list result. */
export interface MrtDeploymentsView {
  /** Backend that served the list. */
  backend: MrtBackend;
  /** Total count reported by the backend. */
  count: number;
  /** Normalized deployment rows, consumed by the CLI table. */
  deployments: MrtDeploymentView[];
  /**
   * The raw, backend-native list response, surfaced verbatim under `--json` so
   * each backend keeps its original machine contract (legacy: the MRT Cloud API
   * list shape — `count`/`next`/`previous`/`deployments`; SCAPI: the Storefront
   * Deployments response — `data`/`total`). The normalized {@link deployments}
   * feed the human table only.
   */
  raw: unknown;
}

/**
 * Lists deployment history, routing to the SCAPI or legacy backend per the
 * given preference (with safe `auto` fallback). Returns normalized rows.
 */
export async function listMrtDeployments(options: ListMrtDeploymentsBackendOptions): Promise<MrtDeploymentsView> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    targetSlug,
    limit,
    offset,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{count: number; deployments: MrtDeploymentView[]; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        listDeploymentsScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: targetSlug,
          limit,
          offset,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await listDeployments({projectSlug, targetSlug, limit, offset, origin}, legacyAuth);
        // The legacy list result already mirrors the raw MRT Cloud API shape
        // (count/next/previous/deployments), so surface it verbatim under --json.
        return {count: result.count, deployments: result.deployments.map(normalizeLegacyDeployment), raw: result};
      },
    },
  );

  return {backend: run.backend, count: run.value.count, deployments: run.value.deployments, raw: run.value.raw};
}

/** Options for {@link deployMrtBundle}. */
export interface DeployMrtBundleBackendOptions {
  /** Resolved `--mrt-backend` preference. */
  preference: MrtBackendPreference;
  /** SCAPI connection; when absent, `auto` uses legacy and `scapi` throws. */
  scapiConnection?: ScapiMrtConnection;
  /** Legacy API-key auth strategy. Optional; required only when the legacy backend actually runs. */
  legacyAuth?: AuthStrategy;
  /** Project slug (= SCAPI storefront ID). */
  projectSlug: string;
  /** Target/environment slug (= SCAPI environment ID). */
  targetSlug: string;
  /** Bundle ID to deploy. */
  bundleId: number;
  /** Legacy MRT API origin. */
  origin?: string;
  /** Invoked when `auto` falls back from SCAPI to legacy. */
  onFallback?: (reason: string) => void;
  /** Invoked with the backend that serves the call (for `-D` debug). */
  onResolve?: (backend: MrtBackend) => void;
}

/** Backend-neutral deploy result. */
export interface MrtDeployResultView {
  /** Backend that served the deploy (pins the `--wait` strategy). */
  backend: MrtBackend;
  /** Bundle that was deployed. */
  bundleId: number;
  /** SCAPI deployment UUID for `--wait` polling; undefined for legacy. */
  deploymentId?: string;
  /** Initial deployment status. */
  status: string;
  /** Non-blocking warnings returned by the backend. */
  warnings?: string[];
  /**
   * The raw, backend-native create response, surfaced verbatim under `--json`
   * (legacy: the MRT Cloud API deploy result; SCAPI: the Storefront Deployments
   * create response). The typed fields above drive `--wait` and human output.
   */
  raw: unknown;
}

/**
 * Deploys an existing bundle, routing to the SCAPI or legacy backend per the
 * given preference (with safe `auto` fallback). The returned `backend` pins
 * which `--wait` strategy the caller should use.
 */
export async function deployMrtBundle(options: DeployMrtBundleBackendOptions): Promise<MrtDeployResultView> {
  const {preference, scapiConnection, legacyAuth, projectSlug, targetSlug, bundleId, origin, onFallback, onResolve} =
    options;

  const run = await runMrtWithFallback<MrtDeployResultView>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: async () => {
        const result = await createDeploymentScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: targetSlug,
          bundleId,
        });
        return {
          backend: 'scapi',
          bundleId,
          deploymentId: result.deploymentId,
          status: result.status ?? 'queued',
          raw: result.raw,
        };
      },
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await createDeployment({projectSlug, targetSlug, bundleId, origin}, legacyAuth);
        // `createDeployment` returns the synthesized legacy deploy result, which
        // is the shape legacy `--json` emitted before the backend split.
        return {backend: 'legacy', bundleId, status: result.status, warnings: result.warnings, raw: result};
      },
    },
  );

  return run.value;
}
