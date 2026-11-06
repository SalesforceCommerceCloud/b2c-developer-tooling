/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
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
 * - {@link JwtOAuthStrategy} - OAuth 2.0 JWT Bearer (certificate-based authentication)
 * - {@link ImplicitOAuthStrategy} - Interactive browser-based OAuth for CLI/desktop apps
 * - {@link ApiKeyStrategy} - API key authentication for MRT services
 *
 * ## Strategy Resolution
 *
 * Use {@link resolveAuthStrategy} to automatically select the best strategy based on
 * available credentials and allowed methods:
 *
 * ```typescript
 * import { resolveAuthStrategy } from '@salesforce/b2c-tooling-sdk';
 *
 * // Automatically picks client-credentials if secret available, otherwise implicit
 * const strategy = resolveAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: process.env.CLIENT_SECRET, // may be undefined
 * });
 *
 * // Force a specific method
 * const implicitOnly = resolveAuthStrategy(
 *   { clientId: 'your-client-id' },
 *   { allowedMethods: ['implicit'] }
 * );
 * ```
 *
 * ## Direct Usage
 *
 * All strategies implement the {@link AuthStrategy} interface:
 *
 * ```typescript
 * import { OAuthStrategy, ImplicitOAuthStrategy } from '@salesforce/b2c-tooling-sdk';
 *
 * // For automated/server usage (client credentials)
 * const oauthAuth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * // For interactive/CLI usage (opens browser)
 * const implicitAuth = new ImplicitOAuthStrategy({
 *   clientId: 'your-client-id',
 * });
 * ```
 *
 * @module auth
 */

// Types
export type {
  AuthStrategy,
  UserAuthStrategy,
  FetchInit,
  AccessTokenResponse,
  DecodedJWT,
  AuthConfig,
  BasicAuthConfig,
  OAuthAuthConfig,
  ApiKeyAuthConfig,
  AuthMethod,
  AuthCredentials,
  BrowserLogin,
} from './types.js';
export {ALL_AUTH_METHODS} from './types.js';
export {openUrlInBrowser} from './open-browser.js';

// Client credential encoding (RFC 6749 §2.3.1)
export {
  applyClientCredentials,
  CLIENT_AUTH_METHODS,
  encodeBasicClientCredentials,
  isCredentialPlaceholder,
  resolveClientAuthMethod,
} from './client-credentials.js';
export type {ClientAuthMethod} from './client-credentials.js';

// Strategies
export {BasicAuthStrategy} from './basic.js';
export {OAuthStrategy, decodeJWT} from './oauth.js';
export type {OAuthConfig} from './oauth.js';
export {ImplicitOAuthStrategy} from './oauth-implicit.js';
export type {ImplicitOAuthConfig} from './oauth-implicit.js';
export {
  PkceOAuthStrategy,
  PkceGrantUnsupportedError,
  buildPkceAuthorizeRequest,
  readPkceAuthorizationResponse,
  exchangePkceAuthorizationCode,
} from './oauth-pkce.js';
export type {
  PkceOAuthConfig,
  PkceAuthorizeRequest,
  PkceAuthorizeRequestOptions,
  PkceCodeExchangeOptions,
  PkceTokenSet,
} from './oauth-pkce.js';
export {AuthRequiredError, isAuthRequiredError} from './errors.js';

// Account Manager hosts and the SDK's public client on each
export {ACCOUNT_MANAGER_HOSTS, getAccountManagerHostInfo, getDefaultPublicClientId} from '../defaults.js';
export type {AccountManagerHostInfo} from '../defaults.js';

// JWT helpers (decode only; signatures are not verified)
export {DEFAULT_EXPIRY_BUFFER_SEC, extractJwtScopes, decodeJwtTokenInfo, isJwtTokenValid} from './jwt-utils.js';

// Account Manager token claims: identity, roles, tenant filter
export {
  AM_ROLE_ACCOUNT_ADMIN,
  AM_ROLE_API_ADMIN,
  AM_ROLE_USER_ADMIN,
  AM_ROLE_COMMERCE_API,
  ACCOUNT_MANAGER_ROLE_DISPLAY_NAMES,
  ACCOUNT_MANAGER_API_CLIENT_ADMIN_ROLES,
  readAccountManagerClaims,
  accountManagerClaimsFromPayload,
  parseAccountManagerTenantFilter,
  formatAccountManagerTenantFilter,
  hasAccountManagerRole,
  hasAccountManagerTenantRole,
  getAccountManagerRoleTenants,
  getAccountManagerRoleDisplayName,
  isAccountManagerApiClientAdmin,
} from './account-manager-claims.js';
export type {AccountManagerClaims} from './account-manager-claims.js';
export {
  PkceWithImplicitFallbackStrategy,
  createUserAuthStrategy,
  isPkceFallbackDisabled,
} from './oauth-pkce-fallback.js';
export {JwtOAuthStrategy} from './oauth-jwt.js';
export type {JwtOAuthConfig} from './oauth-jwt.js';
export {ApiKeyStrategy} from './api-key.js';
export {StatefulOAuthStrategy} from './stateful-oauth-strategy.js';
export type {StatefulOAuthStrategyOptions} from './stateful-oauth-strategy.js';

// Unified auth-session store (PKCE, implicit, and client-credentials sessions)
export {
  initializeFileAuthSessionStore,
  setAuthSessionBackend,
  getAuthSessionBackend,
  FileAuthSessionBackend,
  InMemoryAuthSessionBackend,
  findAuthSession,
  saveAuthSession,
  deleteAuthSession,
  listAuthSessions,
  clearAllAuthSessions,
  flushAuthSessionStore,
  isAuthSessionTokenValid,
  resetAuthSessionStoreForTesting,
} from './session-store.js';
export type {AuthSession, AuthSessionBackend, AuthSessionFlow} from './session-store.js';
export {describeAuthSession, describeInstanceAuth, describeSignIn} from './instance-auth.js';
export type {
  DescribeInstanceAuthOptions,
  InstanceAuthConfig,
  InstanceAuthMethod,
  InstanceAuthPath,
  InstanceAuthSession,
  InstanceAuthSummary,
  InstanceAuthTarget,
  SignInMessageOptions,
} from './instance-auth.js';

// Resolution helpers
export {resolveAuthStrategy, checkAvailableAuthMethods, resolveSystemOAuthStrategy} from './resolve.js';
export type {ResolveAuthStrategyOptions, AvailableAuthMethods, SystemOAuthCredentials} from './resolve.js';

// Auth middleware
export {
  globalAuthMiddlewareRegistry,
  AuthMiddlewareRegistry,
  applyAuthRequestMiddleware,
  applyAuthResponseMiddleware,
} from './middleware.js';
export type {AuthMiddleware, AuthMiddlewareProvider} from './middleware.js';
