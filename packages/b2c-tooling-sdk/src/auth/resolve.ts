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
import {ImplicitOAuthStrategy} from './oauth-implicit.js';
import {BasicAuthStrategy} from './basic.js';
import {ApiKeyStrategy} from './api-key.js';

/**
 * Options for resolving an auth strategy.
 */
export interface ResolveAuthStrategyOptions {
  /**
   * Allowed authentication methods in priority order.
   * The first method with available credentials will be used.
   * Defaults to all methods: ['client-credentials', 'implicit', 'basic', 'api-key']
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
 * console.log(result.available); // ['client-credentials', 'implicit']
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
 * // Will use client-credentials if secret is available, otherwise implicit
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

      case 'implicit':
        if (credentials.clientId) {
          return new ImplicitOAuthStrategy({
            clientId: credentials.clientId,
            scopes: credentials.scopes,
            accountManagerHost: credentials.accountManagerHost,
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
