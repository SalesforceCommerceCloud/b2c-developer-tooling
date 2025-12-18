/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
export interface AuthStrategy {
  /**
   * Performs a fetch request.
   * Implementations MUST handle header injection and 401 retries (token refresh) internally.
   */
  fetch(url: string, init?: RequestInit): Promise<Response>;

  /**
   * Optional: Helper for legacy clients (like a strict WebDAV lib) that need the raw header.
   */
  getAuthorizationHeader?(): Promise<string>;
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
 * - 'implicit': Interactive browser-based OAuth (requires clientId only)
 * - 'basic': Username/password (access key) authentication
 * - 'api-key': API key authentication (for MRT, etc.)
 */
export type AuthMethod = 'client-credentials' | 'implicit' | 'basic' | 'api-key';

/** All available auth methods in default priority order */
export const ALL_AUTH_METHODS: AuthMethod[] = ['client-credentials', 'implicit', 'basic', 'api-key'];

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
}
