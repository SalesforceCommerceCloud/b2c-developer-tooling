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
