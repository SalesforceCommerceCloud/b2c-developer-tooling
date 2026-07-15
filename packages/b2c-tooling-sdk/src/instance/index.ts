/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * B2C Instance management.
 *
 * This module provides the {@link B2CInstance} class which represents a connection
 * to a specific B2C Commerce instance. It combines instance configuration with
 * authentication to provide typed API clients.
 *
 * ## Usage
 *
 * ### From configuration (recommended)
 *
 * Use {@link resolveConfig} to load configuration from dw.json and create an instance:
 *
 * ```typescript
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = await resolveConfig({
 *   clientId: process.env.SFCC_CLIENT_ID,
 *   clientSecret: process.env.SFCC_CLIENT_SECRET,
 * });
 *
 * const instance = config.createB2CInstance();
 *
 * // Use typed clients
 * await instance.webdav.put('Cartridges/v1/app.zip', content);
 * const { data } = await instance.ocapi.GET('/sites', {});
 * ```
 *
 * ### Direct construction
 *
 * ```typescript
 * const instance = new B2CInstance(
 *   { hostname: 'your-sandbox.demandware.net', codeVersion: 'v1' },
 *   { oauth: { clientId: '...', clientSecret: '...' } }
 * );
 * ```
 *
 * @module instance
 */
import type {AuthConfig, AuthStrategy, AuthMethod, AuthCredentials} from '../auth/types.js';
import {BasicAuthStrategy} from '../auth/basic.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {JwtOAuthStrategy} from '../auth/oauth-jwt.js';
import {resolveAuthStrategy} from '../auth/resolve.js';
import {WebDavClient} from '../clients/webdav.js';
import {createOcapiClient, type OcapiClient} from '../clients/ocapi.js';
import {createTlsDispatcher, type TlsOptions} from '../clients/tls-dispatcher.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';

/**
 * SCAPI connection coordinates plus an auth strategy able to request the
 * `sfcc.*` scopes each Commerce API operation needs.
 *
 * Returned by {@link B2CInstance.scapiClientConfig} when — and only when — the
 * instance carries both a shortCode and tenantId and is configured with a
 * stateless OAuth flow (client-credentials or JWT Bearer) that can go back to
 * Account Manager per request for arbitrary scopes. This is the single handle
 * every SCAPI client factory consumes, so SCAPI operations need nothing beyond
 * a {@link B2CInstance}.
 */
export interface ScapiClientConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
}

/**
 * Instance configuration (hostname, code version, etc.)
 */
export interface InstanceConfig {
  /** B2C instance hostname */
  hostname: string;
  /** Code version for deployments */
  codeVersion?: string;
  /** Separate hostname for WebDAV (if different from main hostname) */
  webdavHostname?: string;
  /** TLS options for mTLS/self-signed certificate support */
  tlsOptions?: TlsOptions;
  /**
   * SCAPI short code (e.g. `kv7kzm78`). Required, together with {@link tenantId},
   * to reach the Salesforce Commerce API. Populated from resolved configuration.
   */
  shortCode?: string;
  /**
   * SCAPI tenant/organization ID (e.g. `zzxy_prd`). Required, together with
   * {@link shortCode}, to reach the Salesforce Commerce API.
   */
  tenantId?: string;
  /**
   * Backend preference for operations that support both OCAPI (legacy) and
   * SCAPI. Defaults to `'auto'` when unset. Lets the instance answer "should
   * this operation prefer SCAPI?" without the caller re-reading config.
   */
  apiBackend?: 'ocapi' | 'scapi' | 'auto';
}

/**
 * Represents a connection to a B2C Commerce instance.
 *
 * Provides lazy-loaded, typed API clients for WebDAV and OCAPI operations.
 * Authentication is handled automatically based on the configured credentials.
 *
 * @example
 * // From configuration (recommended)
 * import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = await resolveConfig({
 *   clientId: process.env.SFCC_CLIENT_ID,
 *   clientSecret: process.env.SFCC_CLIENT_SECRET,
 * });
 * const instance = config.createB2CInstance();
 *
 * // WebDAV uses Basic auth if available, falls back to OAuth
 * await instance.webdav.mkcol('Cartridges/v1');
 *
 * // OCAPI always uses OAuth
 * const { data } = await instance.ocapi.GET('/sites', {});
 */
export class B2CInstance {
  private _webdav?: WebDavClient;
  private _ocapi?: OcapiClient;

  /**
   * Creates a new B2CInstance.
   *
   * @param config - Instance configuration (hostname, code version)
   * @param auth - Authentication configuration
   */
  constructor(
    public readonly config: InstanceConfig,
    public readonly auth: AuthConfig,
  ) {}

  /**
   * The hostname to use for WebDAV operations.
   * Falls back to main hostname if not specified.
   */
  get webdavHostname(): string {
    return this.config.webdavHostname || this.config.hostname;
  }

  /**
   * Backend preference for operations that support both OCAPI and SCAPI.
   * Defaults to `'auto'` when not configured.
   */
  get apiBackend(): 'ocapi' | 'scapi' | 'auto' {
    return this.config.apiBackend ?? 'auto';
  }

  /**
   * SCAPI connection coordinates + a scope-flexible auth strategy, or
   * `undefined` when this instance cannot reach SCAPI under `auto` mode.
   *
   * This is the forward-looking seam for the OCAPI → SCAPI transition: a SCAPI
   * client factory (jobs, sites, scripts, …) needs only a {@link B2CInstance},
   * not a separately-threaded shortCode/tenantId/auth bundle. When OCAPI is
   * eventually removed, the OCAPI accessors disappear and this stays.
   *
   * Returns `undefined` unless **all** of the following hold:
   *   1. `shortCode` and `tenantId` are configured, and
   *   2. the configured OAuth flow is stateless and scope-flexible —
   *      client-credentials (clientId + clientSecret) or JWT Bearer
   *      (clientId + cert/key).
   *
   * Stateful and implicit flows are excluded on purpose: they hold a fixed
   * token whose scopes were chosen at acquisition, so they cannot request the
   * `sfcc.*` scopes SCAPI needs. This is not an `auto`-only restriction —
   * because both consumers (the dual-backend factory and the system-job runner)
   * gate on this getter, even explicit `--api-backend scapi` cannot use SCAPI
   * with implicit/stateful auth; it fails with a clear error naming the flow
   * requirement. SCAPI requires client-credentials or JWT Bearer.
   */
  get scapiClientConfig(): ScapiClientConfig | undefined {
    const {shortCode, tenantId} = this.config;
    if (!shortCode || !tenantId) {
      return undefined;
    }

    const auth = this.buildScapiAuthStrategy();
    if (!auth) {
      return undefined;
    }

    return {shortCode, tenantId, auth};
  }

  /**
   * WebDAV client for file operations.
   *
   * Uses Basic auth if username/password are configured,
   * otherwise falls back to OAuth.
   *
   * @returns The lazy-initialized WebDAV client for file operations.
   *
   * @example
   * await instance.webdav.mkcol('Cartridges/v1');
   * await instance.webdav.put('Cartridges/v1/app.zip', content);
   * const entries = await instance.webdav.propfind('Cartridges');
   */
  get webdav(): WebDavClient {
    if (!this._webdav) {
      // Create TLS dispatcher if TLS options are configured
      const dispatcher = this.config.tlsOptions ? createTlsDispatcher(this.config.tlsOptions) : undefined;
      this._webdav = new WebDavClient(this.webdavHostname, this.getWebDavAuthStrategy(), {
        dispatcher,
      });
    }
    return this._webdav;
  }

  /**
   * OCAPI Data API client.
   *
   * Returns the openapi-fetch client directly with full type safety.
   * Always uses OAuth authentication.
   *
   * @returns The OCAPI Data API client (openapi-fetch Client with full type safety).
   *
   * @example
   * const { data, error } = await instance.ocapi.GET('/sites', {});
   * const { data, error } = await instance.ocapi.PATCH('/code_versions/{code_version_id}', {
   *   params: { path: { code_version_id: 'v1' } },
   *   body: { active: true }
   * });
   */
  get ocapi(): OcapiClient {
    if (!this._ocapi) {
      this._ocapi = createOcapiClient(this.config.hostname, this.getOAuthStrategy());
    }
    return this._ocapi;
  }

  /**
   * Gets the auth strategy for WebDAV operations.
   * Uses authMethods to determine priority, defaulting to basic then OAuth methods.
   */
  private getWebDavAuthStrategy(): AuthStrategy {
    // For WebDAV, default priority is basic first, then OAuth methods
    const webdavMethods = this.auth.authMethods || (['basic', 'client-credentials', 'implicit'] as AuthMethod[]);

    // If basic auth is allowed and configured, use it directly
    if (webdavMethods.includes('basic') && this.auth.basic) {
      return new BasicAuthStrategy(this.auth.basic.username, this.auth.basic.password);
    }

    // Otherwise try OAuth methods
    return this.getOAuthStrategy();
  }

  /**
   * Gets the OAuth auth strategy based on allowed methods and available credentials.
   * Uses resolveAuthStrategy to automatically select the best OAuth method.
   *
   * @throws Error if no valid OAuth method is available
   */
  private getOAuthStrategy(): AuthStrategy {
    if (!this.auth.oauth) {
      throw new Error('OAuth credentials required. Provide at least clientId.');
    }

    // Build credentials for resolution
    const credentials: AuthCredentials = {
      clientId: this.auth.oauth.clientId,
      clientSecret: this.auth.oauth.clientSecret,
      scopes: this.auth.oauth.scopes,
      accountManagerHost: this.auth.oauth.accountManagerHost,
      redirectUri: this.auth.oauth.redirectUri,
      openBrowser: this.auth.oauth.openBrowser,
    };

    // Filter to only OAuth methods (client-credentials, implicit)
    const oauthMethods = (this.auth.authMethods || (['client-credentials', 'implicit'] as AuthMethod[])).filter(
      (m): m is 'client-credentials' | 'implicit' => m === 'client-credentials' || m === 'implicit',
    );

    if (oauthMethods.length === 0) {
      throw new Error('No OAuth methods allowed. Check authMethods configuration.');
    }

    return resolveAuthStrategy(credentials, {allowedMethods: oauthMethods});
  }

  /**
   * Builds the scope-flexible OAuth strategy used for SCAPI, or `undefined`
   * when the configured credentials are not eligible for `auto`-mode SCAPI.
   *
   * Only the stateless flows qualify, because only they can request arbitrary
   * `sfcc.*` scopes from Account Manager per call (via the cascade / additional
   * scopes hooks the SCAPI client factories rely on):
   *   - **client-credentials**: clientId + clientSecret.
   *   - **JWT Bearer**: clientId + cert/key paths.
   *
   * Honors `authMethods` ordering, defaulting to client-credentials before JWT
   * to match the CLI's auth priority. Returns `undefined` for implicit- or
   * basic-only configs.
   */
  private buildScapiAuthStrategy(): AuthStrategy | undefined {
    const oauth = this.auth.oauth;
    if (!oauth) {
      return undefined;
    }

    const accountManagerHost = oauth.accountManagerHost ?? DEFAULT_ACCOUNT_MANAGER_HOST;
    const methods = this.auth.authMethods ?? (['client-credentials', 'jwt'] as AuthMethod[]);

    for (const method of methods) {
      if (method === 'client-credentials' && oauth.clientSecret) {
        return new OAuthStrategy({
          clientId: oauth.clientId,
          clientSecret: oauth.clientSecret,
          scopes: oauth.scopes,
          accountManagerHost,
        });
      }

      if (method === 'jwt' && oauth.jwtCertPath && oauth.jwtKeyPath) {
        return new JwtOAuthStrategy({
          clientId: oauth.clientId,
          certPath: oauth.jwtCertPath,
          keyPath: oauth.jwtKeyPath,
          passphrase: oauth.jwtPassphrase,
          accountManagerHost,
          scopes: oauth.scopes,
        });
      }
    }

    return undefined;
  }
}

// Re-export types for convenience
export type {AuthConfig};
export type {TlsOptions};
export type {AuthStrategy};
