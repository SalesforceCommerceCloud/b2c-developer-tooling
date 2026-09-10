/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Auth strategy resolution utilities.
 *
 * This module provides functions to automatically select and create the appropriate
 * authentication strategy based on available credentials and allowed methods.
 *
 * ## Usage
 *
 * ```typescript
 * import { resolveAuthStrategy, checkAvailableAuthMethods } from '@salesforce/b2c-tooling-sdk';
 *
 * // Auto-select best strategy based on credentials
 * const strategy = resolveAuthStrategy({
 *   clientId: 'my-client-id',
 *   clientSecret: process.env.CLIENT_SECRET,
 * });
 *
 * // Check which methods are available
 * const { available, unavailable } = checkAvailableAuthMethods(credentials);
 * ```
 *
 * @module auth/resolve
 */

import type {AuthStrategy, AuthMethod, AuthCredentials} from './types.js';
import {ALL_AUTH_METHODS} from './types.js';
import {OAuthStrategy} from './oauth.js';
import {JwtOAuthStrategy} from './oauth-jwt.js';
import {ImplicitOAuthStrategy} from './oauth-implicit.js';
import {createUserAuthStrategy} from './oauth-pkce-fallback.js';
import {BasicAuthStrategy} from './basic.js';
import {ApiKeyStrategy} from './api-key.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';

/**
 * Options for resolving an auth strategy.
 */
export interface ResolveAuthStrategyOptions {
  /**
   * Allowed authentication methods in priority order.
   * The first method with available credentials will be used.
   * Defaults to {@link ALL_AUTH_METHODS}, where PKCE-based `user` auth is
   * preferred over the deprecated `implicit` flow.
   *
   * Note: the `'jwt'` method is defined in the {@link AuthMethod} type but is
   * not automatically resolvable here, because JWT auth requires file paths
   * (e.g. `certPath`/`keyPath`) that are not part of the generic
   * {@link AuthCredentials} accepted by this resolver. To use JWT, instantiate
   * `JwtOAuthStrategy` directly instead of relying on `resolveAuthStrategy`.
   */
  allowedMethods?: AuthMethod[];
}

/**
 * Result of checking which auth methods are available.
 */
export interface AvailableAuthMethods {
  /** Methods that have all required credentials configured */
  available: AuthMethod[];
  /** Methods that are missing required credentials */
  unavailable: {method: AuthMethod; reason: string}[];
}

/**
 * Checks which auth methods have the required credentials available.
 *
 * @param credentials - The available credentials
 * @param allowedMethods - Methods to check (defaults to all)
 * @returns Object with available and unavailable methods
 *
 * @example
 * ```typescript
 * import { checkAvailableAuthMethods } from '@salesforce/b2c-tooling-sdk';
 *
 * const result = checkAvailableAuthMethods({
 *   clientId: 'my-client',
 *   clientSecret: 'my-secret',
 * });
 *
 * console.log(result.available); // ['client-credentials', 'user', 'implicit']
 * ```
 */
export function checkAvailableAuthMethods(
  credentials: AuthCredentials,
  allowedMethods: AuthMethod[] = ALL_AUTH_METHODS,
): AvailableAuthMethods {
  const available: AuthMethod[] = [];
  const unavailable: {method: AuthMethod; reason: string}[] = [];

  for (const method of allowedMethods) {
    switch (method) {
      case 'client-credentials':
        if (credentials.clientId && credentials.clientSecret) {
          available.push(method);
        } else if (!credentials.clientId) {
          unavailable.push({method, reason: 'clientId is required'});
        } else {
          unavailable.push({method, reason: 'clientSecret is required'});
        }
        break;

      case 'user':
      case 'implicit':
        if (credentials.clientId) {
          available.push(method);
        } else {
          unavailable.push({method, reason: 'clientId is required'});
        }
        break;

      case 'basic':
        if (credentials.username && credentials.password) {
          available.push(method);
        } else if (!credentials.username) {
          unavailable.push({method, reason: 'username is required'});
        } else {
          unavailable.push({method, reason: 'password is required'});
        }
        break;

      case 'api-key':
        if (credentials.apiKey) {
          available.push(method);
        } else {
          unavailable.push({method, reason: 'apiKey is required'});
        }
        break;
    }
  }

  return {available, unavailable};
}

/**
 * Resolves and creates the appropriate auth strategy based on credentials and allowed methods.
 *
 * Iterates through allowed methods in priority order and returns the first strategy
 * for which the required credentials are available.
 *
 * @param credentials - The available credentials
 * @param options - Resolution options (allowed methods, etc.)
 * @returns The resolved auth strategy
 * @throws Error if no allowed method has the required credentials
 *
 * @example
 * ```typescript
 * import { resolveAuthStrategy } from '@salesforce/b2c-tooling-sdk';
 *
 * // Will use client-credentials if secret is available, otherwise PKCE user auth
 * const strategy = resolveAuthStrategy({
 *   clientId: 'my-client-id',
 *   clientSecret: process.env.CLIENT_SECRET, // may be undefined
 *   scopes: ['sfcc.products'],
 * });
 *
 * // Force implicit auth only
 * const implicitStrategy = resolveAuthStrategy(
 *   { clientId: 'my-client-id' },
 *   { allowedMethods: ['implicit'] }
 * );
 *
 * // Use the strategy
 * const response = await strategy.fetch('https://example.com/api');
 * ```
 */
export function resolveAuthStrategy(
  credentials: AuthCredentials,
  options: ResolveAuthStrategyOptions = {},
): AuthStrategy {
  const allowedMethods = options.allowedMethods || ALL_AUTH_METHODS;

  for (const method of allowedMethods) {
    switch (method) {
      case 'client-credentials':
        if (credentials.clientId && credentials.clientSecret) {
          return new OAuthStrategy({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            scopes: credentials.scopes,
            accountManagerHost: credentials.accountManagerHost,
          });
        }
        break;

      case 'user':
        if (credentials.clientId) {
          // PKCE with an automatic, WARN-logged fallback to the implicit flow
          // for clients not yet registered for PKCE (see oauth-pkce-fallback).
          return createUserAuthStrategy({
            clientId: credentials.clientId,
            scopes: credentials.scopes,
            accountManagerHost: credentials.accountManagerHost,
            redirectUri: credentials.redirectUri,
            openBrowser: credentials.openBrowser,
          });
        }
        break;

      case 'implicit':
        if (credentials.clientId) {
          return new ImplicitOAuthStrategy({
            clientId: credentials.clientId,
            scopes: credentials.scopes,
            accountManagerHost: credentials.accountManagerHost,
            redirectUri: credentials.redirectUri,
            openBrowser: credentials.openBrowser,
          });
        }
        break;

      case 'basic':
        if (credentials.username && credentials.password) {
          return new BasicAuthStrategy(credentials.username, credentials.password);
        }
        break;

      case 'api-key':
        if (credentials.apiKey) {
          return new ApiKeyStrategy(credentials.apiKey, credentials.apiKeyHeaderName);
        }
        break;
    }
  }

  // Build helpful error message
  const {unavailable} = checkAvailableAuthMethods(credentials, allowedMethods);
  const details = unavailable.map((u) => `${u.method}: ${u.reason}`).join('; ');

  throw new Error(
    `No valid auth method available. Allowed methods: [${allowedMethods.join(', ')}]. ` +
      `Missing credentials: ${details}`,
  );
}

/**
 * Credentials for the non-interactive (system) OAuth flows — client-credentials
 * and JWT Bearer. A superset of the OAuth fields shared by `NormalizedConfig`
 * and `AuthConfig.oauth`, so either can be passed directly (extra fields are
 * ignored by structural typing).
 */
export interface SystemOAuthCredentials {
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  accountManagerHost?: string;
  jwtCertPath?: string;
  jwtKeyPath?: string;
  jwtPassphrase?: string;
}

/**
 * Builds a stateless, scope-flexible **system** OAuth strategy — client-credentials
 * or JWT Bearer — or `undefined` when neither is fully configured.
 *
 * These are the only flows that can request arbitrary `sfcc.*` scopes from Account
 * Manager per call (via the scope-cascade / additional-scopes hooks the SCAPI client
 * factories rely on). Browser user-auth (PKCE/implicit) and fixed-token stored
 * sessions are intentionally excluded, so this is the shared definition of
 * "SCAPI-eligible auth" used by both {@link B2CInstance.scapiClientConfig} and
 * `MrtCommand.getScapiMrtConfig`.
 *
 * Unlike {@link resolveAuthStrategy}, this handles JWT (which needs cert/key paths
 * not present on {@link AuthCredentials}) and never throws — callers treat
 * `undefined` as "not SCAPI-eligible". The Account Manager host default is applied by
 * the strategy constructors, so `accountManagerHost` may be passed through as-is.
 *
 * @param credentials - The available system OAuth credentials.
 * @param methods - Allowed methods in priority order. Defaults to
 *   client-credentials before JWT, matching the CLI's auth priority.
 * @returns The first eligible strategy, or `undefined` if none is configured.
 */
export function resolveSystemOAuthStrategy(
  credentials: SystemOAuthCredentials,
  methods: AuthMethod[] = ['client-credentials', 'jwt'],
): AuthStrategy | undefined {
  const {clientId, clientSecret, scopes, jwtCertPath, jwtKeyPath, jwtPassphrase} = credentials;
  if (!clientId) {
    return undefined;
  }

  // JwtOAuthConfig requires a defined host; OAuthStrategy applies the same
  // default internally, so this stays consistent across both flows.
  const accountManagerHost = credentials.accountManagerHost ?? DEFAULT_ACCOUNT_MANAGER_HOST;

  for (const method of methods) {
    if (method === 'client-credentials' && clientSecret) {
      return new OAuthStrategy({clientId, clientSecret, scopes, accountManagerHost});
    }

    if (method === 'jwt' && jwtCertPath && jwtKeyPath) {
      return new JwtOAuthStrategy({
        clientId,
        certPath: jwtCertPath,
        keyPath: jwtKeyPath,
        passphrase: jwtPassphrase,
        accountManagerHost,
        scopes,
      });
    }
  }

  return undefined;
}
