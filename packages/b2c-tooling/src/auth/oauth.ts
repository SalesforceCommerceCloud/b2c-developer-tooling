import {AuthStrategy, AccessTokenResponse, DecodedJWT} from './types.js';
import {getLogger} from '../logger.js';

const DEFAULT_ACCOUNT_MANAGER_HOST = 'account.demandware.com';

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
    logger.debug('Getting access token from client credentials');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
    });

    if (this.config.scopes && this.config.scopes.length > 0) {
      params.append('scope', this.config.scopes.join(' '));
    }

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(`https://${this.accountManagerHost}/dwsso/oauth2/access_token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      scope?: string;
    };

    const jwt = decodeJWT(data.access_token);
    logger.debug(`JWT payload: ${JSON.stringify(jwt.payload, null, 2)}`);

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
