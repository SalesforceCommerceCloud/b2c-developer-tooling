/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Environment variable operations for Managed Runtime.
 *
 * Handles listing, setting, and deleting environment variables
 * on MRT project environments.
 *
 * @module operations/mrt/env-var
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import {
  createStorefrontEnvironmentsClient,
  toOrganizationId,
  type StorefrontEnvironmentsClient,
  type EnvironmentVariableEntry,
} from '../../clients/storefront-environments.js';
import {getLogger} from '../../logging/logger.js';
import {
  runMrtWithFallback,
  type MrtBackend,
  type MrtBackendPreference,
  type ScapiMrtConnection,
} from './mrt-backend.js';

/**
 * Environment variable information returned from MRT.
 */
export interface EnvironmentVariable {
  /** Name of the environment variable */
  name: string;
  /** Masked value (only last few characters visible) */
  value: string;
  /** Email of user who created the variable */
  createdBy: string;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when last updated */
  updatedAt: string;
  /** Email of user who last updated the variable */
  updatedBy: string;
  /** Publishing status code */
  publishingStatus: number;
  /** Human-readable publishing status */
  publishingStatusDescription: string;
}

/**
 * Result of listing environment variables.
 */
export interface ListEnvVarsResult {
  /** Total count of environment variables */
  count: number;
  /** Environment variables */
  variables: EnvironmentVariable[];
}

/**
 * Options for environment variable operations.
 */
export interface EnvVarOptions {
  /** MRT project slug */
  projectSlug: string;
  /** Target environment (e.g., 'staging', 'production') */
  environment: string;
  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Lists environment variables for a project environment.
 *
 * @param options - Options specifying project and environment
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns List of environment variables
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listEnvVars } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listEnvVars({
 *   projectSlug: 'my-storefront',
 *   environment: 'production'
 * }, auth);
 *
 * for (const envVar of result.variables) {
 *   console.log(`${envVar.name}=${envVar.value}`);
 * }
 * ```
 */
export async function listEnvVars(options: EnvVarOptions, auth: AuthStrategy): Promise<ListEnvVarsResult> {
  const logger = getLogger();
  const {projectSlug, environment, origin} = options;

  logger.debug({projectSlug, environment}, '[MRT] Listing environment variables');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/target/{target_slug}/env-var/', {
    params: {
      path: {
        project_slug: projectSlug,
        target_slug: environment,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to list environment variables: ${JSON.stringify(error)}`);
  }

  // The API can return two formats:
  // 1. Paginated: { count, next, previous, results: [{ "VAR_NAME": {...} }, ...] }
  // 2. Direct object: { "VAR_NAME": {...}, "VAR_NAME2": {...}, ... }
  const variables: EnvironmentVariable[] = [];
  const responseData = data as Record<string, unknown>;

  // Check if it's the paginated format (has 'results' array)
  if (responseData?.results && Array.isArray(responseData.results)) {
    for (const item of responseData.results as Record<string, unknown>[]) {
      const entries = Object.entries(item);
      for (const [name, metadata] of entries) {
        const meta = metadata as Record<string, unknown>;
        variables.push(parseEnvVarMetadata(name, meta));
      }
    }
  } else if (responseData) {
    // Direct object format - each key is an env var name (skip pagination fields)
    const paginationFields = ['count', 'next', 'previous', 'results'];
    for (const [name, metadata] of Object.entries(responseData)) {
      if (paginationFields.includes(name)) continue;
      const meta = metadata as Record<string, unknown>;
      // Verify it looks like env var metadata (has 'value' property)
      if (meta && typeof meta === 'object' && 'value' in meta) {
        variables.push(parseEnvVarMetadata(name, meta));
      }
    }
  }

  logger.debug({count: variables.length}, '[MRT] Listed environment variables');

  return {
    count: typeof responseData?.count === 'number' ? responseData.count : variables.length,
    variables,
  };
}

/**
 * Parses environment variable metadata from API response.
 */
function parseEnvVarMetadata(name: string, meta: Record<string, unknown>): EnvironmentVariable {
  return {
    name,
    value: String(meta.value ?? ''),
    createdBy: String(meta.created_by ?? ''),
    createdAt: String(meta.created_at ?? ''),
    updatedAt: String(meta.updated_at ?? ''),
    updatedBy: String(meta.updated_by ?? ''),
    publishingStatus: Number(meta.publishing_status ?? 0),
    publishingStatusDescription: String(meta.publishing_status_description ?? ''),
  };
}

/**
 * Options for setting an environment variable.
 */
export interface SetEnvVarOptions extends EnvVarOptions {
  /** Environment variable name */
  key: string;
  /** Environment variable value */
  value: string;
}

/**
 * Sets an environment variable on a project environment.
 *
 * Creates the variable if it doesn't exist, or updates it if it does.
 *
 * @param options - Options specifying project, environment, and variable
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { setEnvVar } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * await setEnvVar({
 *   projectSlug: 'my-storefront',
 *   environment: 'production',
 *   key: 'API_KEY',
 *   value: 'secret-value'
 * }, auth);
 * ```
 */
export async function setEnvVar(options: SetEnvVarOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, environment, key, value, origin} = options;

  logger.debug({projectSlug, environment, key}, '[MRT] Setting environment variable');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.PATCH('/api/projects/{project_slug}/target/{target_slug}/env-var/', {
    params: {
      path: {
        project_slug: projectSlug,
        target_slug: environment,
      },
    },
    body: {
      [key]: {value},
    },
  });

  if (error) {
    throw new Error(`Failed to set environment variable: ${JSON.stringify(error)}`);
  }

  logger.debug({projectSlug, environment, key}, '[MRT] Environment variable set');
}

/**
 * Options for setting multiple environment variables.
 */
export interface SetEnvVarsOptions extends EnvVarOptions {
  /** Environment variables to set as key-value pairs */
  variables: Record<string, string>;
}

/**
 * Sets multiple environment variables on a project environment.
 *
 * Creates variables if they don't exist, or updates them if they do.
 *
 * @param options - Options specifying project, environment, and variables
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { setEnvVars } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * await setEnvVars({
 *   projectSlug: 'my-storefront',
 *   environment: 'production',
 *   variables: {
 *     API_KEY: 'secret-value',
 *     DEBUG: 'false'
 *   }
 * }, auth);
 * ```
 */
export async function setEnvVars(options: SetEnvVarsOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, environment, variables, origin} = options;

  const keys = Object.keys(variables);
  logger.debug({projectSlug, environment, count: keys.length}, '[MRT] Setting environment variables');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  // Build body with {key: {value}} format for each variable
  const body: Record<string, {value: string}> = {};
  for (const [key, value] of Object.entries(variables)) {
    body[key] = {value};
  }

  const {error} = await client.PATCH('/api/projects/{project_slug}/target/{target_slug}/env-var/', {
    params: {
      path: {
        project_slug: projectSlug,
        target_slug: environment,
      },
    },
    body,
  });

  if (error) {
    throw new Error(`Failed to set environment variables: ${JSON.stringify(error)}`);
  }

  logger.debug({projectSlug, environment, keys}, '[MRT] Environment variables set');
}

/**
 * Options for deleting an environment variable.
 */
export interface DeleteEnvVarOptions extends EnvVarOptions {
  /** Environment variable name to delete */
  key: string;
}

/**
 * Deletes an environment variable from a project environment.
 *
 * @param options - Options specifying project, environment, and variable name
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { deleteEnvVar } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * await deleteEnvVar({
 *   projectSlug: 'my-storefront',
 *   environment: 'production',
 *   key: 'OLD_API_KEY'
 * }, auth);
 * ```
 */
export async function deleteEnvVar(options: DeleteEnvVarOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, environment, key, origin} = options;

  logger.debug({projectSlug, environment, key}, '[MRT] Deleting environment variable');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.PATCH('/api/projects/{project_slug}/target/{target_slug}/env-var/', {
    params: {
      path: {
        project_slug: projectSlug,
        target_slug: environment,
      },
    },
    body: {
      [key]: {value: null},
    },
  });

  if (error) {
    throw new Error(`Failed to delete environment variable: ${JSON.stringify(error)}`);
  }

  logger.debug({projectSlug, environment, key}, '[MRT] Environment variable deleted');
}

// ---------------------------------------------------------------------------
// Backend-neutral env-var view + SCAPI MRT operations
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
 * A single environment variable row, normalized across the legacy and SCAPI
 * backends so the CLI table renders one shape regardless of backend.
 *
 * Values stay masked (both backends return masked values) — the CLI never
 * displays or reconstructs plaintext. Status is kept as the backend's own
 * string (legacy `publishingStatusDescription`, SCAPI `publishingStatus` enum)
 * so display doesn't silently change for existing legacy users.
 */
export interface MrtEnvVarView {
  /** Variable name. */
  name: string;
  /** Masked value. */
  value: string;
  /** Human-readable publishing status, when the backend reports one. */
  status?: string;
  /** Last-updated timestamp (ISO 8601), when present. */
  updatedAt?: string;
  /** Email of the user who last updated the variable, when present. */
  updatedBy?: string;
  /** Backend that produced this row. */
  backend: MrtBackend;
}

/** Normalizes a legacy MRT {@link EnvironmentVariable} into an {@link MrtEnvVarView}. */
export function normalizeLegacyEnvVar(variable: EnvironmentVariable): MrtEnvVarView {
  return {
    name: variable.name,
    value: variable.value,
    status: variable.publishingStatusDescription || undefined,
    updatedAt: variable.updatedAt || undefined,
    updatedBy: variable.updatedBy || undefined,
    backend: 'legacy',
  };
}

/** Normalizes a SCAPI {@link EnvironmentVariableEntry} (plus its name) into an {@link MrtEnvVarView}. */
export function normalizeEnvVarScapi(name: string, entry: EnvironmentVariableEntry): MrtEnvVarView {
  return {
    name,
    value: entry.value ?? '',
    status: entry.publishingStatus ?? undefined,
    updatedAt: entry.lastModified ?? undefined,
    updatedBy: entry.lastModifiedBy ?? undefined,
    backend: 'scapi',
  };
}

function buildScapiEnvironmentsClient(conn: ScapiMrtConnection): StorefrontEnvironmentsClient {
  return createStorefrontEnvironmentsClient({shortCode: conn.shortCode, tenantId: conn.tenantId}, conn.auth);
}

/**
 * Lists environment variables for an environment via the SCAPI MRT Environments
 * API. The response is a singleton map keyed by variable name (masked values,
 * not paginated).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getEnvironmentVariablesScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string},
): Promise<{variables: MrtEnvVarView[]; count: number; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId}, '[MRT-SCAPI] Listing environment variables');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/environment-variables',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to list environment variables');
  }

  const variables = Object.entries(data).map(([name, entry]) => normalizeEnvVarScapi(name, entry));

  return {variables, count: variables.length, raw: data};
}

/**
 * Updates environment variables via the SCAPI MRT Environments API using a
 * merge-PATCH: a present key is created/replaced, a `null` value deletes the
 * key, and omitted keys are left unchanged. The endpoint returns 204 No Content
 * on success — there is no response body, so only `error` is inspected.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function updateEnvironmentVariablesScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; variables: Record<string, string | null>},
): Promise<void> {
  const logger = getLogger();
  const {storefrontId, environmentId, variables} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  const body: Record<string, {value: string | null}> = {};
  for (const [key, value] of Object.entries(variables)) {
    body[key] = {value};
  }

  logger.debug(
    {organizationId, storefrontId, environmentId, keys: Object.keys(variables)},
    '[MRT-SCAPI] Updating environment variables',
  );

  const client = buildScapiEnvironmentsClient(conn);
  // 204 No Content on success: no `data` is returned, so check `error` only —
  // treating missing `data` as failure (as the deployments read/create ops do)
  // would wrongly reject a successful update.
  const {error, response} = await client.PATCH(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/environment-variables',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
      body,
    },
  );

  if (error) {
    throw createScapiRequestError(error, response, 'Failed to update environment variables');
  }
}

// ---------------------------------------------------------------------------
// Backend-aware env-var operations (route legacy ↔ SCAPI)
// ---------------------------------------------------------------------------

/** Common backend-routing options shared by the backend-aware env-var operations. */
export interface EnvVarBackendOptions {
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

/** Backend-neutral env-var list result. */
export interface MrtEnvVarsView {
  /** Backend that served the list. */
  backend: MrtBackend;
  /** Number of variables. */
  count: number;
  /** Normalized variable rows, consumed by the CLI table. */
  variables: MrtEnvVarView[];
  /**
   * The raw, backend-native list response, surfaced verbatim under `--json` so
   * each backend keeps its original machine contract (legacy: the
   * {@link ListEnvVarsResult} shape — `count`/`variables`; SCAPI: the map keyed
   * by variable name). The normalized {@link variables} feed the human table only.
   */
  raw: unknown;
}

/** The backend that served a write operation. */
export interface MrtEnvVarWriteResult {
  /** Backend that served the write. */
  backend: MrtBackend;
}

/**
 * Lists environment variables, routing to the SCAPI or legacy backend per the
 * given preference (with safe `auto` fallback). Returns normalized rows.
 */
export async function listEnvVarsWithBackend(options: EnvVarBackendOptions): Promise<MrtEnvVarsView> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, origin, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{count: number; variables: MrtEnvVarView[]; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        getEnvironmentVariablesScapi(scapiConnection!, {storefrontId: projectSlug, environmentId: environment}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await listEnvVars({projectSlug, environment, origin}, legacyAuth);
        // The legacy list result is the shape legacy `--json` emitted before the
        // backend split, so surface it verbatim under --json.
        return {count: result.count, variables: result.variables.map(normalizeLegacyEnvVar), raw: result};
      },
    },
  );

  return {backend: run.backend, count: run.value.count, variables: run.value.variables, raw: run.value.raw};
}

/** Options for {@link setEnvVarsWithBackend}. */
export interface SetEnvVarsBackendOptions extends EnvVarBackendOptions {
  /** Environment variables to set as key-value pairs (merge; omitted keys preserved). */
  variables: Record<string, string>;
}

/**
 * Sets multiple environment variables (merge), routing to the SCAPI or legacy
 * backend per the given preference (with safe `auto` fallback).
 */
export async function setEnvVarsWithBackend(options: SetEnvVarsBackendOptions): Promise<MrtEnvVarWriteResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, variables, origin, onFallback, onResolve} =
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
        updateEnvironmentVariablesScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          variables,
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        await setEnvVars({projectSlug, environment, variables, origin}, legacyAuth);
      },
    },
  );

  return {backend: run.backend};
}

/** Options for {@link setEnvVarWithBackend}. */
export interface SetEnvVarBackendOptions extends EnvVarBackendOptions {
  /** Environment variable name. */
  key: string;
  /** Environment variable value. */
  value: string;
}

/**
 * Sets a single environment variable, routing to the SCAPI or legacy backend
 * per the given preference (with safe `auto` fallback).
 */
export async function setEnvVarWithBackend(options: SetEnvVarBackendOptions): Promise<MrtEnvVarWriteResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, key, value, origin, onFallback, onResolve} =
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
        updateEnvironmentVariablesScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          variables: {[key]: value},
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        await setEnvVar({projectSlug, environment, key, value, origin}, legacyAuth);
      },
    },
  );

  return {backend: run.backend};
}

/** Options for {@link deleteEnvVarWithBackend}. */
export interface DeleteEnvVarBackendOptions extends EnvVarBackendOptions {
  /** Environment variable name to delete. */
  key: string;
}

/**
 * Deletes a single environment variable (merge-PATCH `null` on SCAPI), routing
 * to the SCAPI or legacy backend per the given preference (with safe `auto`
 * fallback).
 */
export async function deleteEnvVarWithBackend(options: DeleteEnvVarBackendOptions): Promise<MrtEnvVarWriteResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, key, origin, onFallback, onResolve} =
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
        updateEnvironmentVariablesScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          variables: {[key]: null},
        }),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        await deleteEnvVar({projectSlug, environment, key, origin}, legacyAuth);
      },
    },
  );

  return {backend: run.backend};
}
