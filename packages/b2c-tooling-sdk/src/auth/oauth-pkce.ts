/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash, randomBytes} from 'node:crypto';
import {createServer, type Server, type IncomingMessage, type ServerResponse} from 'node:http';
import type {Socket} from 'node:net';
import {URL} from 'node:url';
import type {AuthStrategy, AccessTokenResponse, DecodedJWT, FetchInit} from './types.js';
import {getLogger} from '../logging/logger.js';
import {decodeJWT} from './oauth.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {findAuthSession, saveAuthSession, type AuthSession} from './session-store.js';

const DEFAULT_LOCAL_PORT = 8080;

const ACCESS_TOKEN_CACHE: Map<string, AccessTokenResponse> = new Map();
const PENDING_AUTH: Map<string, Promise<AccessTokenResponse>> = new Map();

/**
 * Configuration for the OAuth Authorization Code + PKCE flow.
 */
export interface PkceOAuthConfig {
  clientId: string;
  scopes?: string[];
  accountManagerHost?: string;
  /** Local port for the redirect server (default 8080 or SFCC_OAUTH_LOCAL_PORT). */
  localPort?: number;
  /** Override redirect URI (default `http://localhost:${localPort}` or SFCC_REDIRECT_URI). */
  redirectUri?: string;
  /** Custom browser opener. Receives the authorization URL. */
  openBrowser?: (url: string) => Promise<void>;
  /**
   * Persist tokens (access + refresh) to disk between CLI invocations,
   * keyed by clientId. When a refresh token is available it is used to
   * silently obtain a new access token instead of opening the browser.
   * Defaults to `true`.
   */
  persistSession?: boolean;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replaceAll('+', '-').replaceAll('/', '_');
}

function generatePkcePair(): {verifier: string; challenge: string} {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return {verifier, challenge};
}

async function openBrowserDefault(url: string): Promise<void> {
  try {
    const open = await import('open');
    await open.default(url);
  } catch {
    getLogger().debug('Could not automatically open browser');
  }
}

/**
 * OAuth 2.0 Authorization Code Flow with PKCE.
 *
 * Used for public clients (no client secret). Replaces the legacy implicit flow,
 * which is deprecated for public clients per OAuth 2.1.
 *
 * Flow:
 * 1. Generate PKCE verifier + S256 challenge.
 * 2. Open browser to `/dwsso/oauth2/authorize?response_type=code&code_challenge=...`.
 * 3. Capture redirect with `?code=...` on a localhost listener.
 * 4. POST `grant_type=authorization_code` + `code_verifier` to `/dwsso/oauth2/access_token`.
 *
 * Tokens may include a refresh_token (depends on client registration in Account Manager).
 */
export class PkceOAuthStrategy implements AuthStrategy {
  private accountManagerHost: string;
  private localPort: number;
  private redirectUri: string;
  private persistSession: boolean;
  private _hasHadSuccess = false;
  private _refreshToken: string | null = null;
  private _sub = '';
  private _hydrated = false;

  constructor(private config: PkceOAuthConfig) {
    this.accountManagerHost = config.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
    this.localPort = config.localPort || parseInt(process.env.SFCC_OAUTH_LOCAL_PORT || '', 10) || DEFAULT_LOCAL_PORT;
    this.redirectUri = config.redirectUri || process.env.SFCC_REDIRECT_URI || `http://localhost:${this.localPort}`;
    this.persistSession = config.persistSession !== false;

    getLogger().debug(
      {
        clientId: this.config.clientId,
        accountManagerHost: this.accountManagerHost,
        port: this.localPort,
        redirectUri: this.redirectUri,
        persistSession: this.persistSession,
      },
      '[Auth] PkceOAuthStrategy initialized',
    );
  }

  /**
   * Load any persisted session for this clientId. Idempotent.
   */
  private hydrate(): void {
    if (!this.persistSession || this._hydrated) return;
    this._hydrated = true;
    try {
      const stored = findAuthSession(this.config.clientId);
      if (!stored || stored.flow !== 'pkce') return;
      this._sub = stored.sub ?? '';
      this._refreshToken = stored.refreshToken ?? null;
      if (!ACCESS_TOKEN_CACHE.has(this.config.clientId) && stored.accessToken) {
        const expires = stored.expiresAt ? new Date(stored.expiresAt) : new Date(0);
        ACCESS_TOKEN_CACHE.set(this.config.clientId, {
          accessToken: stored.accessToken,
          expires,
          scopes: stored.scopes ?? [],
        });
      }
      getLogger().debug(
        {clientId: this.config.clientId, sub: this._sub, hasRefresh: this._refreshToken !== null},
        '[Auth] Hydrated PKCE session from store',
      );
    } catch (error) {
      getLogger().debug({err: error}, '[Auth] PKCE store hydration failed');
    }
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const logger = getLogger();
    const method = init.method || 'GET';

    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this.config.clientId);

    let res = await fetch(url, {...init, headers} as RequestInit);
    logger.debug({method, url, status: res.status}, '[Auth] Response');

    if (res.status !== 401) {
      this._hasHadSuccess = true;
    }

    if (res.status === 401 && this._hasHadSuccess) {
      logger.debug('[Auth] Received 401, invalidating PKCE token and retrying');
      this.invalidateToken();
      const newToken = await this.getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(url, {...init, headers} as RequestInit);
      logger.debug({method, url, status: res.status}, '[Auth] Retry response');
    }

    return res;
  }

  async getAuthorizationHeader(): Promise<string> {
    const token = await this.getAccessToken();
    return `Bearer ${token}`;
  }

  async getJWT(): Promise<DecodedJWT> {
    const token = await this.getAccessToken();
    return decodeJWT(token);
  }

  async getTokenResponse(): Promise<AccessTokenResponse> {
    this.hydrate();
    const cached = ACCESS_TOKEN_CACHE.get(this.config.clientId);
    if (cached && this.isCachedTokenUsable(cached)) {
      return cached;
    }
    if (this._refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return refreshed;
    }
    const tokenResponse = await this.runFlow();
    ACCESS_TOKEN_CACHE.set(this.config.clientId, tokenResponse);
    return tokenResponse;
  }

  invalidateToken(): void {
    ACCESS_TOKEN_CACHE.delete(this.config.clientId);
    this._refreshToken = null;
  }

  private isCachedTokenUsable(cached: AccessTokenResponse): boolean {
    const requiredScopes = this.config.scopes || [];
    const hasAllScopes = requiredScopes.every((scope) => cached.scopes.includes(scope));
    return hasAllScopes && Date.now() <= cached.expires.getTime();
  }

  private async getAccessToken(): Promise<string> {
    this.hydrate();
    const clientId = this.config.clientId;
    const cached = ACCESS_TOKEN_CACHE.get(clientId);
    if (cached && this.isCachedTokenUsable(cached)) {
      return cached.accessToken;
    }
    if (cached) {
      ACCESS_TOKEN_CACHE.delete(clientId);
    }

    const pending = PENDING_AUTH.get(clientId);
    if (pending) {
      const tokenResponse = await pending;
      return tokenResponse.accessToken;
    }

    const authPromise = (async (): Promise<AccessTokenResponse> => {
      if (this._refreshToken) {
        const refreshed = await this.tryRefresh();
        if (refreshed) return refreshed;
      }
      return this.runFlow();
    })();
    PENDING_AUTH.set(clientId, authPromise);
    try {
      const tokenResponse = await authPromise;
      ACCESS_TOKEN_CACHE.set(clientId, tokenResponse);
      return tokenResponse.accessToken;
    } finally {
      PENDING_AUTH.delete(clientId);
    }
  }

  /**
   * Exchange a stored refresh_token for a new access token. Returns null if no
   * refresh token is available or the exchange fails (e.g. revoked / expired).
   * On failure, the refresh token is forgotten so the next request triggers
   * the browser flow.
   */
  private async tryRefresh(): Promise<AccessTokenResponse | null> {
    const logger = getLogger();
    if (!this._refreshToken) return null;

    const tokenUrl = `https://${this.accountManagerHost}/dwsso/oauth2/access_token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this._refreshToken,
      client_id: this.config.clientId,
    });
    if (this.config.scopes && this.config.scopes.length > 0) {
      body.set('scope', this.config.scopes.join(' '));
    }

    let response: Response;
    try {
      response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: body.toString(),
      });
    } catch (error) {
      logger.debug({err: error}, '[Auth] PKCE refresh request failed');
      this._refreshToken = null;
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      logger.debug({status: response.status, body: text}, '[Auth] PKCE refresh failed; falling back to browser flow');
      this._refreshToken = null;
      return null;
    }

    let parsed: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };
    try {
      parsed = (await response.json()) as typeof parsed;
    } catch (error) {
      logger.debug({err: error}, '[Auth] PKCE refresh returned non-JSON response');
      this._refreshToken = null;
      return null;
    }

    const expiresIn = parsed.expires_in ?? 0;
    const expires = new Date(Date.now() + expiresIn * 1000);
    const scopes = parsed.scope ? parsed.scope.split(' ') : (this.config.scopes ?? []);
    const tokenResponse: AccessTokenResponse = {
      accessToken: parsed.access_token,
      expires,
      scopes,
    };
    if (parsed.refresh_token) {
      this._refreshToken = parsed.refresh_token;
    }
    this.persistTokens(tokenResponse);
    logger.debug({clientId: this.config.clientId}, '[Auth] PKCE token refreshed silently');
    return tokenResponse;
  }

  /**
   * Persist the current token + refresh token. No-op when `persistSession`
   * is disabled. Updates `_sub` from the JWT when available so the persisted
   * record carries the authenticated user identity for diagnostics.
   */
  private persistTokens(tokenResponse: AccessTokenResponse): void {
    if (!this.persistSession) return;

    let sub = this._sub;
    try {
      const decoded = decodeJWT(tokenResponse.accessToken);
      if (typeof decoded.payload.sub === 'string' && decoded.payload.sub.length > 0) {
        sub = decoded.payload.sub;
      }
    } catch {
      // ignore — token may not be a JWT, fall back to existing _sub
    }
    this._sub = sub;
    const record: AuthSession = {
      clientId: this.config.clientId,
      flow: 'pkce',
      accessToken: tokenResponse.accessToken,
      refreshToken: this._refreshToken,
      sub,
      expiresAt: tokenResponse.expires.toISOString(),
      scopes: tokenResponse.scopes,
      accountManagerHost: this.accountManagerHost,
    };
    try {
      saveAuthSession(record);
    } catch (error) {
      getLogger().debug({err: error}, '[Auth] Failed to persist PKCE session');
    }
  }

  private async runFlow(): Promise<AccessTokenResponse> {
    const logger = getLogger();
    const {verifier, challenge} = generatePkcePair();
    const state = base64url(randomBytes(16));

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });
    if (this.config.scopes && this.config.scopes.length > 0) {
      params.set('scope', this.config.scopes.join(' '));
    }

    const authorizeUrl = `https://${this.accountManagerHost}/dwsso/oauth2/authorize?${params.toString()}`;

    logger.info({url: authorizeUrl}, `Login URL: ${authorizeUrl}`);
    logger.info('If the URL does not open automatically, copy/paste it into a browser on this machine.');

    if (this.config.openBrowser) {
      await this.config.openBrowser(authorizeUrl);
    } else {
      await openBrowserDefault(authorizeUrl);
    }

    const code = await this.waitForAuthCode(state);
    logger.debug({codePrefix: code.slice(0, 8)}, '[Auth] Got authorization code, exchanging for token');

    const tokenUrl = `https://${this.accountManagerHost}/dwsso/oauth2/access_token`;
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.config.clientId,
      code_verifier: verifier,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: tokenBody.toString(),
    });
    const rawText = await tokenRes.text();
    if (!tokenRes.ok) {
      throw new Error(`PKCE token exchange failed (${tokenRes.status}): ${rawText}`);
    }

    let parsed: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(`PKCE token exchange returned non-JSON response: ${rawText}`);
    }

    const expiresIn = parsed.expires_in ?? 0;
    const expires = new Date(Date.now() + expiresIn * 1000);
    const scopes = parsed.scope ? parsed.scope.split(' ') : (this.config.scopes ?? []);
    const tokenResponse: AccessTokenResponse = {
      accessToken: parsed.access_token,
      expires,
      scopes,
    };

    if (parsed.refresh_token) {
      this._refreshToken = parsed.refresh_token;
    }
    this.persistTokens(tokenResponse);

    return tokenResponse;
  }

  private waitForAuthCode(expectedState: string): Promise<string> {
    const logger = getLogger();
    return new Promise<string>((resolve, reject) => {
      const sockets: Set<Socket> = new Set();
      const cleanup = () => {
        setTimeout(() => {
          server.close();
          for (const socket of sockets) socket.destroy();
        }, 100);
      };

      const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
        const requestUrl = new URL(req.url || '/', `http://localhost:${this.localPort}`);
        const code = requestUrl.searchParams.get('code');
        const state = requestUrl.searchParams.get('state') ?? '';
        const error = requestUrl.searchParams.get('error');
        const errorDescription = requestUrl.searchParams.get('error_description');

        if (error) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end(`Authentication failed: ${errorDescription ?? error}`);
          reject(new Error(`OAuth error: ${errorDescription ?? error}`));
          cleanup();
          return;
        }

        if (!code) {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.end('Waiting for authorization code...');
          return;
        }

        if (state !== expectedState) {
          res.writeHead(400, {'Content-Type': 'text/plain'});
          res.end('State mismatch.');
          reject(new Error('OAuth state mismatch — aborting'));
          cleanup();
          return;
        }

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Authentication successful! You may close this browser window and return to your terminal.');
        resolve(code);
        cleanup();
      });

      server.on('connection', (socket) => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
      });

      server.listen(this.localPort, () => {
        logger.debug({port: this.localPort}, `[Auth] PKCE redirect server listening on port ${this.localPort}`);
        logger.info('Waiting for user to authenticate...');
      });

      server.on('error', (err) => {
        const hint =
          'code' in err && (err as NodeJS.ErrnoException).code === 'EADDRINUSE'
            ? ` Port ${this.localPort} is in use; set SFCC_OAUTH_LOCAL_PORT or pass localPort to use a different port.`
            : '';
        reject(new Error(`Failed to start OAuth redirect server: ${err.message}.${hint}`));
      });
    });
  }
}
