/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash, randomBytes} from 'node:crypto';
import {createServer, type Server, type IncomingMessage, type ServerResponse} from 'node:http';
import type {Socket} from 'node:net';
import {URL} from 'node:url';
import type {AuthStrategy, AccessTokenResponse, BrowserLogin, DecodedJWT, FetchInit} from './types.js';
import {openUrlInBrowser} from './open-browser.js';
import {dispatchFetch} from './dispatch-fetch.js';
import {getApiFetch, type HttpTransportOptions} from '../clients/http-transport.js';
import {wrapNetworkError} from '../errors/network-error.js';
import {getLogger} from '../logging/logger.js';
import {decodeJWT} from './oauth.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {
  deleteAuthSession,
  findAuthSession,
  saveAuthSession,
  type AuthSession,
  type AuthSessionBackend,
} from './session-store.js';
import {AuthRequiredError} from './errors.js';
import {describeSignIn} from './instance-auth.js';

const DEFAULT_LOCAL_PORT = 8080;

const ACCESS_TOKEN_CACHE: Map<string, AccessTokenResponse> = new Map();
const PENDING_AUTH: Map<string, Promise<AccessTokenResponse>> = new Map();

// Strategies with their own session backend get their own token caches, so two hosts (or two
// profiles) that share a public client ID never see each other's tokens.
const BACKEND_CACHES = new WeakMap<
  AuthSessionBackend,
  {tokens: Map<string, AccessTokenResponse>; pending: Map<string, Promise<AccessTokenResponse>>}
>();

/**
 * Thrown when the Authorization Code + PKCE flow fails in a way that indicates
 * the Account Manager client is not registered for this grant (e.g. an old
 * implicit-only public client, or a missing/mismatched redirect URI) rather
 * than a transient or user-driven failure.
 *
 * {@link PkceWithImplicitFallbackStrategy} keys its automatic fallback off this
 * type so it retries with the legacy implicit flow ONLY for grant/registration
 * failures — never for user-cancel, state mismatch, or a port-in-use error.
 *
 * @remarks Part of the implicit→PKCE migration safety net. Remove together with
 * the fallback strategy once all public clients are PKCE-capable.
 */
export class PkceGrantUnsupportedError extends Error {
  /** The OAuth 2.0 `error` code from the authorize redirect or token response, when available. */
  readonly oauthError?: string;
  /** The OAuth stage at which the failure occurred. */
  readonly stage: 'authorize' | 'token';

  constructor(message: string, stage: 'authorize' | 'token', oauthError?: string) {
    super(message);
    this.name = 'PkceGrantUnsupportedError';
    this.stage = stage;
    this.oauthError = oauthError;
  }
}

/**
 * OAuth 2.0 `error` codes that genuinely indicate the client is not registered
 * as a PKCE-capable public client — the only failures the implicit fallback can
 * legitimately rescue. Implicit shares the same authorize endpoint and redirect
 * URI but returns the token on the redirect with NO token-endpoint call and NO
 * client authentication, so it rescues clients that support implicit but not
 * the Authorization Code grant:
 *
 * - `invalid_client` — at the token exchange, Account Manager demands client
 *   authentication (e.g. "Parameter client_assertion_type is missing"), i.e. the
 *   client is confidential/implicit-only, NOT a public/PKCE client. This is the
 *   primary real-world migration case for legacy implicit clients.
 * - `unauthorized_client` — client is not permitted to use this grant type.
 * - `unsupported_response_type` — authorize endpoint rejects `response_type=code`.
 * - `unsupported_grant_type` — token endpoint rejects `authorization_code`.
 *
 * Every other error is a real failure that would fail identically under
 * implicit and MUST NOT trigger the fallback, e.g. `invalid_scope` (bad
 * scopes), `access_denied` (user cancelled consent), `invalid_grant`
 * (expired/replayed code or PKCE verifier mismatch), `invalid_request`.
 */
const PKCE_GRANT_UNSUPPORTED_OAUTH_ERRORS = new Set([
  'invalid_client',
  'unauthorized_client',
  'unsupported_response_type',
  'unsupported_grant_type',
]);

/**
 * Returns true only when an OAuth `error` code indicates the client cannot use
 * the Authorization Code (PKCE) grant — the narrow set of failures the implicit
 * fallback should rescue. Unknown/absent codes return false so ambiguous
 * failures surface directly instead of silently downgrading to implicit.
 */
function isPkceGrantUnsupportedError(oauthError: string | undefined): boolean {
  return oauthError !== undefined && PKCE_GRANT_UNSUPPORTED_OAUTH_ERRORS.has(oauthError);
}

/**
 * Configuration for the OAuth Authorization Code + PKCE flow.
 */
export interface PkceOAuthConfig extends HttpTransportOptions {
  clientId: string;
  scopes?: string[];
  accountManagerHost?: string;
  /** Local port for the redirect server (default 8080 or SFCC_OAUTH_LOCAL_PORT). */
  localPort?: number;
  /** Override redirect URI (default `http://localhost:${localPort}` or SFCC_REDIRECT_URI). */
  redirectUri?: string;
  /** Custom browser opener. Receives the authorization URL and a handle to cancel the pending login. */
  openBrowser?: (url: string, login?: BrowserLogin) => Promise<void>;
  /**
   * Deliver the authorization redirect yourself instead of the SDK's loopback
   * server. Called with the authorize URL; resolve with the full redirect URL
   * (`<redirectUri>?code=...&state=...`) once Account Manager redirects, or
   * reject to cancel. When set, no local listener is opened and `openBrowser`
   * and `localPort` are ignored. The SDK still checks `state` and performs the
   * PKCE token exchange.
   *
   * Use this in hosts that can intercept the redirect themselves, such as an
   * Electron `BrowserWindow` watching `will-redirect`.
   */
  authorize?: (url: string, context: {redirectUri: string}) => Promise<URL | string>;
  /**
   * Whether the strategy may start an interactive sign-in. Defaults to `true`.
   *
   * When `false`, the strategy uses only the cached or stored session and its
   * refresh token. If neither yields an access token it throws
   * {@link AuthRequiredError} instead of opening a browser, so the host decides
   * when to ask the user to sign in again. Call {@link PkceOAuthStrategy.signIn}
   * to sign in explicitly.
   */
  interactive?: boolean;
  /**
   * Session store for this strategy. Defaults to the process-wide backend
   * (see `setAuthSessionBackend`), which is a JSON file in the CLI data
   * directory unless a host installs another backend.
   */
  sessionBackend?: AuthSessionBackend;
  /**
   * Persist tokens (access + refresh) to disk between CLI invocations,
   * keyed by clientId. When a refresh token is available it is used to
   * silently obtain a new access token instead of opening the browser.
   * Defaults to `true`.
   */
  persistSession?: boolean;
  /**
   * Renew a stored sign-in with its refresh token even when the access token
   * is still valid, so it gets a new expiry (used by `b2c auth login`). Falls
   * back to the browser flow when there is no refresh token or renewal fails.
   */
  forceRefresh?: boolean;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replaceAll('+', '-').replaceAll('/', '_');
}

function generatePkcePair(): {verifier: string; challenge: string} {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return {verifier, challenge};
}

function parseOAuthErrorBody(text: string): {error?: string; errorDescription?: string} {
  try {
    const parsed = JSON.parse(text) as {error?: unknown; error_description?: unknown};
    return {
      error: typeof parsed.error === 'string' ? parsed.error : undefined,
      errorDescription: typeof parsed.error_description === 'string' ? parsed.error_description : undefined,
    };
  } catch {
    return {};
  }
}

/** An authorization request built by {@link buildPkceAuthorizeRequest}. */
export interface PkceAuthorizeRequest {
  /** Account Manager authorize URL to open. */
  url: string;
  /** Opaque `state` value the redirect must echo back. */
  state: string;
  /** PKCE code verifier. Secret: keep it in memory and pass it to {@link exchangePkceAuthorizationCode}. */
  codeVerifier: string;
  /** Redirect URI sent with the request; the token exchange must use the same value. */
  redirectUri: string;
}

/** Options for {@link buildPkceAuthorizeRequest}. */
export interface PkceAuthorizeRequestOptions {
  clientId: string;
  redirectUri: string;
  accountManagerHost?: string;
  scopes?: string[];
}

/**
 * Build an Account Manager Authorization Code + PKCE request: a fresh S256
 * challenge, `state`, and the authorize URL. For hosts that drive the browser
 * step themselves; {@link PkceOAuthStrategy} uses the same helper.
 */
export function buildPkceAuthorizeRequest(options: PkceAuthorizeRequestOptions): PkceAuthorizeRequest {
  const {verifier, challenge} = generatePkcePair();
  const state = base64url(randomBytes(16));
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  if (options.scopes && options.scopes.length > 0) {
    params.set('scope', options.scopes.join(' '));
  }
  // Verifier is a secret; trace only the derived challenge and state.
  getLogger().trace({codeChallenge: challenge, codeChallengeMethod: 'S256', state}, '[Auth] Generated PKCE challenge');
  const host = options.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
  return {
    url: `https://${host}/dwsso/oauth2/authorize?${params.toString()}`,
    state,
    codeVerifier: verifier,
    redirectUri: options.redirectUri,
  };
}

/**
 * Read the authorization code from an Account Manager redirect.
 *
 * Checks that the redirect targets `request.redirectUri` and echoes
 * `request.state`, and turns an OAuth `error` parameter into an error
 * ({@link PkceGrantUnsupportedError} when the client can't use the code grant).
 *
 * @returns The authorization code
 */
export function readPkceAuthorizationResponse(
  redirect: URL | string,
  request: Pick<PkceAuthorizeRequest, 'redirectUri' | 'state'>,
): string {
  const url = typeof redirect === 'string' ? new URL(redirect) : redirect;
  const expected = new URL(request.redirectUri);
  if (url.origin !== expected.origin || url.pathname !== expected.pathname) {
    throw new Error('OAuth redirect does not match the registered redirect URI — aborting');
  }
  const error = url.searchParams.get('error');
  if (error) {
    const message = `OAuth error: ${url.searchParams.get('error_description') ?? error}`;
    throw isPkceGrantUnsupportedError(error)
      ? new PkceGrantUnsupportedError(message, 'authorize', error)
      : new Error(message);
  }
  const states = url.searchParams.getAll('state');
  if (states.length !== 1 || states[0] !== request.state) {
    throw new Error('OAuth state mismatch — aborting');
  }
  const code = url.searchParams.get('code');
  if (!code) throw new Error('OAuth redirect did not include an authorization code');
  return code;
}

/** Tokens returned by {@link exchangePkceAuthorizationCode}. */
export interface PkceTokenSet extends AccessTokenResponse {
  /** Refresh token, when the client is registered for one. Secret. */
  refreshToken?: string;
}

/** Options for {@link exchangePkceAuthorizationCode}. */
export interface PkceCodeExchangeOptions extends HttpTransportOptions {
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
  accountManagerHost?: string;
  /** Scopes to report when the response doesn't list them. */
  scopes?: string[];
}

/**
 * Exchange an authorization code and PKCE verifier for tokens at Account
 * Manager's token endpoint. Never logs the code, verifier or tokens.
 *
 * @throws PkceGrantUnsupportedError when the client can't use the code grant
 */
export async function exchangePkceAuthorizationCode(options: PkceCodeExchangeOptions): Promise<PkceTokenSet> {
  const logger = getLogger();
  const host = options.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
  const tokenUrl = `https://${host}/dwsso/oauth2/access_token`;
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code: options.code,
    redirect_uri: options.redirectUri,
    client_id: options.clientId,
    code_verifier: options.codeVerifier,
  });

  logger.debug({method: 'POST', url: tokenUrl}, '[Auth REQ] POST /dwsso/oauth2/access_token (authorization_code)');
  // Redact the single-use code and PKCE verifier from the traced body.
  logger.trace(
    {
      method: 'POST',
      url: tokenUrl,
      body: {grant_type: 'authorization_code', redirect_uri: options.redirectUri, client_id: options.clientId},
    },
    '[Auth REQ BODY] POST /dwsso/oauth2/access_token',
  );

  let tokenRes: Response;
  try {
    tokenRes = await getApiFetch(options)(tokenUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: tokenBody.toString(),
    });
  } catch (err) {
    throw wrapNetworkError(err, {operation: 'PKCE token exchange', host: new URL(tokenUrl).host});
  }
  const rawText = await tokenRes.text();
  logger.debug(
    {url: tokenUrl, status: tokenRes.status},
    `[Auth RESP] POST /dwsso/oauth2/access_token ${tokenRes.status}`,
  );
  if (!tokenRes.ok) {
    // Distinguish "this client can't do the code grant" (which the implicit
    // fallback can rescue) from real errors that would fail identically under
    // implicit — e.g. invalid_scope, invalid_grant. Only the former is typed
    // as PkceGrantUnsupportedError; everything else is a plain Error so the
    // fallback wrapper propagates it instead of silently downgrading.
    const errorBody = parseOAuthErrorBody(rawText);
    const oauthError = errorBody.error;
    logger.trace(
      {url: tokenUrl, status: tokenRes.status, body: errorBody},
      '[Auth RESP BODY] POST /dwsso/oauth2/access_token',
    );
    const detail = errorBody.errorDescription ?? errorBody.error;
    const message = `PKCE token exchange failed (${tokenRes.status})${detail ? `: ${detail}` : ''}`;
    if (isPkceGrantUnsupportedError(oauthError)) {
      throw new PkceGrantUnsupportedError(message, 'token', oauthError);
    }
    throw new Error(message);
  }

  let parsed: {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    scope?: unknown;
  };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Do not echo an untrusted response body: a malformed success response
    // can still contain live token material.
    throw new Error('PKCE token exchange returned a non-JSON response');
  }

  if (typeof parsed.access_token !== 'string' || parsed.access_token.length === 0) {
    throw new Error('PKCE token exchange response did not contain an access token');
  }

  // Never log the raw token response: it contains both the access token and
  // the long-lived refresh token, and an opaque string bypasses pino's
  // field-based redaction. JWT claims are traced below after decoding.
  logger.trace(
    {
      url: tokenUrl,
      status: tokenRes.status,
      body: {
        expires_in: parsed.expires_in,
        scope: parsed.scope,
        hasAccessToken: true,
        hasRefreshToken: typeof parsed.refresh_token === 'string' && parsed.refresh_token.length > 0,
      },
    },
    '[Auth RESP BODY] POST /dwsso/oauth2/access_token',
  );

  const expiresIn = typeof parsed.expires_in === 'number' ? parsed.expires_in : 0;
  const scopes = typeof parsed.scope === 'string' ? parsed.scope.split(' ') : (options.scopes ?? []);
  const tokens: PkceTokenSet = {
    accessToken: parsed.access_token,
    expires: new Date(Date.now() + expiresIn * 1000),
    scopes,
  };
  if (typeof parsed.refresh_token === 'string' && parsed.refresh_token.length > 0) {
    tokens.refreshToken = parsed.refresh_token;
  }
  logger.trace(
    {scopes, expires: tokens.expires, hasRefreshToken: !!tokens.refreshToken},
    '[Auth] PKCE token exchange succeeded',
  );
  try {
    logger.trace({jwt: decodeJWT(parsed.access_token).payload}, '[Auth] PKCE access token JWT payload');
  } catch {
    // access token is not a JWT; nothing to trace
  }
  return tokens;
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
  readonly authMethod = 'user' as const;
  private accountManagerHost: string;
  private localPort: number;
  private redirectUri: string;
  private persistSession: boolean;
  private _hasHadSuccess = false;
  private _refreshToken: string | null = null;
  private readonly tokenCache: Map<string, AccessTokenResponse>;
  private readonly pendingAuth: Map<string, Promise<AccessTokenResponse>>;
  private _sub = '';
  private _hydrated = false;

  constructor(private config: PkceOAuthConfig) {
    this.accountManagerHost = config.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
    this.localPort = config.localPort || parseInt(process.env.SFCC_OAUTH_LOCAL_PORT || '', 10) || DEFAULT_LOCAL_PORT;
    this.redirectUri = config.redirectUri || process.env.SFCC_REDIRECT_URI || `http://localhost:${this.localPort}`;
    this.persistSession = config.persistSession !== false;
    if (config.sessionBackend) {
      let caches = BACKEND_CACHES.get(config.sessionBackend);
      if (!caches) {
        caches = {tokens: new Map(), pending: new Map()};
        BACKEND_CACHES.set(config.sessionBackend, caches);
      }
      this.tokenCache = caches.tokens;
      this.pendingAuth = caches.pending;
    } else {
      this.tokenCache = ACCESS_TOKEN_CACHE;
      this.pendingAuth = PENDING_AUTH;
    }

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

  /** See {@link AuthStrategy.selfSignedApi}. @internal */
  get selfSignedApi(): boolean | undefined {
    return this.config.selfSignedApi;
  }

  /**
   * Load any persisted session for this clientId. Idempotent.
   */
  private hydrate(): void {
    if (!this.persistSession || this._hydrated) return;
    this._hydrated = true;
    try {
      const stored = this.findSession();
      if (!stored || stored.flow !== 'pkce') return;
      this._sub = stored.sub ?? '';
      this._refreshToken = stored.refreshToken ?? null;
      if (this.config.forceRefresh && this._refreshToken) {
        this.tokenCache.delete(this.config.clientId);
      } else if (!this.tokenCache.has(this.config.clientId) && stored.accessToken) {
        const expires = stored.expiresAt ? new Date(stored.expiresAt) : new Date(0);
        this.tokenCache.set(this.config.clientId, {
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

    let res = await dispatchFetch(url, {...init, headers});
    logger.debug({method, url, status: res.status}, '[Auth] Response');

    if (res.status !== 401) {
      this._hasHadSuccess = true;
    }

    if (res.status === 401 && this._hasHadSuccess) {
      logger.debug('[Auth] Received 401, invalidating PKCE token and retrying');
      this.invalidateToken();
      const newToken = await this.getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await dispatchFetch(url, {...init, headers});
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
    const cached = this.tokenCache.get(this.config.clientId);
    if (cached && this.isCachedTokenUsable(cached)) {
      return cached;
    }
    const tokenResponse = await this.acquire();
    this.tokenCache.set(this.config.clientId, tokenResponse);
    return tokenResponse;
  }

  /**
   * The cached access token, if it is still usable, without refreshing or
   * signing in. Returns `undefined` when a network call or sign-in would be needed.
   */
  getCachedTokenResponse(): AccessTokenResponse | undefined {
    this.hydrate();
    const cached = this.tokenCache.get(this.config.clientId);
    return cached && this.isCachedTokenUsable(cached) ? cached : undefined;
  }

  /**
   * Run the interactive sign-in now, even when `interactive` is `false` or a
   * session already exists. Use it from a host's "Sign in" action.
   */
  async signIn(): Promise<AccessTokenResponse> {
    this.tokenCache.delete(this.config.clientId);
    const tokenResponse = await this.runFlow();
    this.tokenCache.set(this.config.clientId, tokenResponse);
    return tokenResponse;
  }

  /**
   * Forget this client's session: the cached access token, the refresh token
   * and the stored session record.
   */
  signOut(): void {
    this.tokenCache.delete(this.config.clientId);
    this._refreshToken = null;
    this._sub = '';
    if (!this.persistSession) return;
    try {
      if (this.config.sessionBackend) this.config.sessionBackend.delete(this.config.clientId);
      else deleteAuthSession(this.config.clientId);
    } catch (error) {
      getLogger().debug({err: error}, '[Auth] Failed to delete PKCE session');
    }
  }

  /** Refresh silently if possible; otherwise sign in, or fail with {@link AuthRequiredError} when not interactive. */
  private async acquire(): Promise<AccessTokenResponse> {
    if (this.config.sessionBackend && this.persistSession) {
      // The backend is the source of truth: another instance may have signed out or rotated
      // the refresh token since this one hydrated.
      const stored = this.findSession();
      this._refreshToken = stored?.flow === 'pkce' ? (stored.refreshToken ?? null) : null;
    }
    const hadRefreshToken = this._refreshToken !== null;
    if (this._refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return refreshed;
    }
    if (this.config.interactive === false) {
      throw new AuthRequiredError({
        clientId: this.config.clientId,
        accountManagerHost: this.accountManagerHost,
        reason: hadRefreshToken ? 'refresh-failed' : 'no-session',
      });
    }
    return this.runFlow();
  }

  private findSession(): AuthSession | null {
    return this.config.sessionBackend
      ? this.config.sessionBackend.find(this.config.clientId)
      : findAuthSession(this.config.clientId);
  }

  invalidateToken(): void {
    // Only drop the cached access token. The refresh token is preserved so the
    // next getAccessToken() can silently mint a new access token via
    // tryRefresh() instead of re-opening the browser. tryRefresh() forgets the
    // refresh token on its own when the exchange genuinely fails (revoked /
    // expired), which is the only case where we fall back to the browser flow.
    this.tokenCache.delete(this.config.clientId);
  }

  private isCachedTokenUsable(cached: AccessTokenResponse): boolean {
    const requiredScopes = this.config.scopes || [];
    const hasAllScopes = requiredScopes.every((scope) => cached.scopes.includes(scope));
    return hasAllScopes && Date.now() <= cached.expires.getTime();
  }

  private async getAccessToken(): Promise<string> {
    this.hydrate();
    const clientId = this.config.clientId;
    const cached = this.tokenCache.get(clientId);
    if (cached && this.isCachedTokenUsable(cached)) {
      return cached.accessToken;
    }
    if (cached) {
      this.tokenCache.delete(clientId);
    }

    const pending = this.pendingAuth.get(clientId);
    if (pending) {
      const tokenResponse = await pending;
      return tokenResponse.accessToken;
    }

    const authPromise = this.acquire();
    this.pendingAuth.set(clientId, authPromise);
    try {
      const tokenResponse = await authPromise;
      this.tokenCache.set(clientId, tokenResponse);
      return tokenResponse.accessToken;
    } finally {
      this.pendingAuth.delete(clientId);
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

    logger.debug({method: 'POST', url: tokenUrl}, '[Auth REQ] POST /dwsso/oauth2/access_token (refresh_token)');
    // refresh_token is a secret; trace only the non-sensitive parameters.
    logger.trace(
      {
        method: 'POST',
        url: tokenUrl,
        body: {grant_type: 'refresh_token', client_id: this.config.clientId, scope: this.config.scopes?.join(' ')},
      },
      '[Auth REQ BODY] POST /dwsso/oauth2/access_token (refresh_token)',
    );

    let response: Response;
    try {
      response = await getApiFetch(this.config)(tokenUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: body.toString(),
      });
    } catch (error) {
      logger.debug({err: error}, '[Auth] PKCE refresh request failed');
      this._refreshToken = null;
      return null;
    }

    logger.debug(
      {url: tokenUrl, status: response.status},
      `[Auth RESP] POST /dwsso/oauth2/access_token ${response.status}`,
    );
    if (!response.ok) {
      const text = await response.text();
      const oauthError = parseOAuthErrorBody(text);
      logger.trace(
        {url: tokenUrl, status: response.status, body: oauthError},
        '[Auth RESP BODY] POST /dwsso/oauth2/access_token (refresh_token)',
      );
      logger.debug(
        {status: response.status, oauthError: oauthError.error},
        '[Auth] PKCE refresh failed; falling back to browser flow',
      );
      this._refreshToken = null;
      return null;
    }

    let parsed: {
      access_token?: unknown;
      refresh_token?: unknown;
      expires_in?: unknown;
      scope?: unknown;
    };
    try {
      parsed = (await response.json()) as typeof parsed;
    } catch (error) {
      logger.debug({err: error}, '[Auth] PKCE refresh returned non-JSON response');
      this._refreshToken = null;
      return null;
    }

    if (typeof parsed.access_token !== 'string' || parsed.access_token.length === 0) {
      logger.debug('[Auth] PKCE refresh response did not contain an access token');
      this._refreshToken = null;
      return null;
    }

    const expiresIn = typeof parsed.expires_in === 'number' ? parsed.expires_in : 0;
    const expires = new Date(Date.now() + expiresIn * 1000);
    const scopes = typeof parsed.scope === 'string' ? parsed.scope.split(' ') : (this.config.scopes ?? []);
    const tokenResponse: AccessTokenResponse = {
      accessToken: parsed.access_token,
      expires,
      scopes,
    };
    if (typeof parsed.refresh_token === 'string' && parsed.refresh_token.length > 0) {
      this._refreshToken = parsed.refresh_token;
    }
    try {
      logger.trace({jwt: decodeJWT(parsed.access_token).payload}, '[Auth] Refreshed PKCE access token JWT payload');
    } catch {
      // access token is not a JWT; nothing to trace
    }
    this.persistTokens(tokenResponse);
    logger.debug({clientId: this.config.clientId}, '[Auth] PKCE token refreshed silently');
    if (this.config.forceRefresh) {
      logger.info(
        describeSignIn({
          action: 'renewed',
          clientId: this.config.clientId,
          accountManagerHost: this.accountManagerHost,
          user: this._sub,
          expiresAt: tokenResponse.expires,
          refreshToken: this._refreshToken,
        }),
      );
    }
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
      if (this.config.sessionBackend) this.config.sessionBackend.save(record);
      else saveAuthSession(record);
    } catch (error) {
      getLogger().debug({err: error}, '[Auth] Failed to persist PKCE session');
    }
  }

  private async runFlow(): Promise<AccessTokenResponse> {
    const logger = getLogger();
    logger.trace(
      {clientId: this.config.clientId, scopes: this.config.scopes, redirectUri: this.redirectUri},
      '[Auth] Starting Authorization Code + PKCE flow',
    );
    const request = buildPkceAuthorizeRequest({
      clientId: this.config.clientId,
      redirectUri: this.redirectUri,
      accountManagerHost: this.accountManagerHost,
      scopes: this.config.scopes,
    });

    let code: string;
    if (this.config.authorize) {
      logger.debug('[Auth] Delivering the authorization redirect through the host authorize hook');
      const redirect = await this.config.authorize(request.url, {redirectUri: this.redirectUri});
      code = readPkceAuthorizationResponse(redirect, request);
    } else {
      logger.info({url: request.url}, `Login URL: ${request.url}`);
      logger.info('If the URL does not open automatically, copy/paste it into a browser on this machine.');
      code = await this.waitForAuthCode(request.state, async (login) => {
        if (this.config.openBrowser) {
          await this.config.openBrowser(request.url, login);
        } else {
          await openUrlInBrowser(request.url);
        }
      });
    }
    logger.debug('[Auth] Got authorization code, exchanging for token');

    const tokens = await exchangePkceAuthorizationCode({
      ...this.config,
      accountManagerHost: this.accountManagerHost,
      redirectUri: this.redirectUri,
      code,
      codeVerifier: request.codeVerifier,
    });
    const tokenResponse: AccessTokenResponse = {
      accessToken: tokens.accessToken,
      expires: tokens.expires,
      scopes: tokens.scopes,
    };
    if (tokens.refreshToken) {
      this._refreshToken = tokens.refreshToken;
    }
    this.persistTokens(tokenResponse);
    logger.info(
      describeSignIn({
        clientId: this.config.clientId,
        accountManagerHost: this.accountManagerHost,
        user: this._sub,
        expiresAt: tokenResponse.expires,
        refreshToken: this._refreshToken,
      }),
    );

    return tokenResponse;
  }

  private waitForAuthCode(expectedState: string, openBrowser: (login: BrowserLogin) => Promise<void>): Promise<string> {
    const logger = getLogger();
    return new Promise<string>((resolve, reject) => {
      const sockets: Set<Socket> = new Set();
      let settled = false;
      const settleAfterClose = (settle: () => void) => {
        if (settled) return;
        settled = true;
        const forceCloseTimer = setTimeout(() => {
          for (const socket of sockets) socket.destroy();
        }, 100);
        server.close(() => {
          clearTimeout(forceCloseTimer);
          for (const socket of sockets) socket.destroy();
          settle();
        });
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
          // Only a grant/registration error (e.g. unsupported_response_type,
          // unauthorized_client) means the client can't do the code grant — the
          // implicit fallback can rescue that. A user-driven error like
          // access_denied (cancelled consent) MUST NOT fall back, so type it
          // only for the grant-unsupported set; otherwise reject plainly.
          const message = `OAuth error: ${errorDescription ?? error}`;
          const authError = isPkceGrantUnsupportedError(error)
            ? new PkceGrantUnsupportedError(message, 'authorize', error)
            : new Error(message);
          settleAfterClose(() => reject(authError));
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
          settleAfterClose(() => reject(new Error('OAuth state mismatch — aborting')));
          return;
        }

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Authorization received. Completing authentication in the application...');
        settleAfterClose(() => resolve(code));
      });

      server.on('connection', (socket) => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
      });

      server.listen(this.localPort, async () => {
        logger.debug({port: this.localPort}, `[Auth] PKCE redirect server listening on port ${this.localPort}`);
        logger.info('Waiting for user to authenticate...');
        try {
          await openBrowser({
            cancel: (reason = 'Login cancelled') => settleAfterClose(() => reject(new Error(reason))),
          });
        } catch (error) {
          const browserError = error instanceof Error ? error : new Error(String(error));
          settleAfterClose(() => reject(browserError));
        }
      });

      server.on('error', (err) => {
        const hint =
          'code' in err && (err as NodeJS.ErrnoException).code === 'EADDRINUSE'
            ? ` Port ${this.localPort} is in use; set SFCC_OAUTH_LOCAL_PORT or pass localPort to use a different port.`
            : '';
        if (!settled) {
          settled = true;
          reject(new Error(`Failed to start OAuth redirect server: ${err.message}.${hint}`));
        }
      });
    });
  }
}
