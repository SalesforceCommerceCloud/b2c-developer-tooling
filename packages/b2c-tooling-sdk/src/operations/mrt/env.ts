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
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import {
  createStorefrontEnvironmentsClient,
  toOrganizationId,
  type StorefrontEnvironmentsClient,
  type Environment as ScapiEnvironment,
  type EnvironmentUpdateRequest as ScapiEnvironmentUpdateRequest,
} from '../../clients/storefront-environments.js';
import {invalidateCache} from './cache.js';
import {getLogger} from '../../logging/logger.js';
import {
  runMrtWithFallback,
  type MrtBackend,
  type MrtBackendPreference,
  type ScapiMrtConnection,
} from './mrt-backend.js';

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
 * Poll info passed to the onPoll callback during environment waiting.
 */
export interface WaitForEnvPollInfo {
  /** Environment slug. */
  slug: string;
  /** Seconds elapsed since waiting started. */
  elapsedSeconds: number;
  /** Current environment state (e.g., 'PUBLISH_IN_PROGRESS', 'ACTIVE'). */
  state: string;
}

/**
 * Options for waiting for an MRT environment to be ready.
 */
export interface WaitForEnvOptions extends GetEnvOptions {
  /**
   * Polling interval in seconds.
   * @default 10
   */
  pollIntervalSeconds?: number;

  /**
   * Maximum time to wait in seconds (0 for no timeout).
   * @default 2700 (45 minutes)
   */
  timeoutSeconds?: number;

  /**
   * Optional callback invoked on each poll with current status.
   */
  onPoll?: (info: WaitForEnvPollInfo) => void;

  /**
   * Custom sleep function for testing.
   */
  sleep?: (ms: number) => Promise<void>;

  /**
   * Custom clock for testing. Defaults to Date.now.
   */
  now?: () => number;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
 *   timeoutSeconds: 60,
 *   onPoll: (info) => console.log(`[${info.elapsedSeconds}s] State: ${info.state}`)
 * }, auth);
 *
 * if (readyEnv.state === 'ACTIVE') {
 *   console.log('Environment is ready!');
 * }
 * ```
 */
export async function waitForEnv(options: WaitForEnvOptions, auth: AuthStrategy): Promise<MrtEnvironment> {
  const logger = getLogger();
  const {projectSlug, slug, pollIntervalSeconds = 10, timeoutSeconds = 2700, onPoll, origin} = options;

  const sleepFn = options.sleep ?? defaultSleep;
  const nowFn = options.now ?? Date.now;
  const startTime = nowFn();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  logger.debug({projectSlug, slug, pollIntervalSeconds, timeoutSeconds}, '[MRT] Waiting for environment');

  await sleepFn(pollIntervalMs);

  while (true) {
    const elapsedSeconds = Math.round((nowFn() - startTime) / 1000);

    if (timeoutSeconds > 0 && nowFn() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for environment "${slug}" after ${timeoutSeconds}s`);
    }

    const env = await getEnv({projectSlug, slug, origin}, auth);
    const currentState = (env.state as string) ?? 'unknown';

    logger.trace({slug, elapsedSeconds, state: currentState}, '[MRT] Environment poll');
    onPoll?.({slug, elapsedSeconds, state: currentState});

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

    await sleepFn(pollIntervalMs);
  }
}

/**
 * MRT environment type for updates.
 */
export type MrtEnvironmentUpdate = components['schemas']['APITargetV2Update'];

/**
 * Options for cloning an MRT environment.
 */
export interface CloneEnvOptions {
  /**
   * The project slug containing the source and new environment.
   */
  projectSlug: string;

  /**
   * Slug for the new environment created by the clone.
   */
  slug: string;

  /**
   * Slug of the source environment to clone from.
   */
  fromSlug: string;

  /**
   * Full external hostname (e.g., www.example.com).
   * Required when not using an MRT-managed certificate.
   */
  externalHostname?: string | null;

  /**
   * External domain for Universal PWA SSR (e.g., example.com).
   */
  externalDomain?: string | null;

  /**
   * ID of the certificate to associate with the new environment.
   * Required when using a custom domain.
   */
  certificateId?: number | null;

  /**
   * Clone redirects from the source environment.
   * @default false
   */
  cloneRedirects?: boolean;

  /**
   * Clone environment variables from the source environment.
   * @default false
   */
  cloneEnvironmentVariables?: boolean;

  /**
   * Clone B2C target info from the source environment.
   * @default false
   */
  cloneB2cTargetInfo?: boolean;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Clones an environment (target) from an existing source environment.
 *
 * The new environment receives the source's configuration (excluding proxies and
 * production flag) and is automatically deployed with the same bundle as the
 * source target's current deployment (if any).
 *
 * @param options - Clone options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The newly created environment
 * @throws Error if the clone fails
 *
 * @example
 * ```typescript
 * const env = await cloneEnv({
 *   projectSlug: 'my-storefront',
 *   slug: 'staging-copy',
 *   fromSlug: 'staging',
 *   cloneRedirects: true,
 *   cloneEnvironmentVariables: true
 * }, auth);
 * ```
 */
export async function cloneEnv(options: CloneEnvOptions, auth: AuthStrategy): Promise<MrtEnvironment> {
  const logger = getLogger();
  const {projectSlug, slug, fromSlug, origin} = options;

  logger.debug({projectSlug, slug, fromSlug}, '[MRT] Cloning environment');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: components['schemas']['APITargetV2Clone'] = {
    from_target_slug: fromSlug,
    clone_redirects: options.cloneRedirects ?? false,
    clone_environment_variables: options.cloneEnvironmentVariables ?? false,
    clone_b2c_target_info: options.cloneB2cTargetInfo ?? false,
  };

  if (options.externalHostname !== undefined) {
    body.ssr_external_hostname = options.externalHostname;
  }

  if (options.externalDomain !== undefined) {
    body.ssr_external_domain = options.externalDomain;
  }

  if (options.certificateId !== undefined) {
    body.certificate_id = options.certificateId;
  }

  const {data, error} = await client.POST('/api/projects/{project_slug}/target/{target_slug}/clone/', {
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
    throw new Error(`Failed to clone environment: ${errorMessage}`);
  }

  // The OpenAPI spec types this response as APITargetV2Clone (the request body schema),
  // but the API actually returns a target object (slug, name, state, ssr_*, etc.).
  // Cast through unknown rather than re-fetching to avoid a second round-trip.
  logger.debug({slug, fromSlug}, '[MRT] Environment cloned successfully');

  return data as unknown as MrtEnvironment;
}

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
   * Forward the original client User-Agent header to proxy origins instead of
   * overwriting it with "Amazon CloudFront".
   */
  preserveProxyUserAgent?: boolean | null;

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

  if (options.preserveProxyUserAgent !== undefined) {
    body.preserve_proxy_user_agent = options.preserveProxyUserAgent;
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

// ---------------------------------------------------------------------------
// Backend-neutral environment view + SCAPI MRT lifecycle operations
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
 * The legacy MRT Cloud API has no concept of a storefront "primary" environment,
 * so `mrt env set-primary` is a SCAPI-only operation. The legacy branch of the
 * backend-aware wrapper raises this.
 */
const SET_PRIMARY_LEGACY_UNSUPPORTED_MESSAGE =
  'Setting a primary environment is only supported on the SCAPI MRT backend. ' +
  'Re-run with --mrt-backend scapi (or auto with the SCAPI MRT backend configured).';

/**
 * An MRT environment (= SCAPI storefront environment / legacy target), normalized
 * across the legacy and SCAPI backends so the CLI renders one shape regardless of
 * backend.
 *
 * Fields that only one backend reports are optional: `isPrimary`/`origin`/
 * timestamps are SCAPI-only; the status and region strings are kept in each
 * backend's own form (legacy `state`/`ssr_region`, SCAPI `status`/`ssrRegion`) so
 * display doesn't silently change for existing legacy users.
 */
export interface MrtEnvironmentView {
  /** Environment slug (= SCAPI environment ID). */
  id: string;
  /** Environment display name (legacy `name`, SCAPI `displayName`). */
  name: string;
  /** Lifecycle status (legacy `state`, SCAPI `status`), when reported. */
  status?: string;
  /** Whether this is the storefront's primary environment (SCAPI only). */
  isPrimary?: boolean;
  /** Default SSR region, in the backend's own form, when reported. */
  region?: string;
  /** SSR architecture (`x86`/`arm64`), when reported. */
  architecture?: string | null;
  /** Whether the environment is provisioned with production-tier capacity. */
  isProduction?: boolean;
  /** Managed Runtime origin URL that backs the environment (SCAPI only). */
  origin?: string | null;
  /** Creation timestamp (ISO 8601), when present (SCAPI only). */
  createdAt?: string;
  /** Last-modified timestamp (ISO 8601), when present (SCAPI only). */
  updatedAt?: string;
  /** Backend that produced this row. */
  backend: MrtBackend;
}

/** Normalizes a legacy MRT environment ({@link MrtEnvironment}) into a {@link MrtEnvironmentView}. */
export function normalizeLegacyEnv(env: MrtEnvironment | MrtEnvironmentUpdate): MrtEnvironmentView {
  const e = env as MrtEnvironmentUpdate;
  return {
    id: e.slug ?? '',
    name: e.name ?? '',
    status: (e.state as string) || undefined,
    region: e.ssr_region || undefined,
    architecture: e.ssr_architecture ?? undefined,
    isProduction: e.is_production ?? undefined,
    backend: 'legacy',
  };
}

/** Normalizes a SCAPI {@link ScapiEnvironment} into a {@link MrtEnvironmentView}. */
export function normalizeEnvironmentScapi(env: ScapiEnvironment): MrtEnvironmentView {
  return {
    id: env.environmentId,
    name: env.displayName,
    status: env.status || undefined,
    isPrimary: env.isPrimary,
    region: env.ssrRegion || undefined,
    architecture: env.ssrArchitecture ?? undefined,
    isProduction: env.isProduction ?? undefined,
    origin: env.mrtOrigin ?? undefined,
    createdAt: env.creationDate ?? undefined,
    updatedAt: env.lastModified ?? undefined,
    backend: 'scapi',
  };
}

function buildScapiEnvironmentsClient(conn: ScapiMrtConnection): StorefrontEnvironmentsClient {
  return createStorefrontEnvironmentsClient({shortCode: conn.shortCode, tenantId: conn.tenantId}, conn.auth);
}

/**
 * Lists the environments for a storefront via the SCAPI MRT Environments API.
 * Forwards the standard SCAPI `limit`/`offset` pagination (max 200 per page,
 * default 25 server-side; the response echoes the full `total`).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getEnvironmentsScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; limit?: number; offset?: number},
): Promise<{environments: MrtEnvironmentView[]; count: number; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, limit, offset} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, limit, offset}, '[MRT-SCAPI] Listing environments');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments',
    {
      params: {path: {organizationId, storefrontId}, query: {limit, offset}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to list environments');
  }

  return {
    environments: (data.data ?? []).map(normalizeEnvironmentScapi),
    count: data.total ?? data.data?.length ?? 0,
    raw: data,
  };
}

/**
 * Creates an environment via the SCAPI MRT Environments API. Returns 202 Accepted
 * with the environment in the `building` status; poll by ID to track
 * provisioning. SCAPI only accepts the display name on create.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function createEnvironmentScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; displayName: string},
): Promise<{environment: MrtEnvironmentView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, displayName} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId}, '[MRT-SCAPI] Creating environment');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.POST(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments',
    {
      params: {path: {organizationId, storefrontId}},
      headers: WRITE_HEADERS,
      body: {displayName},
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to create environment');
  }

  return {environment: normalizeEnvironmentScapi(data), raw: data};
}

/** The optional clone flags a SCAPI environment clone accepts. */
export interface CloneEnvironmentFlagsScapi {
  cloneEnvironmentVariables?: boolean;
  cloneRedirects?: boolean;
  cloneB2cTargetInfo?: boolean;
}

/**
 * Clones an environment via the SCAPI MRT Environments API. Returns 202 Accepted
 * with the new environment in the `building` status; the clone always starts as a
 * non-primary environment.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function cloneEnvironmentScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; sourceEnvironmentId: string; displayName: string} & CloneEnvironmentFlagsScapi,
): Promise<{environment: MrtEnvironmentView; raw: unknown}> {
  const logger = getLogger();
  const {
    storefrontId,
    sourceEnvironmentId,
    displayName,
    cloneEnvironmentVariables,
    cloneRedirects,
    cloneB2cTargetInfo,
  } = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, sourceEnvironmentId}, '[MRT-SCAPI] Cloning environment');

  const body: Record<string, unknown> = {sourceEnvironmentId, displayName};
  if (cloneEnvironmentVariables !== undefined) {
    body.cloneEnvironmentVariables = cloneEnvironmentVariables;
  }
  if (cloneRedirects !== undefined) {
    body.cloneRedirects = cloneRedirects;
  }
  if (cloneB2cTargetInfo !== undefined) {
    body.cloneB2cTargetInfo = cloneB2cTargetInfo;
  }

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.POST(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/clone',
    {
      params: {path: {organizationId, storefrontId}},
      headers: WRITE_HEADERS,
      body: body as never,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, 'Failed to clone environment');
  }

  return {environment: normalizeEnvironmentScapi(data), raw: data};
}

/**
 * Fetches a single environment by ID via the SCAPI MRT Environments API.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function getEnvironmentByIdScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string},
): Promise<{environment: MrtEnvironmentView; raw: unknown}> {
  const {storefrontId, environmentId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.GET(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: READ_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to get environment ${environmentId}`);
  }

  return {environment: normalizeEnvironmentScapi(data), raw: data};
}

/**
 * SCAPI environment statuses that are terminal for a build/clone (no longer
 * changing). A freshly created or cloned environment starts in `building`.
 */
const SCAPI_ENV_TERMINAL_STATUSES = new Set(['ready', 'build_failed']);

/** Progress info reported on each poll of {@link waitForEnvironmentScapi}. */
export interface EnvironmentScapiPollInfo {
  /** Seconds elapsed since waiting started. */
  elapsedSeconds: number;
  /** Current environment status. */
  status: string;
}

/** Options for {@link waitForEnvironmentScapi}. */
export interface WaitForEnvironmentScapiOptions {
  storefrontId: string;
  environmentId: string;
  /**
   * Polling interval in seconds.
   * @default 10
   */
  pollIntervalSeconds?: number;
  /**
   * Maximum time to wait in seconds (0 for no timeout).
   * @default 600
   */
  timeoutSeconds?: number;
  /** Optional callback invoked on each poll with current status. */
  onPoll?: (info: EnvironmentScapiPollInfo) => void;
  /** Custom sleep function for testing. */
  sleep?: (ms: number) => Promise<void>;
  /** Custom clock for testing. Defaults to Date.now. */
  now?: () => number;
}

/**
 * Polls a SCAPI environment by ID until it reaches a terminal build status
 * (`ready` or `build_failed`) or the timeout elapses. Backs `mrt env clone
 * --wait` on the SCAPI backend, mirroring {@link waitForDeploymentScapi}: a
 * by-ID poll shares the environments read scope, so it costs no extra scope.
 *
 * @throws {Error} if the timeout is reached or the environment build fails.
 */
export async function waitForEnvironmentScapi(
  conn: ScapiMrtConnection,
  options: WaitForEnvironmentScapiOptions,
): Promise<{environment: MrtEnvironmentView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, pollIntervalSeconds = 10, timeoutSeconds = 600, onPoll} = options;

  const sleepFn = options.sleep ?? defaultSleep;
  const nowFn = options.now ?? Date.now;
  const startTime = nowFn();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  logger.debug({environmentId, pollIntervalSeconds, timeoutSeconds}, '[MRT-SCAPI] Waiting for environment');

  // Poll immediately (before any sleep) so an already-ready environment returns
  // without waiting a full interval, and so a timeout shorter than the poll
  // interval still gets at least one status check.
  while (true) {
    const elapsedSeconds = Math.round((nowFn() - startTime) / 1000);

    if (timeoutSeconds > 0 && nowFn() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for environment "${environmentId}" after ${timeoutSeconds}s`);
    }

    const result = await getEnvironmentByIdScapi(conn, {storefrontId, environmentId});
    const status = result.environment.status ?? 'unknown';

    logger.trace({environmentId, elapsedSeconds, status}, '[MRT-SCAPI] Environment poll');
    onPoll?.({elapsedSeconds, status});

    if (SCAPI_ENV_TERMINAL_STATUSES.has(status)) {
      if (status === 'build_failed') {
        throw new Error(`Environment ${environmentId} build failed`);
      }
      logger.debug({environmentId, status}, '[MRT-SCAPI] Environment reached terminal status');
      return result;
    }

    await sleepFn(pollIntervalMs);
  }
}

/**
 * Updates an environment via the SCAPI MRT Environments API. Only the supplied
 * fields change (200 OK returns the updated environment). The `mrt env update`
 * command only exposes the display name, but the SCAPI contract (and this
 * function) accept the full update surface.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function updateEnvironmentScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; changes: ScapiEnvironmentUpdateRequest},
): Promise<{environment: MrtEnvironmentView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId, changes} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId}, '[MRT-SCAPI] Updating environment');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.PATCH(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
      body: changes,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to update environment ${environmentId}`);
  }

  return {environment: normalizeEnvironmentScapi(data), raw: data};
}

/**
 * Deletes an environment by ID via the SCAPI MRT Environments API. Returns 202
 * Accepted with the environment in the `deleting` status; poll by ID to track
 * deletion.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function deleteEnvironmentScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string},
): Promise<{environment?: MrtEnvironmentView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId}, '[MRT-SCAPI] Deleting environment');

  const client = buildScapiEnvironmentsClient(conn);
  // 202 Accepted returns the environment in the deleting status. Inspect `error`
  // only: a successful queued delete must not be rejected for a missing body.
  const {data, error, response} = await client.DELETE(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
    },
  );

  if (error) {
    throw createScapiRequestError(error, response, `Failed to delete environment ${environmentId}`);
  }

  return {environment: data ? normalizeEnvironmentScapi(data) : undefined, raw: data ?? null};
}

/**
 * Sets an environment as the storefront's primary environment via the SCAPI MRT
 * Environments API. The environment must be `ready` or `build_failed`;
 * idempotent (200 OK returns the environment).
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function setPrimaryEnvironmentScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string},
): Promise<{environment: MrtEnvironmentView; raw: unknown}> {
  const logger = getLogger();
  const {storefrontId, environmentId} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId}, '[MRT-SCAPI] Setting primary environment');

  const client = buildScapiEnvironmentsClient(conn);
  const {data, error, response} = await client.PUT(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/primary',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
    },
  );

  if (error || !data) {
    throw createScapiRequestError(error, response, `Failed to set environment ${environmentId} as primary`);
  }

  return {environment: normalizeEnvironmentScapi(data), raw: data};
}

/**
 * Triggers a CDN cache invalidation on an environment via the SCAPI MRT
 * Environments API. Fire-and-forget: returns 202 Accepted with an empty body, so
 * there is nothing to poll and no payload to surface.
 *
 * @throws {ScapiRequestError} carrying the HTTP status on a non-2xx response.
 */
export async function createCacheInvalidationScapi(
  conn: ScapiMrtConnection,
  params: {storefrontId: string; environmentId: string; pattern: string},
): Promise<void> {
  const logger = getLogger();
  const {storefrontId, environmentId, pattern} = params;
  const organizationId = toOrganizationId(conn.tenantId);

  logger.debug({organizationId, storefrontId, environmentId, pattern}, '[MRT-SCAPI] Creating cache invalidation');

  const client = buildScapiEnvironmentsClient(conn);
  // 202 Accepted with no body on success. openapi-fetch only short-circuits empty
  // bodies on 204 / Content-Length: 0, so parse as text to avoid a JSON.parse
  // throw on the empty 202; then check `error` only.
  const {error, response} = await client.POST(
    '/organizations/{organizationId}/storefronts/{storefrontId}/environments/{environmentId}/cache-invalidations',
    {
      params: {path: {organizationId, storefrontId, environmentId}},
      headers: WRITE_HEADERS,
      body: {pattern},
      parseAs: 'text',
    },
  );

  if (error) {
    throw createScapiRequestError(error, response, 'Failed to trigger cache invalidation');
  }
}

// ---------------------------------------------------------------------------
// Backend-aware environment lifecycle operations (route legacy ↔ SCAPI)
// ---------------------------------------------------------------------------

/** Common backend-routing options shared by the backend-aware environment operations. */
export interface EnvBackendOptions {
  /** Resolved `--mrt-backend` preference. */
  preference: MrtBackendPreference;
  /** SCAPI connection; when absent, `auto` uses legacy and `scapi` throws. */
  scapiConnection?: ScapiMrtConnection;
  /** Legacy API-key auth strategy. Optional; required only when the legacy backend actually runs. */
  legacyAuth?: AuthStrategy;
  /** Project slug (= SCAPI storefront ID). */
  projectSlug: string;
  /** Legacy MRT API origin. */
  origin?: string;
  /** Invoked when `auto` falls back from SCAPI to legacy. */
  onFallback?: (reason: string) => void;
  /** Invoked with the backend that serves the call (for `-D` debug). */
  onResolve?: (backend: MrtBackend) => void;
}

/** Backend-neutral environment list result. */
export interface MrtEnvironmentsView {
  /** Backend that served the list. */
  backend: MrtBackend;
  /** Number of environments (SCAPI `total`, else the row count). */
  count: number;
  /** Normalized environment rows, consumed by the CLI table. */
  environments: MrtEnvironmentView[];
  /**
   * The raw, backend-native list response, surfaced verbatim under `--json` so
   * each backend keeps its original machine contract (legacy: the
   * {@link ListEnvsResult} shape; SCAPI: the paginated
   * `{limit, offset, total, data}` envelope). The normalized {@link environments}
   * feed the human table only.
   */
  raw: unknown;
}

/** Backend-neutral single environment result (get/create/clone/update/set-primary). */
export interface MrtEnvironmentResult {
  /** Backend that served the call. */
  backend: MrtBackend;
  /** Normalized environment row. */
  environment: MrtEnvironmentView;
  /** The raw, backend-native environment response, surfaced verbatim under `--json`. */
  raw: unknown;
}

/** The backend that served a write (delete) operation and its raw response. */
export interface MrtEnvironmentWriteResult {
  /** Backend that served the write. */
  backend: MrtBackend;
  /** The raw, backend-native response (SCAPI delete returns the environment; legacy returns nothing). */
  raw: unknown;
}

/** Backend-neutral cache-invalidation result. */
export interface MrtCacheInvalidationResult {
  /** Backend that served the invalidation. */
  backend: MrtBackend;
  /**
   * The raw, backend-native response: the legacy {@link InvalidateCacheResult}
   * shape, or `null` for SCAPI's empty 202.
   */
  raw: unknown;
}

/** Options for {@link listEnvironmentsWithBackend}. */
export interface ListEnvironmentsBackendOptions extends EnvBackendOptions {
  /** Maximum number of results to return (SCAPI only; legacy lists all). */
  limit?: number;
  /** Pagination offset (SCAPI only; legacy lists all). */
  offset?: number;
}

/**
 * Lists environments, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). Returns normalized rows.
 */
export async function listEnvironmentsWithBackend(
  options: ListEnvironmentsBackendOptions,
): Promise<MrtEnvironmentsView> {
  const {preference, scapiConnection, legacyAuth, projectSlug, limit, offset, origin, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{count: number; environments: MrtEnvironmentView[]; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => getEnvironmentsScapi(scapiConnection!, {storefrontId: projectSlug, limit, offset}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await listEnvs({projectSlug, origin}, legacyAuth);
        return {
          count: result.environments.length,
          environments: result.environments.map(normalizeLegacyEnv),
          raw: result,
        };
      },
    },
  );

  return {backend: run.backend, count: run.value.count, environments: run.value.environments, raw: run.value.raw};
}

/** Options for {@link createEnvironmentWithBackend}. */
export interface CreateEnvironmentBackendOptions extends EnvBackendOptions {
  /** Display name for the new environment (both backends). */
  name: string;
  /** Environment slug (legacy only; SCAPI generates the environment ID). */
  slug?: string;
  /** Default SSR region, hyphenated legacy form (legacy only). */
  region?: SsrRegion;
  /** Mark as a production environment (legacy only). */
  isProduction?: boolean;
  /** Hostname pattern for V8 Tag loading (legacy only). */
  hostname?: string;
  /** Full external hostname (legacy only). */
  externalHostname?: string;
  /** External domain (legacy only). */
  externalDomain?: string;
  /** Forward cookies to origin (legacy only). */
  allowCookies?: boolean;
  /** Enable source maps (legacy only). */
  enableSourceMaps?: boolean;
  /** Minimum log level (legacy only). */
  logLevel?: LogLevel;
  /** IP whitelist, space-separated CIDR blocks (legacy only). */
  whitelistedIps?: string;
  /** Proxy configurations (legacy only). */
  proxyConfigs?: Array<{path: string; host: string}>;
}

/**
 * Creates an environment, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). SCAPI accepts only the display name;
 * the legacy-only configuration fields are forwarded to the legacy backend and
 * ignored by SCAPI.
 */
export async function createEnvironmentWithBackend(
  options: CreateEnvironmentBackendOptions,
): Promise<MrtEnvironmentResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    name,
    slug,
    region,
    isProduction,
    hostname,
    externalHostname,
    externalDomain,
    allowCookies,
    enableSourceMaps,
    logLevel,
    whitelistedIps,
    proxyConfigs,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{environment: MrtEnvironmentView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => createEnvironmentScapi(scapiConnection!, {storefrontId: projectSlug, displayName: name}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        if (!slug) {
          throw new Error('The legacy MRT backend requires an environment slug to create an environment.');
        }
        const env = await createEnv(
          {
            projectSlug,
            slug,
            name,
            region,
            isProduction,
            hostname,
            externalHostname,
            externalDomain,
            allowCookies,
            enableSourceMaps,
            logLevel,
            whitelistedIps,
            proxyConfigs,
            origin,
          },
          legacyAuth,
        );
        return {environment: normalizeLegacyEnv(env), raw: env};
      },
    },
  );

  return {backend: run.backend, environment: run.value.environment, raw: run.value.raw};
}

/** Options for {@link cloneEnvironmentWithBackend}. */
export interface CloneEnvironmentBackendOptions extends EnvBackendOptions {
  /** Slug for the new environment (legacy only; SCAPI generates the environment ID). */
  slug?: string;
  /** Display name for the new environment (SCAPI only; required there). */
  displayName?: string;
  /** Slug of the source environment to clone from (both backends). */
  sourceEnvironment: string;
  /** Clone redirects from the source environment. */
  cloneRedirects?: boolean;
  /** Clone environment variables from the source environment. */
  cloneEnvironmentVariables?: boolean;
  /** Clone B2C target info from the source environment. */
  cloneB2cTargetInfo?: boolean;
  /** Full external hostname for the new environment (legacy only). */
  externalHostname?: string | null;
  /** External domain for the new environment (legacy only). */
  externalDomain?: string | null;
  /** Certificate ID to associate with the new environment (legacy only). */
  certificateId?: number | null;
}

/**
 * Clones an environment, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). SCAPI requires a display name for the
 * clone and generates its ID; the legacy backend requires the new environment
 * slug.
 */
export async function cloneEnvironmentWithBackend(
  options: CloneEnvironmentBackendOptions,
): Promise<MrtEnvironmentResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    slug,
    displayName,
    sourceEnvironment,
    cloneRedirects,
    cloneEnvironmentVariables,
    cloneB2cTargetInfo,
    externalHostname,
    externalDomain,
    certificateId,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{environment: MrtEnvironmentView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => {
        if (!displayName) {
          throw new Error('The SCAPI MRT backend requires a display name (--name) to clone an environment.');
        }
        return cloneEnvironmentScapi(scapiConnection!, {
          storefrontId: projectSlug,
          sourceEnvironmentId: sourceEnvironment,
          displayName,
          cloneEnvironmentVariables,
          cloneRedirects,
          cloneB2cTargetInfo,
        });
      },
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        if (!slug) {
          throw new Error('The legacy MRT backend requires a slug for the new environment to clone.');
        }
        const env = await cloneEnv(
          {
            projectSlug,
            slug,
            fromSlug: sourceEnvironment,
            externalHostname,
            externalDomain,
            certificateId,
            cloneRedirects,
            cloneEnvironmentVariables,
            cloneB2cTargetInfo,
            origin,
          },
          legacyAuth,
        );
        return {environment: normalizeLegacyEnv(env), raw: env};
      },
    },
  );

  return {backend: run.backend, environment: run.value.environment, raw: run.value.raw};
}

/** Options for {@link getEnvironmentWithBackend}. */
export interface GetEnvironmentBackendOptions extends EnvBackendOptions {
  /** Environment slug (= SCAPI environment ID) to fetch. */
  environment: string;
}

/**
 * Fetches a single environment, routing to the SCAPI or legacy backend per the
 * given preference (with safe `auto` fallback).
 */
export async function getEnvironmentWithBackend(options: GetEnvironmentBackendOptions): Promise<MrtEnvironmentResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, origin, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{environment: MrtEnvironmentView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => getEnvironmentByIdScapi(scapiConnection!, {storefrontId: projectSlug, environmentId: environment}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const env = await getEnv({projectSlug, slug: environment, origin}, legacyAuth);
        return {environment: normalizeLegacyEnv(env), raw: env};
      },
    },
  );

  return {backend: run.backend, environment: run.value.environment, raw: run.value.raw};
}

/** Options for {@link updateEnvironmentWithBackend}. */
export interface UpdateEnvironmentBackendOptions extends EnvBackendOptions {
  /** Environment slug (= SCAPI environment ID) to update. */
  environment: string;
  /** New display name for the environment (both backends). */
  name?: string;
  /** Mark as a production environment (legacy only). */
  isProduction?: boolean;
  /** Hostname pattern for V8 Tag loading (legacy only). */
  hostname?: string | null;
  /** Full external hostname (legacy only). */
  externalHostname?: string | null;
  /** External domain (legacy only). */
  externalDomain?: string | null;
  /** Forward cookies to origin (legacy only). */
  allowCookies?: boolean | null;
  /** Forward the original client User-Agent header to proxy origins (legacy only). */
  preserveProxyUserAgent?: boolean | null;
  /** Enable source maps (legacy only). */
  enableSourceMaps?: boolean | null;
  /** Minimum log level (legacy only). */
  logLevel?: LogLevel | null;
  /** IP whitelist, space-separated CIDR blocks (legacy only). */
  whitelistedIps?: string | null;
  /** Proxy configurations (legacy only). */
  proxyConfigs?: Array<{path: string; host: string}> | null;
}

/**
 * Updates an environment, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback). The SCAPI backend only changes the
 * display name here (the only field the `mrt env update` command exposes); the
 * legacy-only configuration fields are forwarded to the legacy backend.
 */
export async function updateEnvironmentWithBackend(
  options: UpdateEnvironmentBackendOptions,
): Promise<MrtEnvironmentResult> {
  const {
    preference,
    scapiConnection,
    legacyAuth,
    projectSlug,
    environment,
    name,
    isProduction,
    hostname,
    externalHostname,
    externalDomain,
    allowCookies,
    preserveProxyUserAgent,
    enableSourceMaps,
    logLevel,
    whitelistedIps,
    proxyConfigs,
    origin,
    onFallback,
    onResolve,
  } = options;

  const run = await runMrtWithFallback<{environment: MrtEnvironmentView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => {
        if (name === undefined) {
          throw new Error('The SCAPI MRT backend only updates the environment display name; provide --name.');
        }
        return updateEnvironmentScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          changes: {displayName: name},
        });
      },
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const env = await updateEnv(
          {
            projectSlug,
            slug: environment,
            name,
            isProduction,
            hostname,
            externalHostname,
            externalDomain,
            allowCookies,
            preserveProxyUserAgent,
            enableSourceMaps,
            logLevel,
            whitelistedIps,
            proxyConfigs,
            origin,
          },
          legacyAuth,
        );
        return {environment: normalizeLegacyEnv(env), raw: env};
      },
    },
  );

  return {backend: run.backend, environment: run.value.environment, raw: run.value.raw};
}

/** Options for {@link deleteEnvironmentWithBackend}. */
export interface DeleteEnvironmentBackendOptions extends EnvBackendOptions {
  /** Environment slug (= SCAPI environment ID) to delete. */
  environment: string;
}

/**
 * Deletes an environment, routing to the SCAPI or legacy backend per the given
 * preference (with safe `auto` fallback).
 */
export async function deleteEnvironmentWithBackend(
  options: DeleteEnvironmentBackendOptions,
): Promise<MrtEnvironmentWriteResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, origin, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () => deleteEnvironmentScapi(scapiConnection!, {storefrontId: projectSlug, environmentId: environment}),
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        await deleteEnv({projectSlug, slug: environment, origin}, legacyAuth);
        return {raw: null};
      },
    },
  );

  return {backend: run.backend, raw: run.value.raw};
}

/** Options for {@link setPrimaryEnvironmentWithBackend}. */
export interface SetPrimaryEnvironmentBackendOptions extends EnvBackendOptions {
  /** Environment slug (= SCAPI environment ID) to set as primary. */
  environment: string;
}

/**
 * Sets a storefront's primary environment. SCAPI-only: the legacy MRT Cloud API
 * has no primary-environment concept, so the legacy branch raises. In `auto` mode
 * with no SCAPI connection this resolves to legacy and raises the same message.
 */
export async function setPrimaryEnvironmentWithBackend(
  options: SetPrimaryEnvironmentBackendOptions,
): Promise<MrtEnvironmentResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, onFallback, onResolve} = options;

  const run = await runMrtWithFallback<{environment: MrtEnvironmentView; raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: () =>
        setPrimaryEnvironmentScapi(scapiConnection!, {storefrontId: projectSlug, environmentId: environment}),
      legacy: async () => {
        throw new Error(SET_PRIMARY_LEGACY_UNSUPPORTED_MESSAGE);
      },
    },
  );

  return {backend: run.backend, environment: run.value.environment, raw: run.value.raw};
}

/** Options for {@link invalidateCacheWithBackend}. */
export interface InvalidateCacheBackendOptions extends EnvBackendOptions {
  /** Environment slug (= SCAPI environment ID) to invalidate on. */
  environment: string;
  /** Path prefix to invalidate (must start with `/`). */
  pattern: string;
}

/**
 * Triggers a CDN cache invalidation, routing to the SCAPI or legacy backend per
 * the given preference (with safe `auto` fallback). Both backends treat the
 * invalidation as fire-and-forget.
 */
export async function invalidateCacheWithBackend(
  options: InvalidateCacheBackendOptions,
): Promise<MrtCacheInvalidationResult> {
  const {preference, scapiConnection, legacyAuth, projectSlug, environment, pattern, origin, onFallback, onResolve} =
    options;

  const run = await runMrtWithFallback<{raw: unknown}>(
    {
      preference,
      hasScapiConfig: Boolean(scapiConnection),
      canFallbackToLegacy: Boolean(legacyAuth),
      onFallback,
      onResolve,
    },
    {
      scapi: async () => {
        await createCacheInvalidationScapi(scapiConnection!, {
          storefrontId: projectSlug,
          environmentId: environment,
          pattern,
        });
        // SCAPI returns 202 with no body: nothing to surface.
        return {raw: null};
      },
      legacy: async () => {
        if (!legacyAuth) {
          throw new Error(LEGACY_AUTH_REQUIRED_MESSAGE);
        }
        const result = await invalidateCache({projectSlug, targetSlug: environment, pattern, origin}, legacyAuth);
        return {raw: result};
      },
    },
  );

  return {backend: run.backend, raw: run.value.raw};
}
