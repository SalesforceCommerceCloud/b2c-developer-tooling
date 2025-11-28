/**
 * Authentication strategies for B2C Commerce APIs.
 *
 * This module provides different authentication mechanisms for connecting to
 * B2C Commerce instances and platform services.
 *
 * ## Available Strategies
 *
 * - {@link BasicAuthStrategy} - Username/password authentication for WebDAV operations
 * - {@link OAuthStrategy} - OAuth 2.0 client credentials for OCAPI and platform APIs
 * - {@link ApiKeyStrategy} - API key authentication for MRT services
 *
 * ## Usage
 *
 * All strategies implement the {@link AuthStrategy} interface, allowing you to
 * switch authentication methods without changing your code:
 *
 * ```typescript
 * import { BasicAuthStrategy, OAuthStrategy } from '@salesforce/b2c-tooling';
 *
 * // For WebDAV operations (code upload)
 * const basicAuth = new BasicAuthStrategy('username', 'access-key');
 *
 * // For OCAPI operations (sites, jobs)
 * const oauthAuth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 * ```
 *
 * @module auth
 */
export type {
  AuthStrategy,
  AccessTokenResponse,
  DecodedJWT,
  AuthConfig,
  BasicAuthConfig,
  OAuthAuthConfig,
  ApiKeyAuthConfig,
} from './types.js';
export {BasicAuthStrategy} from './basic.js';
export {OAuthStrategy, decodeJWT} from './oauth.js';
export type {OAuthConfig} from './oauth.js';
export {ApiKeyStrategy} from './api-key.js';
