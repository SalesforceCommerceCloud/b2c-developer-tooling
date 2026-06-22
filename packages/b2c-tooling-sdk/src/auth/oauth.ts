/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy, AccessTokenResponse, DecodedJWT, FetchInit} from './types.js';
import {dispatchFetch} from './dispatch-fetch.js';
import {wrapNetworkError} from '../errors/network-error.js';
import {getLogger} from '../logging/logger.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {globalAuthMiddlewareRegistry, applyAuthRequestMiddleware, applyAuthResponseMiddleware} from './middleware.js';

// Module-level token cache to support multiple instances with same clientId
const ACCESS_TOKEN_CACHE: Map<string, AccessTokenResponse> = new Map();

// In-flight token requests, keyed by cacheKey, so concurrent callers coalesce
// onto a single token-endpoint round trip instead of stampeding the server.
const PENDING_TOKEN_REQUESTS: Map<string, Promise<AccessTokenResponse>> = new Map();

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  accountManagerHost?: string;
}

/**
 * Decodes a JWT token without verification.
 * Exported for use by other auth strategies.
 */
export function decodeJWT(jwt: string): DecodedJWT {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  return {header, payload};
}

/**
 * Generates a cache key for OAuth tokens.
 * Includes auth method to distinguish between client-credentials and JWT tokens.
 *
 * @param clientId - OAuth client ID
 * @param method - Authentication method (client-credentials or jwt)
 * @param accountManagerHost - Account Manager hostname
 * @param scopes - OAuth scopes (optional)
 * @returns Cache key string
 */
export function getOAuthCacheKey(
  clientId: string,
  method: 'client-credentials' | 'jwt',
  accountManagerHost: string,
  scopes?: string[],
): string {
  const scopesKey = scopes?.sort().join(',') || '';
  return `${accountManagerHost}:${clientId}:${method}:${scopesKey}`;
}

/**
 * Gets a cached OAuth token if valid.
 *
 * @param cacheKey - Cache key from getOAuthCacheKey()
 * @param requiredScopes - Scopes that must be present in the cached token
 * @returns Cached token response if valid, undefined otherwise
 */
export function getCachedOAuthToken(cacheKey: string, requiredScopes: string[] = []): AccessTokenResponse | undefined {
  const cached = ACCESS_TOKEN_CACHE.get(cacheKey);
  if (!cached) return undefined;

  const now = new Date();
  const hasAllScopes = requiredScopes.every((scope) => cached.scopes.includes(scope));

  // Check if token is expired or missing required scopes
  if (!hasAllScopes || now.getTime() > cached.expires.getTime()) {
    ACCESS_TOKEN_CACHE.delete(cacheKey);
    return undefined;
  }

  return cached;
}

/**
 * Stores an OAuth token in the global cache.
 *
 * @param cacheKey - Cache key from getOAuthCacheKey()
 * @param tokenResponse - Token response to cache
 */
export function setCachedOAuthToken(cacheKey: string, tokenResponse: AccessTokenResponse): void {
  ACCESS_TOKEN_CACHE.set(cacheKey, tokenResponse);
}

/**
 * Invalidates a cached OAuth token.
 *
 * @param cacheKey - Cache key from getOAuthCacheKey()
 */
export function invalidateCachedOAuthToken(cacheKey: string): void {
  ACCESS_TOKEN_CACHE.delete(cacheKey);
}

/**
 * OAuth 2.0 Client Credentials authentication strategy.
 *
 * Implements the client credentials flow for automated/server-side authentication
 * with no user interaction required. Automatically manages token caching, expiration,
 * and 401 retry logic with single-flight token requests to prevent thundering herd
 * on the token endpoint.
 *
 * @example
 * ```typescript
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   scopes: ['sfcc.products'],
 * });
 *
 * const response = await auth.fetch('https://api.example.com/products');
 * ```
 */
export class OAuthStrategy implements AuthStrategy {
  private accountManagerHost: string;
  private _hasHadSuccess = false;
  private cacheKey: string;

  /**
   * Creates a new OAuthStrategy instance with the provided OAuth configuration.
   *
   * @param config - OAuth client credentials and optional configuration
   */
  constructor(private config: OAuthConfig) {
    this.accountManagerHost = config.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
    this.cacheKey = getOAuthCacheKey(
      this.config.clientId,
      'client-credentials',
      this.accountManagerHost,
      this.config.scopes,
    );
  }

  /**
   * Performs a fetch request with OAuth bearer token authentication.
   *
   * Automatically injects the Authorization header and client ID header with a valid
   * access token. Implements 401 retry logic: if a previously-successful request
   * returns 401, invalidates the cached token and retries once with a fresh token.
   * Does not retry on initial 401 to avoid retrying with bad credentials.
   *
   * @param url - The URL to fetch
   * @param init - Optional fetch init options (headers, body, method, etc.)
   * @returns The fetch response
   */
  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this.config.clientId);

    // Pass through dispatcher for TLS/mTLS support (see dispatchFetch)
    let res = await dispatchFetch(url, {...init, headers});

    if (res.status !== 401) {
      this._hasHadSuccess = true;
    }

    // RESILIENCE: If we previously had a successful response and now get a 401,
    // the token likely expired. Retry once after invalidating the cached token.
    // Skip retry on initial 401 to avoid retrying with bad credentials.
    if (res.status === 401 && this._hasHadSuccess) {
      this.invalidateToken();
      const newToken = await this.getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await dispatchFetch(url, {...init, headers});
    }

    return res;
  }

  async getAuthorizationHeader(): Promise<string> {
    const token = await this.getAccessToken();
    return `Bearer ${token}`;
  }

  /**
   * Gets the decoded JWT payload
   */
  async getJWT(): Promise<DecodedJWT> {
    const token = await this.getAccessToken();
    return decodeJWT(token);
  }

  /**
   * Gets the full token response including expiration and scopes.
   * Useful for commands that need to display or return token metadata.
   */
  async getTokenResponse(): Promise<AccessTokenResponse> {
    const logger = getLogger();
    const cached = getCachedOAuthToken(this.cacheKey, this.config.scopes || []);

    if (cached) {
      logger.debug('[OAuthStrategy] Reusing cached access token');
      return cached;
    }

    return this.refreshTokenSingleflight();
  }

  /**
   * Invalidates the cached token, forcing re-authentication on next request
   */
  invalidateToken(): void {
    invalidateCachedOAuthToken(this.cacheKey);
  }

  /**
   * Creates a new OAuthStrategy with additional scopes merged in.
   * Used by clients that have specific scope requirements.
   *
   * @param additionalScopes - Scopes to add to this strategy's existing scopes
   * @returns A new OAuthStrategy instance with merged scopes
   */
  withAdditionalScopes(additionalScopes: string[]): OAuthStrategy {
    const mergedScopes = [...new Set([...(this.config.scopes || []), ...additionalScopes])];
    return new OAuthStrategy({
      ...this.config,
      scopes: mergedScopes,
    });
  }

  /**
   * Gets an access token, using cache if valid
   */
  private async getAccessToken(): Promise<string> {
    const logger = getLogger();
    const cached = getCachedOAuthToken(this.cacheKey, this.config.scopes || []);

    if (cached) {
      logger.debug('[OAuthStrategy] Reusing cached access token');
      return cached.accessToken;
    }

    const tokenResponse = await this.refreshTokenSingleflight();
    return tokenResponse.accessToken;
  }

  /**
   * Returns a fresh token, coalescing concurrent callers onto a single in-flight
   * token request keyed by cacheKey. Prevents stampeding the AM token endpoint
   * when many requests trigger refresh at once.
   */
  private refreshTokenSingleflight(): Promise<AccessTokenResponse> {
    const existing = PENDING_TOKEN_REQUESTS.get(this.cacheKey);
    if (existing) {
      getLogger().debug('[OAuthStrategy] Joining in-flight token request');
      return existing;
    }
    const pending = (async () => {
      getLogger().debug('[OAuthStrategy] Requesting new access token');
      const tokenResponse = await this.clientCredentialsGrant();
      setCachedOAuthToken(this.cacheKey, tokenResponse);
      return tokenResponse;
    })().finally(() => {
      PENDING_TOKEN_REQUESTS.delete(this.cacheKey);
    });
    PENDING_TOKEN_REQUESTS.set(this.cacheKey, pending);
    return pending;
  }

  /**
   * Performs client credentials grant flow
   */
  private async clientCredentialsGrant(): Promise<AccessTokenResponse> {
    const logger = getLogger();
    const url = `https://${this.accountManagerHost}/dwsso/oauth2/access_token`;
    const method = 'POST';

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
    });

    if (this.config.scopes && this.config.scopes.length > 0) {
      params.append('scope', this.config.scopes.join(' '));
    }

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    // Build request object for middleware
    let request = new Request(url, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    // Apply auth middleware (e.g., User-Agent)
    const middleware = globalAuthMiddlewareRegistry.getMiddleware();
    request = await applyAuthRequestMiddleware(request, middleware);

    // Convert headers to object for logging
    const requestHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });

    logger.debug(
      {clientId: this.config.clientId},
      `[Auth] Using OAuth client_credentials grant for client: ${this.config.clientId}`,
    );
    // Debug: Log request start
    logger.debug({method, url}, `[Auth REQ] ${method} ${url}`);

    // Trace: Log request details
    logger.trace({method, url, headers: requestHeaders, body: params.toString()}, `[Auth REQ BODY] ${method} ${url}`);

    const startTime = Date.now();
    let response: Response;
    try {
      response = await fetch(request);
    } catch (err) {
      const host = new URL(url).host;
      throw wrapNetworkError(err, {operation: 'OAuth token request', host});
    }

    // Apply response middleware
    response = await applyAuthResponseMiddleware(request, response, middleware);

    const duration = Date.now() - startTime;

    // Debug: Log response summary
    logger.debug(
      {method, url, status: response.status, duration},
      `[Auth RESP] ${method} ${url} ${response.status} ${duration}ms`,
    );

    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.trace({method, url, headers: responseHeaders, body: errorText}, `[Auth RESP BODY] ${method} ${url}`);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      scope?: string;
    };

    // Trace: Log response details
    logger.trace({method, url, headers: responseHeaders, body: data}, `[Auth RESP BODY] ${method} ${url}`);

    const jwt = decodeJWT(data.access_token);
    logger.trace({jwt: jwt.payload}, '[Auth] JWT payload');

    const now = new Date();
    const expiration = new Date(now.getTime() + data.expires_in * 1000);
    const scopes = data.scope?.split(' ') ?? [];

    return {
      accessToken: data.access_token,
      expires: expiration,
      scopes,
    };
  }
}
