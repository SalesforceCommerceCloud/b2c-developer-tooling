import type {AuthStrategy, AccessTokenResponse, DecodedJWT} from './types.js';
import {getLogger} from '../logging/logger.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';

// Module-level token cache to support multiple instances with same clientId
const ACCESS_TOKEN_CACHE: Map<string, AccessTokenResponse> = new Map();

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  accountManagerHost?: string;
}

/**
 * Decodes a JWT token without verification
 */
function decodeJWT(jwt: string): DecodedJWT {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  return {header, payload};
}

export class OAuthStrategy implements AuthStrategy {
  private accountManagerHost: string;

  constructor(private config: OAuthConfig) {
    this.accountManagerHost = config.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
  }

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this.config.clientId);

    let res = await fetch(url, {...init, headers});

    // RESILIENCE: If the server says 401, the token might have expired or been revoked.
    // We retry exactly once after invalidating the cached token.
    if (res.status === 401) {
      this.invalidateToken();
      const newToken = await this.getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(url, {...init, headers});
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
    const cached = ACCESS_TOKEN_CACHE.get(this.config.clientId);

    if (cached) {
      const now = new Date();
      const requiredScopes = this.config.scopes || [];
      const hasAllScopes = requiredScopes.every((scope) => cached.scopes.includes(scope));

      if (hasAllScopes && now.getTime() <= cached.expires.getTime()) {
        logger.debug('Reusing cached access token');
        return cached;
      }
    }

    // Get new token via client credentials
    const tokenResponse = await this.clientCredentialsGrant();
    ACCESS_TOKEN_CACHE.set(this.config.clientId, tokenResponse);
    return tokenResponse;
  }

  /**
   * Invalidates the cached token, forcing re-authentication on next request
   */
  invalidateToken(): void {
    ACCESS_TOKEN_CACHE.delete(this.config.clientId);
  }

  /**
   * Gets an access token, using cache if valid
   */
  private async getAccessToken(): Promise<string> {
    const logger = getLogger();
    const cached = ACCESS_TOKEN_CACHE.get(this.config.clientId);

    if (cached) {
      const now = new Date();
      const requiredScopes = this.config.scopes || [];
      const hasAllScopes = requiredScopes.every((scope) => cached.scopes.includes(scope));

      if (!hasAllScopes) {
        logger.warn('Access token missing scopes; invalidating and re-authenticating');
        ACCESS_TOKEN_CACHE.delete(this.config.clientId);
      } else if (now.getTime() > cached.expires.getTime()) {
        logger.warn('Access token expired; invalidating and re-authenticating');
        ACCESS_TOKEN_CACHE.delete(this.config.clientId);
      } else {
        logger.debug('Reusing cached access token');
        return cached.accessToken;
      }
    }

    // Get new token via client credentials
    const tokenResponse = await this.clientCredentialsGrant();
    ACCESS_TOKEN_CACHE.set(this.config.clientId, tokenResponse);
    return tokenResponse.accessToken;
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
    const requestHeaders = {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    logger.debug(
      {clientId: this.config.clientId},
      `[Auth] Using OAuth client_credentials grant for client: ${this.config.clientId}`,
    );
    // Debug: Log request start
    logger.debug({method, url}, `[Auth REQ] ${method} ${url}`);

    // Trace: Log request details
    logger.trace({headers: requestHeaders, body: params.toString()}, `[Auth REQ BODY] ${method} ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: params.toString(),
    });
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
      logger.trace({headers: responseHeaders, body: errorText}, `[Auth RESP BODY] ${method} ${url}`);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      scope?: string;
    };

    // Trace: Log response details
    logger.trace({headers: responseHeaders, body: data}, `[Auth RESP BODY] ${method} ${url}`);

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

export {decodeJWT};
