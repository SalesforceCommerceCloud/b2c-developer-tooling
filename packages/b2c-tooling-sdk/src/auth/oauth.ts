/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy, AccessTokenResponse, DecodedJWT, FetchInit} from './types.js';
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
 * Scans the cache for a non-expired token (matching the supplied identity
 * prefix) whose scopes are a superset of `requiredScopes`.
 *
 * Used by cascade resolution: a cached token granted with broader scopes
 * (e.g. `sfcc.jobs.rw`) automatically satisfies a later request that needs
 * a narrower scope (e.g. `sfcc.jobs`), with no extra AM round trip.
 *
 * The identity prefix is `${accountManagerHost}:${clientId}:${method}:` —
 * the same prefix `getOAuthCacheKey` produces. We iterate cache values that
 * share this prefix; in practice 1-3 entries per identity.
 *
 * @returns The first satisfying token, or undefined if none.
 */
export function findCachedTokenSatisfying(
  identityPrefix: string,
  requiredScopes: string[],
): AccessTokenResponse | undefined {
  const now = new Date();
  for (const [key, entry] of ACCESS_TOKEN_CACHE) {
    if (!key.startsWith(identityPrefix)) continue;
    if (now.getTime() > entry.expires.getTime()) {
      ACCESS_TOKEN_CACHE.delete(key);
      continue;
    }
    if (requiredScopes.every((s) => entry.scopes.includes(s))) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Invalidates a cached OAuth token.
 *
 * @param cacheKey - Cache key from getOAuthCacheKey()
 */
export function invalidateCachedOAuthToken(cacheKey: string): void {
  ACCESS_TOKEN_CACHE.delete(cacheKey);
}

export class OAuthStrategy implements AuthStrategy {
  private accountManagerHost: string;
  private _hasHadSuccess = false;
  private cacheKey: string;

  constructor(private config: OAuthConfig) {
    this.accountManagerHost = config.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
    this.cacheKey = getOAuthCacheKey(
      this.config.clientId,
      'client-credentials',
      this.accountManagerHost,
      this.config.scopes,
    );
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this.config.clientId);

    // Pass through dispatcher for TLS/mTLS support
    // Node.js fetch accepts dispatcher as an undocumented option
    let res = await fetch(url, {...init, headers} as RequestInit);

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
      res = await fetch(url, {...init, headers} as RequestInit);
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
   * Resolves a scope cascade. See {@link AuthStrategy.getAccessTokenForCascade}.
   *
   * Each candidate is merged with this strategy's base scopes (e.g. tenant
   * scope baked in via {@link withAdditionalScopes}) before being sent to AM.
   *
   * Cache strategy:
   *   1. For each candidate, scan the cache for any non-expired token whose
   *      scopes ⊇ (base ∪ candidate). First hit wins, no AM call.
   *   2. On miss, request each candidate from AM in order. Cache successes.
   *   3. On `invalid_scope` for a candidate, continue to the next candidate.
   *      On any other error, rethrow.
   */
  async getAccessTokenForCascade(candidates: string[][]): Promise<string> {
    const logger = getLogger();
    const baseScopes = this.config.scopes ?? [];
    const identityPrefix = `${this.accountManagerHost}:${this.config.clientId}:client-credentials:`;

    // Pass 1: cache scan. Return the first cached token that satisfies any
    // candidate.
    for (const candidate of candidates) {
      const required = [...new Set([...baseScopes, ...candidate])];
      const cached = findCachedTokenSatisfying(identityPrefix, required);
      if (cached) {
        logger.debug(
          {required, cachedScopes: cached.scopes},
          `[OAuthStrategy] Cache hit: cached token satisfies cascade candidate ${JSON.stringify(candidate)}`,
        );
        return cached.accessToken;
      }
    }

    // Pass 2: try each candidate against AM in order.
    let lastError: unknown;
    for (const candidate of candidates) {
      const merged = [...new Set([...baseScopes, ...candidate])];
      try {
        logger.debug({scopes: merged}, `[OAuthStrategy] Cascade trying scopes ${JSON.stringify(candidate)}`);
        const tokenResponse = await this.refreshTokenForScopes(merged);
        return tokenResponse.accessToken;
      } catch (error) {
        if (error instanceof Error && error.message.includes('invalid_scope')) {
          logger.debug(
            {scopes: merged},
            `[OAuthStrategy] Cascade candidate ${JSON.stringify(candidate)} rejected (invalid_scope), trying next`,
          );
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    // All candidates exhausted. Rethrow the last invalid_scope.
    throw lastError ?? new Error('All scope cascade candidates failed');
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
    return this.refreshTokenForScopes(this.config.scopes);
  }

  /**
   * Variant of {@link refreshTokenSingleflight} that requests a specific scope
   * set rather than the strategy's configured scopes. Used by cascade
   * resolution. Caches under a key derived from the requested scopes.
   */
  private refreshTokenForScopes(scopes: string[] | undefined): Promise<AccessTokenResponse> {
    const cacheKey = getOAuthCacheKey(this.config.clientId, 'client-credentials', this.accountManagerHost, scopes);
    const existing = PENDING_TOKEN_REQUESTS.get(cacheKey);
    if (existing) {
      getLogger().debug('[OAuthStrategy] Joining in-flight token request');
      return existing;
    }
    const pending = (async () => {
      getLogger().debug({scopes}, '[OAuthStrategy] Requesting new access token');
      const tokenResponse = await this.clientCredentialsGrant(scopes);
      setCachedOAuthToken(cacheKey, tokenResponse);
      return tokenResponse;
    })().finally(() => {
      PENDING_TOKEN_REQUESTS.delete(cacheKey);
    });
    PENDING_TOKEN_REQUESTS.set(cacheKey, pending);
    return pending;
  }

  /**
   * Performs client credentials grant flow with the given scope set.
   * Defaults to the strategy's configured scopes when `scopes` is omitted.
   */
  private async clientCredentialsGrant(scopeOverride?: string[]): Promise<AccessTokenResponse> {
    const logger = getLogger();
    const requestedScopes = scopeOverride ?? this.config.scopes;
    const url = `https://${this.accountManagerHost}/dwsso/oauth2/access_token`;
    const method = 'POST';

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
    });

    if (requestedScopes && requestedScopes.length > 0) {
      params.append('scope', requestedScopes.join(' '));
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
    let response = await fetch(request);

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
    // AM normally echoes back the granted scopes; some configurations omit
    // the `scope` claim in the token response. Fall back to what we
    // requested so cache satisfies-checks (cascade resolution) still work.
    const scopes = data.scope?.split(' ') ?? requestedScopes ?? [];

    return {
      accessToken: data.access_token,
      expires: expiration,
      scopes,
    };
  }
}
