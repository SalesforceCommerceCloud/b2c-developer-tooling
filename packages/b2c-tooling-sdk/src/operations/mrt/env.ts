/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Environment operations for Managed Runtime.
 *
 * Handles creating and managing MRT environments (targets).
 *
 * @module operations/mrt/env
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * MRT environment (target) type from API.
 */
export type MrtEnvironment = components['schemas']['APITargetV2Create'];

/**
 * Environment state from the MRT API.
 */
export type MrtEnvironmentState = components['schemas']['StateEnum'];

type SsrRegion = components['schemas']['SsrRegionEnum'];
type LogLevel = components['schemas']['LogLevelEnum'];

/**
 * Options for creating an MRT environment.
 */
export interface CreateEnvOptions {
  /**
   * The project slug to create the environment in.
   */
  projectSlug: string;

  /**
   * Environment slug/identifier (e.g., staging, production).
   */
  slug: string;

  /**
   * Display name for the environment.
   */
  name: string;

  /**
   * AWS region for SSR deployment.
   */
  region?: SsrRegion;

  /**
   * Mark as a production environment.
   */
  isProduction?: boolean;

  /**
   * Hostname pattern for V8 Tag loading.
   */
  hostname?: string;

  /**
   * Full external hostname (e.g., www.example.com).
   */
  externalHostname?: string;

  /**
   * External domain for Universal PWA SSR (e.g., example.com).
   */
  externalDomain?: string;

  /**
   * Forward HTTP cookies to origin.
   */
  allowCookies?: boolean;

  /**
   * Enable source map support in the environment.
   */
  enableSourceMaps?: boolean;

  /**
   * Minimum log level for the environment.
   */
  logLevel?: LogLevel;

  /**
   * IP whitelist (CIDR blocks, space-separated).
   */
  whitelistedIps?: string;

  /**
   * Proxy configurations for SSR.
   * Each proxy maps a path prefix to a backend host.
   */
  proxyConfigs?: Array<{
    /** The path prefix to proxy (e.g., 'api', 'ocapi', 'einstein'). */
    path: string;
    /** The backend host to proxy to (e.g., 'api.example.com'). */
    host: string;
  }>;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Creates a new environment (target) in an MRT project.
 *
 * @param options - Environment creation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The full environment object from the API
 * @throws Error if creation fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createEnv } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const env = await createEnv({
 *   projectSlug: 'my-storefront',
 *   slug: 'staging',
 *   name: 'Staging Environment',
 *   region: 'us-east-1',
 *   isProduction: false
 * }, auth);
 *
 * console.log(`Environment ${env.slug} created`);
 * ```
 */
export async function createEnv(options: CreateEnvOptions, auth: AuthStrategy): Promise<MrtEnvironment> {
  const logger = getLogger();
  const {projectSlug, slug, name, origin} = options;

  logger.debug({projectSlug, slug}, '[MRT] Creating environment');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  // Build the request body
  const body: MrtEnvironment = {
    slug,
    name,
    is_production: options.isProduction ?? false,
  };

  if (options.region) {
    body.ssr_region = options.region;
  }

  if (options.hostname) {
    body.hostname = options.hostname;
  }

  if (options.externalHostname) {
    body.ssr_external_hostname = options.externalHostname;
  }

  if (options.externalDomain) {
    body.ssr_external_domain = options.externalDomain;
  }

  if (options.allowCookies !== undefined) {
    body.allow_cookies = options.allowCookies;
  }

  if (options.enableSourceMaps !== undefined) {
    body.enable_source_maps = options.enableSourceMaps;
  }

  if (options.logLevel) {
    body.log_level = options.logLevel;
  }

  if (options.whitelistedIps) {
    body.ssr_whitelisted_ips = options.whitelistedIps;
  }

  if (options.proxyConfigs && options.proxyConfigs.length > 0) {
    // The API accepts ssr_proxy_configs - cast to handle the path field
    // which may not be in the generated types but is accepted by the API
    body.ssr_proxy_configs = options.proxyConfigs as typeof body.ssr_proxy_configs;
  }

  const {data, error} = await client.POST('/api/projects/{project_slug}/target/', {
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
    throw new Error(`Failed to create environment: ${errorMessage}`);
  }

  logger.debug({slug: data.slug, state: data.state}, '[MRT] Environment created successfully');

  return data;
}

/**
 * Options for deleting an MRT environment.
 */
export interface DeleteEnvOptions {
  /**
   * The project slug containing the environment.
   */
  projectSlug: string;

  /**
   * Environment slug/identifier to delete.
   */
  slug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Deletes an environment (target) from an MRT project.
 *
 * @param options - Environment deletion options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if deletion fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { deleteEnv } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * await deleteEnv({
 *   projectSlug: 'my-storefront',
 *   slug: 'feature-test'
 * }, auth);
 *
 * console.log('Environment deleted');
 * ```
 */
export async function deleteEnv(options: DeleteEnvOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, slug, origin} = options;

  logger.debug({projectSlug, slug}, '[MRT] Deleting environment');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/target/{target_slug}/', {
    params: {
      path: {project_slug: projectSlug, target_slug: slug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to delete environment: ${errorMessage}`);
  }

  logger.debug({slug}, '[MRT] Environment deleted successfully');
}

/**
 * Options for getting an MRT environment.
 */
export interface GetEnvOptions {
  /**
   * The project slug containing the environment.
   */
  projectSlug: string;

  /**
   * Environment slug/identifier to retrieve.
   */
  slug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets an environment (target) from an MRT project.
 *
 * @param options - Environment retrieval options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The environment object from the API
 * @throws Error if retrieval fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getEnv } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const env = await getEnv({
 *   projectSlug: 'my-storefront',
 *   slug: 'staging'
 * }, auth);
 *
 * console.log(`Environment state: ${env.state}`);
 * ```
 */
export async function getEnv(options: GetEnvOptions, auth: AuthStrategy): Promise<MrtEnvironment> {
  const logger = getLogger();
  const {projectSlug, slug, origin} = options;

  logger.debug({projectSlug, slug}, '[MRT] Getting environment');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/target/{target_slug}/', {
    params: {
      path: {project_slug: projectSlug, target_slug: slug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get environment: ${errorMessage}`);
  }

  logger.debug({slug: data.slug, state: data.state}, '[MRT] Environment retrieved');

  return data;
}

/**
 * Terminal states for MRT environments (no longer changing).
 */
const TERMINAL_STATES: MrtEnvironmentState[] = ['ACTIVE', 'CREATE_FAILED', 'PUBLISH_FAILED'];

/**
 * Options for waiting for an MRT environment to be ready.
 */
export interface WaitForEnvOptions extends GetEnvOptions {
  /**
   * Polling interval in milliseconds.
   * @default 10000
   */
  pollInterval?: number;

  /**
   * Maximum time to wait in milliseconds.
   * @default 2700000 (45 minutes)
   */
  timeout?: number;

  /**
   * Optional callback called on each poll with the current environment state.
   */
  onPoll?: (env: MrtEnvironment) => void;
}

/**
 * Waits for an environment to reach a terminal state (ACTIVE or failed).
 *
 * Polls the environment status until it reaches ACTIVE, CREATE_FAILED,
 * or PUBLISH_FAILED state, or until the timeout is reached.
 *
 * @param options - Wait options including polling interval and timeout
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The environment in its terminal state
 * @throws Error if timeout is reached or environment fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createEnv, waitForEnv } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * // Create environment
 * const env = await createEnv({
 *   projectSlug: 'my-storefront',
 *   slug: 'staging',
 *   name: 'Staging'
 * }, auth);
 *
 * // Wait for it to be ready
 * const readyEnv = await waitForEnv({
 *   projectSlug: 'my-storefront',
 *   slug: 'staging',
 *   timeout: 60000, // 1 minute
 *   onPoll: (e) => console.log(`State: ${e.state}`)
 * }, auth);
 *
 * if (readyEnv.state === 'ACTIVE') {
 *   console.log('Environment is ready!');
 * }
 * ```
 */
export async function waitForEnv(options: WaitForEnvOptions, auth: AuthStrategy): Promise<MrtEnvironment> {
  const logger = getLogger();
  const {projectSlug, slug, pollInterval = 10000, timeout = 2700000, onPoll, origin} = options;

  logger.debug({projectSlug, slug, pollInterval, timeout}, '[MRT] Waiting for environment');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const env = await getEnv({projectSlug, slug, origin}, auth);

    if (onPoll) {
      onPoll(env);
    }

    if (env.state && TERMINAL_STATES.includes(env.state as MrtEnvironmentState)) {
      if (env.state === 'CREATE_FAILED') {
        throw new Error(`Environment creation failed`);
      }
      if (env.state === 'PUBLISH_FAILED') {
        throw new Error(`Environment publish failed`);
      }
      logger.debug({slug, state: env.state}, '[MRT] Environment reached terminal state');
      return env;
    }

    logger.debug({slug, state: env.state, elapsed: Date.now() - startTime}, '[MRT] Environment still in progress');

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Timeout waiting for environment "${slug}" to be ready after ${timeout}ms`);
}

/**
 * MRT environment type for updates.
 */
export type MrtEnvironmentUpdate = components['schemas']['APITargetV2Update'];

/**
 * Patched environment for partial updates.
 */
export type PatchedMrtEnvironment = components['schemas']['PatchedAPITargetV2Update'];

/**
 * Options for listing MRT environments.
 */
export interface ListEnvsOptions {
  /**
   * The project slug to list environments for.
   */
  projectSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of listing environments.
 */
export interface ListEnvsResult {
  /**
   * Array of environments.
   */
  environments: MrtEnvironment[];
}

/**
 * Lists environments (targets) for an MRT project.
 *
 * @param options - List options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns List of environments
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listEnvs } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listEnvs({ projectSlug: 'my-storefront' }, auth);
 * for (const env of result.environments) {
 *   console.log(`- ${env.name} (${env.slug}): ${env.state}`);
 * }
 * ```
 */
export async function listEnvs(options: ListEnvsOptions, auth: AuthStrategy): Promise<ListEnvsResult> {
  const logger = getLogger();
  const {projectSlug, origin} = options;

  logger.debug({projectSlug}, '[MRT] Listing environments');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/target/', {
    params: {
      path: {project_slug: projectSlug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to list environments: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Environments listed');

  return {
    environments: data.results ?? [],
  };
}

/**
 * Options for updating an MRT environment.
 */
export interface UpdateEnvOptions {
  /**
   * The project slug containing the environment.
   */
  projectSlug: string;

  /**
   * Environment slug/identifier to update.
   */
  slug: string;

  /**
   * New display name for the environment.
   */
  name?: string;

  /**
   * Mark as a production environment.
   */
  isProduction?: boolean;

  /**
   * Hostname pattern for V8 Tag loading.
   */
  hostname?: string | null;

  /**
   * Full external hostname (e.g., www.example.com).
   */
  externalHostname?: string | null;

  /**
   * External domain for Universal PWA SSR (e.g., example.com).
   */
  externalDomain?: string | null;

  /**
   * Forward HTTP cookies to origin.
   */
  allowCookies?: boolean | null;

  /**
   * Enable source map support in the environment.
   */
  enableSourceMaps?: boolean | null;

  /**
   * Minimum log level for the environment.
   */
  logLevel?: LogLevel | null;

  /**
   * IP whitelist (CIDR blocks, space-separated).
   */
  whitelistedIps?: string | null;

  /**
   * Proxy configurations for SSR.
   */
  proxyConfigs?: Array<{
    path: string;
    host: string;
  }> | null;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Updates an environment (target) in an MRT project.
 *
 * Important: This endpoint automatically re-deploys the current bundle
 * if any of the SSR-related properties are changed.
 *
 * @param options - Environment update options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The updated environment
 * @throws Error if update fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { updateEnv } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const updated = await updateEnv({
 *   projectSlug: 'my-storefront',
 *   slug: 'staging',
 *   name: 'Staging v2',
 *   enableSourceMaps: true
 * }, auth);
 * ```
 */
export async function updateEnv(options: UpdateEnvOptions, auth: AuthStrategy): Promise<MrtEnvironmentUpdate> {
  const logger = getLogger();
  const {projectSlug, slug, origin} = options;

  logger.debug({projectSlug, slug}, '[MRT] Updating environment');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: PatchedMrtEnvironment = {};

  if (options.name !== undefined) {
    body.name = options.name;
  }

  if (options.isProduction !== undefined) {
    body.is_production = options.isProduction;
  }

  if (options.hostname !== undefined) {
    body.hostname = options.hostname;
  }

  if (options.externalHostname !== undefined) {
    body.ssr_external_hostname = options.externalHostname;
  }

  if (options.externalDomain !== undefined) {
    body.ssr_external_domain = options.externalDomain;
  }

  if (options.allowCookies !== undefined) {
    body.allow_cookies = options.allowCookies;
  }

  if (options.enableSourceMaps !== undefined) {
    body.enable_source_maps = options.enableSourceMaps;
  }

  if (options.logLevel !== undefined) {
    body.log_level = options.logLevel;
  }

  if (options.whitelistedIps !== undefined) {
    body.ssr_whitelisted_ips = options.whitelistedIps;
  }

  if (options.proxyConfigs !== undefined) {
    body.ssr_proxy_configs = options.proxyConfigs as typeof body.ssr_proxy_configs;
  }

  const {data, error} = await client.PATCH('/api/projects/{project_slug}/target/{target_slug}/', {
    params: {
      path: {project_slug: projectSlug, target_slug: slug},
    },
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to update environment: ${errorMessage}`);
  }

  logger.debug({slug: data.slug, state: data.state}, '[MRT] Environment updated');

  return data;
}
