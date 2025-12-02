import {createServer, type Server, type IncomingMessage, type ServerResponse} from 'node:http';
import type {Socket} from 'node:net';
import {URL} from 'node:url';
import type {AuthStrategy, AccessTokenResponse, DecodedJWT} from './types.js';
import {getLogger} from '../logging/logger.js';
import {decodeJWT} from './oauth.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';

const DEFAULT_LOCAL_PORT = 8080;

// Module-level token cache to support multiple instances with same clientId
const ACCESS_TOKEN_CACHE: Map<string, AccessTokenResponse> = new Map();

// Module-level pending auth promises to prevent concurrent auth flows for the same clientId
const PENDING_AUTH: Map<string, Promise<AccessTokenResponse>> = new Map();

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

    const logger = getLogger();
    logger.debug(
      {clientId: this.config.clientId, accountManagerHost: this.accountManagerHost, localPort: this.localPort},
      `[Auth] ImplicitOAuthStrategy initialized for client: ${this.config.clientId}`,
    );
    logger.trace(
      {scopes: this.config.scopes},
      `[Auth] Configured scopes: ${this.config.scopes?.join(', ') || '(none)'}`,
    );
  }

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const logger = getLogger();
    const method = init.method || 'GET';

    logger.trace({method, url}, `[Auth] Fetching with implicit OAuth: ${method} ${url}`);

    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this.config.clientId);

    const startTime = Date.now();
    let res = await fetch(url, {...init, headers});
    const duration = Date.now() - startTime;

    logger.debug(
      {method, url, status: res.status, duration},
      `[Auth] Response: ${method} ${url} ${res.status} ${duration}ms`,
    );

    // RESILIENCE: If the server says 401, the token might have expired or been revoked.
    // We retry exactly once after invalidating the cached token.
    if (res.status === 401) {
      logger.debug('[Auth] Received 401, invalidating token and retrying');
      this.invalidateToken();
      const newToken = await this.getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);

      const retryStart = Date.now();
      res = await fetch(url, {...init, headers});
      const retryDuration = Date.now() - retryStart;

      logger.debug(
        {method, url, status: res.status, duration: retryDuration},
        `[Auth] Retry response: ${method} ${url} ${res.status} ${retryDuration}ms`,
      );
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
   * Gets an access token, using cache if valid.
   * Uses a mutex to prevent concurrent auth flows for the same clientId.
   */
  private async getAccessToken(): Promise<string> {
    const logger = getLogger();
    const clientId = this.config.clientId;
    const cached = ACCESS_TOKEN_CACHE.get(clientId);

    logger.trace({clientId, hasCached: !!cached}, '[Auth] Getting access token');

    if (cached) {
      const now = new Date();
      const requiredScopes = this.config.scopes || [];
      const hasAllScopes = requiredScopes.every((scope) => cached.scopes.includes(scope));
      const timeUntilExpiry = cached.expires.getTime() - now.getTime();

      logger.trace(
        {
          cachedScopes: cached.scopes,
          requiredScopes,
          hasAllScopes,
          expiresAt: cached.expires.toISOString(),
          timeUntilExpiryMs: timeUntilExpiry,
        },
        '[Auth] Checking cached token validity',
      );

      if (!hasAllScopes) {
        logger.warn(
          {cachedScopes: cached.scopes, requiredScopes},
          '[Auth] Access token missing scopes; invalidating and re-authenticating',
        );
        ACCESS_TOKEN_CACHE.delete(clientId);
      } else if (now.getTime() > cached.expires.getTime()) {
        logger.warn(
          {expiresAt: cached.expires.toISOString()},
          '[Auth] Access token expired; invalidating and re-authenticating',
        );
        ACCESS_TOKEN_CACHE.delete(clientId);
      } else {
        logger.debug(
          {timeUntilExpiryMs: timeUntilExpiry},
          `[Auth] Reusing cached access token (expires in ${Math.round(timeUntilExpiry / 1000)}s)`,
        );
        return cached.accessToken;
      }
    }

    // Check if there's already an auth flow in progress for this clientId
    const pendingAuth = PENDING_AUTH.get(clientId);
    if (pendingAuth) {
      logger.debug('[Auth] Auth flow already in progress, waiting for it to complete');
      const tokenResponse = await pendingAuth;
      return tokenResponse.accessToken;
    }

    // Start new auth flow and store the promise so concurrent calls can wait
    logger.debug('[Auth] No valid cached token, starting implicit flow login');
    const authPromise = this.implicitFlowLogin();
    PENDING_AUTH.set(clientId, authPromise);

    try {
      const tokenResponse = await authPromise;
      ACCESS_TOKEN_CACHE.set(clientId, tokenResponse);
      logger.debug(
        {expiresAt: tokenResponse.expires.toISOString(), scopes: tokenResponse.scopes},
        '[Auth] New token cached',
      );
      return tokenResponse.accessToken;
    } finally {
      // Clean up pending auth promise
      PENDING_AUTH.delete(clientId);
    }
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

    logger.debug(
      {
        clientId: this.config.clientId,
        redirectUrl,
        scopes: this.config.scopes,
        accountManagerHost: this.accountManagerHost,
      },
      '[Auth] Starting implicit OAuth flow',
    );
    logger.trace({authorizeUrl}, '[Auth] Authorization URL');

    // Print URL to console (in case machine has no default browser)
    logger.info(`Login URL: ${authorizeUrl}`);
    logger.info('If the URL does not open automatically, copy/paste it into a browser on this machine.');

    // Attempt to open the browser
    logger.debug('[Auth] Attempting to open browser');
    await openBrowser(authorizeUrl);

    return new Promise<AccessTokenResponse>((resolve, reject) => {
      const sockets: Set<Socket> = new Set();
      const startTime = Date.now();

      const server: Server = createServer((request: IncomingMessage, response: ServerResponse) => {
        const requestUrl = new URL(request.url || '/', `http://localhost:${this.localPort}`);
        const accessToken = requestUrl.searchParams.get('access_token');
        const error = requestUrl.searchParams.get('error');
        const errorDescription = requestUrl.searchParams.get('error_description');

        logger.trace(
          {
            path: requestUrl.pathname,
            hasAccessToken: !!accessToken,
            hasError: !!error,
          },
          `[Auth] Received redirect request: ${requestUrl.pathname}`,
        );

        if (!accessToken && !error) {
          // Serve HTML page to extract token from URL fragment
          logger.debug('[Auth] Serving token extraction HTML page');
          response.writeHead(200, {'Content-Type': 'text/html'});
          response.write(getOauth2RedirectHTML(this.localPort));
          response.end();
        } else if (accessToken) {
          const authDuration = Date.now() - startTime;
          // Successfully received access token
          logger.debug({authDurationMs: authDuration}, `[Auth] Got access token response (took ${authDuration}ms)`);
          logger.info('Successfully authenticated');

          try {
            const jwt = decodeJWT(accessToken);
            logger.trace({jwt: jwt.payload}, '[Auth] Decoded JWT payload');
          } catch {
            logger.debug('[Auth] Error decoding JWT (token may not be a JWT)');
          }

          const expiresIn = parseInt(requestUrl.searchParams.get('expires_in') || '0', 10);
          const now = new Date();
          const expiration = new Date(now.getTime() + expiresIn * 1000);
          const scopes = requestUrl.searchParams.get('scope')?.split(' ') ?? [];

          logger.debug(
            {expiresIn, expiresAt: expiration.toISOString(), scopes},
            `[Auth] Token expires in ${expiresIn}s, scopes: ${scopes.join(', ') || '(none)'}`,
          );

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
            logger.debug('[Auth] Shutting down OAuth redirect server');
            server.close(() => logger.trace('[Auth] OAuth redirect server closed'));
            for (const socket of sockets) {
              socket.destroy();
            }
            logger.trace({socketCount: sockets.size}, '[Auth] Cleaned up sockets');
          }, 100);
        } else if (error) {
          // OAuth error response
          const errorMessage = errorDescription || error;
          logger.error({error, errorDescription}, `[Auth] OAuth error: ${errorMessage}`);
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
        logger.trace({socketCount: sockets.size}, '[Auth] New socket connection');
        socket.on('close', () => {
          sockets.delete(socket);
          logger.trace({socketCount: sockets.size}, '[Auth] Socket closed');
        });
      });

      server.listen(this.localPort, () => {
        logger.debug({port: this.localPort}, `[Auth] OAuth redirect server listening on port ${this.localPort}`);
        logger.info('Waiting for user to authenticate...');
      });

      server.on('error', (err) => {
        logger.error({error: err.message, port: this.localPort}, `[Auth] Failed to start OAuth redirect server`);
        reject(new Error(`Failed to start OAuth redirect server: ${err.message}`));
      });
    });
  }
}
