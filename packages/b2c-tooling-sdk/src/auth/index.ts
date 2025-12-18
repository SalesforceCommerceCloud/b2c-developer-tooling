/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Types
export type {
  AuthStrategy,
  AccessTokenResponse,
  DecodedJWT,
  AuthConfig,
  BasicAuthConfig,
  OAuthAuthConfig,
  ApiKeyAuthConfig,
  AuthMethod,
  AuthCredentials,
} from './types.js';
export {ALL_AUTH_METHODS} from './types.js';

// Strategies
export {BasicAuthStrategy} from './basic.js';
export {OAuthStrategy, decodeJWT} from './oauth.js';
export type {OAuthConfig} from './oauth.js';
export {ImplicitOAuthStrategy} from './oauth-implicit.js';
export type {ImplicitOAuthConfig} from './oauth-implicit.js';
export {ApiKeyStrategy} from './api-key.js';

// Resolution helpers
export {resolveAuthStrategy, checkAvailableAuthMethods} from './resolve.js';
export type {ResolveAuthStrategyOptions, AvailableAuthMethods} from './resolve.js';
