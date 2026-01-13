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
 * const config = resolveConfig({
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
import {resolveAuthStrategy} from '../auth/resolve.js';
import {WebDavClient} from '../clients/webdav.js';
import {createOcapiClient, type OcapiClient} from '../clients/ocapi.js';

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
 * const config = resolveConfig({
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
   * WebDAV client for file operations.
   *
   * Uses Basic auth if username/password are configured,
   * otherwise falls back to OAuth.
   *
   * @example
   * await instance.webdav.mkcol('Cartridges/v1');
   * await instance.webdav.put('Cartridges/v1/app.zip', content);
   * const entries = await instance.webdav.propfind('Cartridges');
   */
  get webdav(): WebDavClient {
    if (!this._webdav) {
      this._webdav = new WebDavClient(this.webdavHostname, this.getWebDavAuthStrategy());
    }
    return this._webdav;
  }

  /**
   * OCAPI Data API client.
   *
   * Returns the openapi-fetch client directly with full type safety.
   * Always uses OAuth authentication.
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
}

// Re-export types for convenience
export type {AuthConfig};
