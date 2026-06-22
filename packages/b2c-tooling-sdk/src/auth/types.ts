/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Extended RequestInit that supports undici dispatcher for TLS/mTLS.
 * Uses `unknown` for dispatcher to avoid type conflicts between undici package
 * and @types/node/undici-types.
 */
export type FetchInit = Omit<RequestInit, 'dispatcher'> & {
  /** undici dispatcher for custom TLS options (mTLS, self-signed certs) */
  dispatcher?: unknown;
};

export interface AuthStrategy {
  /**
   * Performs a fetch request with authentication.
   * Implementations MUST handle header injection and 401 retries (token refresh) internally.
   */
  fetch(url: string, init?: FetchInit): Promise<Response>;

  /**
   * Optional: Helper for legacy clients (like a strict WebDAV lib) that need the raw header.
   */
  getAuthorizationHeader?(): Promise<string>;

  /**
   * Optional: Invalidates the cached token, forcing re-authentication on next request.
   * Used by middleware to retry requests after receiving a 401 response.
   */
  invalidateToken?(): void;

  /**
   * Optional: Returns a copy of this strategy with the given scopes merged into
   * its requested scope set. SCAPI client factories use this to ensure the
   * tenant scope is present on every token request.
   *
   * Implemented by `OAuthStrategy` and `JwtOAuthStrategy`. Strategies that
   * obtain tokens by other means (basic, api-key, implicit-via-stored-session)
   * may not implement this; callers should treat them as "scopes already
   * established at construction time."
   */
  withAdditionalScopes?(additionalScopes: string[]): AuthStrategy;

  /**
   * Optional: Resolves a scope cascade by trying each candidate scope set
   * in order and returning the first that AM accepts.
   *
   * Implementations should:
   *   1. Return any cached token whose scopes ⊇ a candidate (no AM call).
   *   2. Otherwise, call AM with each candidate in order until one survives;
   *      cache the result keyed by what was requested.
   *   3. Throw the last `invalid_scope` error if all candidates fail.
   *
   * Implementations MUST add any base scopes (e.g. tenant scope baked in
   * via {@link withAdditionalScopes}) to each candidate before sending it
   * to AM.
   *
   * Used by the SCAPI auth middleware to pick the right scope tier (rw vs
   * ro) per operation. Strategies without OAuth-style scope grants (basic,
   * api-key) should leave this unset; the middleware falls through to
   * {@link getAuthorizationHeader} in that case.
   *
   * @param candidates - Outer array is cascade order; inner arrays are the
   *   scopes for each token request attempt. e.g.
   *   `[['sfcc.jobs.rw'], ['sfcc.jobs']]`.
   * @returns The access token (Bearer value, no `Bearer ` prefix).
   */
  getAccessTokenForCascade?(candidates: string[][]): Promise<string>;
}

/**
 * Configuration for Basic authentication (username/access-key).
 * Used primarily for WebDAV operations.
 */
export interface BasicAuthConfig {
  username: string;
  password: string;
}

/**
 * Configuration for OAuth authentication.
 * Used for OCAPI and platform API operations.
 */
export interface OAuthAuthConfig {
  clientId: string;
  clientSecret?: string;
  scopes?: string[];
  accountManagerHost?: string;
  /** Path to JWT certificate file (cert.pem) for the JWT Bearer flow */
  jwtCertPath?: string;
  /** Path to JWT private key file (key.pem) for the JWT Bearer flow */
  jwtKeyPath?: string;
  /** Optional passphrase for an encrypted JWT private key */
  jwtPassphrase?: string;
  /** Override redirect URI for implicit OAuth flow (e.g., for port forwarding in remote environments) */
  redirectUri?: string;
  /** Custom browser opener for implicit OAuth flow. Receives the authorization URL. */
  openBrowser?: (url: string) => Promise<void>;
}

/**
 * Configuration for API key authentication.
 * Used for MRT and external services.
 */
export interface ApiKeyAuthConfig {
  key: string;
  headerName?: string;
}

/**
 * Combined authentication configuration.
 * B2CInstance uses this to determine which auth strategy to use for each operation type.
 */
export interface AuthConfig {
  /** Basic auth for WebDAV (username/access-key) */
  basic?: BasicAuthConfig;

  /** OAuth credentials for OCAPI/platform APIs */
  oauth?: OAuthAuthConfig;

  /** API key for MRT/external services */
  apiKey?: ApiKeyAuthConfig;

  /**
   * Allowed authentication methods in priority order.
   * If not set, defaults to all methods: ['client-credentials', 'implicit', 'basic', 'api-key']
   */
  authMethods?: AuthMethod[];
}

/**
 * Access token response structure from Account Manager
 */
export interface AccessTokenResponse {
  accessToken: string;
  expires: Date;
  scopes: string[];
}

/**
 * Decoded JWT structure
 */
export interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

/**
 * Available authentication methods.
 * - 'client-credentials': OAuth client credentials flow (requires clientId + clientSecret)
 * - 'jwt': OAuth JWT Bearer flow (requires clientId + JWT certificate/key pair)
 * - 'implicit': Interactive browser-based OAuth (requires clientId only)
 * - 'basic': Username/password (access key) authentication
 * - 'api-key': API key authentication (for MRT, etc.)
 */
export type AuthMethod = 'client-credentials' | 'jwt' | 'implicit' | 'basic' | 'api-key';

/** All available auth methods in default priority order */
export const ALL_AUTH_METHODS: AuthMethod[] = ['client-credentials', 'jwt', 'implicit', 'basic', 'api-key'];

/**
 * Configuration for resolving an auth strategy.
 * Combines all possible credential types.
 */
export interface AuthCredentials {
  /** OAuth client ID */
  clientId?: string;
  /** OAuth client secret (for client-credentials flow) */
  clientSecret?: string;
  /** OAuth scopes to request */
  scopes?: string[];
  /** Account Manager host (defaults to account.demandware.com) */
  accountManagerHost?: string;
  /** Username for basic auth */
  username?: string;
  /** Password/access key for basic auth */
  password?: string;
  /** API key for api-key auth */
  apiKey?: string;
  /** Header name for API key (defaults to Authorization with Bearer prefix) */
  apiKeyHeaderName?: string;
  /** Override redirect URI for implicit OAuth flow (e.g., for port forwarding in remote environments) */
  redirectUri?: string;
  /** Custom browser opener for implicit OAuth flow. Receives the authorization URL. */
  openBrowser?: (url: string) => Promise<void>;
}
