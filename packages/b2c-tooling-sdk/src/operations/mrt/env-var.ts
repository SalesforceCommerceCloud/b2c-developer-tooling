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
import {getLogger} from '../../logging/logger.js';

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
