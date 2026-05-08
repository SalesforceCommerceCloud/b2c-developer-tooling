/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generic builder for SCAPI Admin API clients.
 *
 * The four new SCAPI clients (jobs, scripts, merchant-users, merchant-roles)
 * each had ~20 lines of nearly-identical setup: build the openapi-fetch
 * client with a domain URL, install auth middleware with merged scopes,
 * install plugin middleware from the registry, then rate-limit and logging.
 *
 * This module collapses that setup into one helper.
 *
 * @module clients/scapi-client-factory
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {createAuthMiddleware, createLoggingMiddleware, createRateLimitMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type HttpClientType, type MiddlewareRegistry} from './middleware-registry.js';
import {buildTenantScope} from './custom-apis.js';
import {withScopes} from './scapi-backend-utils.js';

export interface BuildScapiClientOptions {
  /**
   * URL path segment after the SCAPI host root, e.g. `'operation/jobs/v1'`.
   */
  pathSegment: string;
  /**
   * Middleware registry key, e.g. `'scapi-jobs'`. Plugin middleware
   * registered under this key gets installed on the client.
   */
  domainKey: HttpClientType;
  /**
   * Default scopes to request when the caller doesn't override `config.scopes`.
   * Typically the rw scope; the tenant scope is added automatically.
   */
  defaultScopes: string[];
  /**
   * Logging/rate-limit prefix, e.g. `'SCAPI-JOBS'`. Used in log lines.
   */
  logPrefix: string;
}

export interface ScapiClientConfig {
  shortCode: string;
  tenantId: string;
  /**
   * Override the requested scopes. When omitted, defaults to
   * `[...defaultScopes, buildTenantScope(tenantId)]`.
   */
  scopes?: string[];
  /** Override the global middleware registry (mainly for tests). */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Builds a typed openapi-fetch client for a SCAPI Admin API.
 *
 * @param options - Domain-specific URL/key/scopes/log-prefix
 * @param config - Caller-supplied shortCode, tenantId, optional overrides
 * @param auth - Auth strategy (scopes are merged via {@link withScopes})
 *
 * @example
 * ```ts
 * export function createScapiJobsClient(config: ScapiClientConfig, auth: AuthStrategy): ScapiJobsClient {
 *   return buildScapiClient<paths>(
 *     {
 *       pathSegment: 'operation/jobs/v1',
 *       domainKey: 'scapi-jobs',
 *       defaultScopes: SCAPI_JOBS_RW_SCOPES,
 *       logPrefix: 'SCAPI-JOBS',
 *     },
 *     config,
 *     auth,
 *   );
 * }
 * ```
 */
// `paths` types from openapi-typescript are `interface paths { ... }` shapes
// which don't satisfy `Record<string, unknown>`. The unconstrained generic
// is fine since openapi-fetch's `Client<P>` constraint handles the shape check.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildScapiClient<P extends Record<string, any>>(
  options: BuildScapiClientOptions,
  config: ScapiClientConfig,
  auth: AuthStrategy,
): Client<P> {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<P>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/${options.pathSegment}`,
  });

  const requiredScopes = config.scopes ?? [...options.defaultScopes, buildTenantScope(config.tenantId)];
  const scopedAuth = withScopes(auth, requiredScopes);

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware(options.domainKey)) {
    client.use(middleware);
  }

  client.use(createRateLimitMiddleware({prefix: options.logPrefix}));
  client.use(createLoggingMiddleware(options.logPrefix));

  return client;
}
