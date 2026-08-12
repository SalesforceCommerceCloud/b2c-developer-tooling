/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Preferences API client for B2C Commerce.
 *
 * Provides a fully typed client for the SCAPI Configuration Preferences API
 * (`/configuration/preferences/v1`). Supports listing global and site
 * custom preferences, reading and updating preferences inside a preference
 * group at the global (organization) or site level, and searching site
 * preferences across sites within a preference group.
 *
 * @module clients/preferences
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {JwtOAuthStrategy} from '../auth/oauth-jwt.js';
import type {paths, components} from './preferences.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {toOrganizationId, normalizeTenantId, buildTenantScope} from './custom-apis.js';

export type {paths, components};
export {toOrganizationId, normalizeTenantId, buildTenantScope};

/**
 * Typed Preferences API client.
 *
 * @see {@link createPreferencesClient} for instantiation
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/preferences | Preferences API Reference}
 */
export type PreferencesClient = Client<paths>;

/** Helper type to extract response data from an operation. */
export type PreferencesResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/** Standard Preferences API error response structure. */
export type PreferencesError = components['schemas']['ErrorResponse'];

// Schema type re-exports for callers (CLI, operations modules).
export type CustomPreference = components['schemas']['CustomPreference'];
export type CustomPreferenceList = components['schemas']['CustomPreferenceList'];
export type OrganizationPreferences = components['schemas']['OrganizationPreferences'];
export type SitePreferences = components['schemas']['SitePreferences'];
export type PreferenceValue = components['schemas']['PreferenceValue'];
export type PreferenceValueSearchResult = components['schemas']['PreferenceValueSearchResult'];
export type SearchRequest = components['schemas']['SearchRequest'];

/** Instance type accepted by the Preferences API path. */
export type PreferenceInstanceType = 'staging' | 'development' | 'sandbox' | 'production';

/** Default OAuth scopes required for Preferences (read-only). */
export const PREFERENCES_READ_SCOPES = ['sfcc.preferences'];

/** OAuth scopes required for Preferences (read-write). */
export const PREFERENCES_RW_SCOPES = ['sfcc.preferences.rw'];

export interface PreferencesClientConfig {
  /** Short code for the SCAPI instance. */
  shortCode: string;
  /** Tenant ID, with or without the `f_ecom_` prefix. */
  tenantId: string;
  /** Optional scope override. Defaults to domain scope plus tenant scope. */
  scopes?: string[];
  /** Middleware registry to use for this client. */
  middlewareRegistry?: MiddlewareRegistry;
}

export interface PreferencesClientOptions {
  /**
   * If true, request read-write scopes (`sfcc.preferences.rw`).
   * If false or omitted, request read-only scopes (`sfcc.preferences`).
   */
  readWrite?: boolean;
}

/**
 * Creates a typed Preferences API client.
 *
 * Authentication is handled by middleware. The client automatically attaches:
 * - Domain scope: `sfcc.preferences` (read) or `sfcc.preferences.rw` (read-write)
 * - Tenant scope: `SALESFORCE_COMMERCE_API:{tenantId}`
 *
 * @example
 * ```typescript
 * const client = createPreferencesClient(
 *   {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'},
 *   oauthStrategy,
 * );
 *
 * const {data} = await client.GET('/organizations/{organizationId}/global-custom-preferences', {
 *   params: {path: {organizationId: toOrganizationId('zzxy_prd')}},
 * });
 * ```
 */
export function createPreferencesClient(
  config: PreferencesClientConfig,
  auth: AuthStrategy,
  options?: PreferencesClientOptions,
): PreferencesClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/configuration/preferences/v1`,
  });

  const domainScopes = options?.readWrite ? PREFERENCES_RW_SCOPES : PREFERENCES_READ_SCOPES;
  const requiredScopes = config.scopes ?? [...domainScopes, buildTenantScope(config.tenantId)];

  const scopedAuth =
    auth instanceof OAuthStrategy || auth instanceof JwtOAuthStrategy
      ? auth.withAdditionalScopes(requiredScopes)
      : auth;

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware('preferences')) {
    client.use(middleware);
  }

  client.use(createLoggingMiddleware('PREFERENCES'));

  return client;
}
