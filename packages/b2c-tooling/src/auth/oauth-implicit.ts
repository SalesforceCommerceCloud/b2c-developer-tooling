import {createServer, type Server, type IncomingMessage, type ServerResponse} from 'node:http';
import type {Socket} from 'node:net';
import {URL} from 'node:url';
import type {AuthStrategy, AccessTokenResponse, DecodedJWT} from './types.js';
import {getLogger} from '../logging/logger.js';
import {decodeJWT} from './oauth.js';

const DEFAULT_ACCOUNT_MANAGER_HOST = 'account.demandware.com';
const DEFAULT_LOCAL_PORT = 8080;

// Module-level token cache to support multiple instances with same clientId
const ACCESS_TOKEN_CACHE: Map<string, AccessTokenResponse> = new Map();

/**
 * Configuration for the implicit OAuth flow.
 */
export interface ImplicitOAuthConfig {
  /** OAuth client ID registered with Account Manager */
  clientId: string;
  /** OAuth scopes to request (e.g., 'sfcc.products', 'sfcc.orders') */
  scopes?: string[];
  /** Account Manager host (defaults to 'account.demandware.com') */
  accountManagerHost?: string;
  /**
   * Local port for the OAuth redirect server.
   * Defaults to 8080 or SFCC_OAUTH_LOCAL_PORT environment variable.
   */
  localPort?: number;
}

/**
 * Returns the HTML page served to the browser to extract the access token
 * from the URL fragment and redirect it as query parameters.
 */
function getOauth2RedirectHTML(port: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OAuth Return Flow</title>
</head>
<body onload="doReturnFlow()">
<script>
    function doReturnFlow() {
        document.location = "http://localhost:${port}/?" + window.location.hash.substring(1);
    }
</script>
</body>
</html>
`;
}

/**
 * Opens the system default browser to the specified URL.
 * Dynamically imports 'open' package to handle the browser opening.
 */
async function openBrowser(url: string): Promise<void> {
  try {
    // Dynamic import of 'open' package
    const open = await import('open');
    await open.default(url);
  } catch {
    // If open fails, the URL will still be printed to console
    getLogger().debug('Could not automatically open browser');
  }
}

/**
 * OAuth 2.0 Implicit Grant Flow authentication strategy.
 *
 * This strategy is used when only a client ID is available (no client secret).
 * It opens a browser for the user to authenticate with Account Manager,
 * then captures the access token from the OAuth redirect.
 *
 * Note: The access token from implicit flow is valid for 30 minutes and cannot be renewed.
 * This flow requires user interaction and a TTY.
 *
 * @example
 * ```typescript
 * import { ImplicitOAuthStrategy } from '@salesforce/b2c-tooling';
 *
 * const auth = new ImplicitOAuthStrategy({
 *   clientId: 'your-client-id',
 *   scopes: ['sfcc.products', 'sfcc.orders'],
 * });
 *
 * // Will open browser for authentication
 * const response = await auth.fetch('https://example.com/api/resource');
 * ```
 */
export class ImplicitOAuthStrategy implements AuthStrategy {
  private accountManagerHost: string;
  private localPort: number;

  constructor(private config: ImplicitOAuthConfig) {
    this.accountManagerHost = config.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
    this.localPort = config.localPort || parseInt(process.env.SFCC_OAUTH_LOCAL_PORT || '', 10) || DEFAULT_LOCAL_PORT;
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

    // Get new token via implicit flow
    const tokenResponse = await this.implicitFlowLogin();
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

    // Get new token via implicit flow
    const tokenResponse = await this.implicitFlowLogin();
    ACCESS_TOKEN_CACHE.set(this.config.clientId, tokenResponse);
    return tokenResponse.accessToken;
  }

  /**
   * Performs an implicit OAuth2 login flow.
   * Opens the user's browser for authentication with Account Manager.
   *
   * NOTE: This method requires a TTY and user intervention; it is interactive.
   * NOTE: Access token is valid for 30 minutes and cannot be renewed.
   */
  private async implicitFlowLogin(): Promise<AccessTokenResponse> {
    const logger = getLogger();
    const redirectUrl = `http://localhost:${this.localPort}`;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUrl,
      response_type: 'token',
    });

    if (this.config.scopes && this.config.scopes.length > 0) {
      params.append('scope', this.config.scopes.join(' '));
    }

    const authorizeUrl = `https://${this.accountManagerHost}/dwsso/oauth2/authorize?${params.toString()}`;

    // Print URL to console (in case machine has no default browser)
    logger.info(`Login URL: ${authorizeUrl}`);
    logger.info('If the URL does not open automatically, copy/paste it into a browser on this machine.');

    // Attempt to open the browser
    await openBrowser(authorizeUrl);

    return new Promise<AccessTokenResponse>((resolve, reject) => {
      const sockets: Set<Socket> = new Set();

      const server: Server = createServer((request: IncomingMessage, response: ServerResponse) => {
        const requestUrl = new URL(request.url || '/', `http://localhost:${this.localPort}`);
        const accessToken = requestUrl.searchParams.get('access_token');
        const error = requestUrl.searchParams.get('error');
        const errorDescription = requestUrl.searchParams.get('error_description');

        if (!accessToken && !error) {
          // Serve HTML page to extract token from URL fragment
          response.writeHead(200, {'Content-Type': 'text/html'});
          response.write(getOauth2RedirectHTML(this.localPort));
          response.end();
        } else if (accessToken) {
          // Successfully received access token
          logger.debug(`Got access token response`);
          logger.info('Successfully authenticated');

          try {
            const jwt = decodeJWT(accessToken);
            logger.trace({jwt: jwt.payload}, '[Auth] JWT payload');
          } catch {
            logger.debug('Error decoding JWT');
          }

          const expiresIn = parseInt(requestUrl.searchParams.get('expires_in') || '0', 10);
          const now = new Date();
          const expiration = new Date(now.getTime() + expiresIn * 1000);
          const scopes = requestUrl.searchParams.get('scope')?.split(' ') ?? [];

          resolve({
            accessToken,
            expires: expiration,
            scopes,
          });

          response.writeHead(200, {'Content-Type': 'text/plain'});
          response.write('Authentication successful! You may close this browser window and return to your terminal.');
          response.end();

          // Shutdown server after a short delay
          setTimeout(() => {
            logger.debug('Shutting down OAuth redirect server');
            server.close(() => logger.debug('OAuth redirect server shutdown'));
            for (const socket of sockets) {
              socket.destroy();
            }
          }, 100);
        } else if (error) {
          // OAuth error response
          const errorMessage = errorDescription || error;
          response.writeHead(500, {'Content-Type': 'text/plain'});
          response.write(`Authentication failed: ${errorMessage}`);
          response.end();
          reject(new Error(`OAuth error: ${errorMessage}`));

          setTimeout(() => {
            server.close();
            for (const socket of sockets) {
              socket.destroy();
            }
          }, 100);
        }
      });

      server.on('connection', (socket) => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
      });

      server.listen(this.localPort, () => {
        logger.debug(`Local OAuth redirect server listening at http://localhost:${this.localPort}`);
        logger.info('Waiting for user to authenticate...');
      });

      server.on('error', (err) => {
        reject(new Error(`Failed to start OAuth redirect server: ${err.message}`));
      });
    });
  }
}
