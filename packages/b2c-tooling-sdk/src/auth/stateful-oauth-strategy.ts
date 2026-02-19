/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * OAuth strategy that uses stateful (persisted) tokens from the same store as sfcc-ci.
 * Uses stateful auth only when present and valid; on 401 attempts refresh when renew
 * credentials or refresh_token are stored.
 *
 * @module auth/stateful-oauth-strategy
 */
import type {AuthStrategy, AccessTokenResponse, DecodedJWT, FetchInit} from './types.js';
import {getLogger} from '../logging/logger.js';
import {decodeJWT} from './oauth.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {getStoredSession, setStoredSession, clearStoredSession, type StatefulSession} from './stateful-store.js';
import {globalAuthMiddlewareRegistry, applyAuthRequestMiddleware, applyAuthResponseMiddleware} from './middleware.js';

export interface StatefulOAuthStrategyOptions {
  accountManagerHost: string;
  scopes?: string[];
}

/**
 * Auth strategy that uses the stateful store (sfcc-ci compatible).
 * On 401, attempts to refresh using stored refresh_token or client_credentials (renew base);
 * on refresh failure clears the stored session.
 */
export class StatefulOAuthStrategy implements AuthStrategy {
  private accountManagerHost: string;
  private scopes: string[];
  private _session: StatefulSession;
  private _hasHadSuccess = false;

  constructor(session: StatefulSession, options: StatefulOAuthStrategyOptions) {
    this._session = session;
    this.accountManagerHost = options.accountManagerHost || DEFAULT_ACCOUNT_MANAGER_HOST;
    this.scopes = options.scopes ?? [];
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const logger = getLogger();
    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this._session.clientId);

    let res = await fetch(url, {...init, headers} as RequestInit);

    if (res.status !== 401) {
      this._hasHadSuccess = true;
    }

    if (res.status === 401 && this._hasHadSuccess) {
      logger.debug('[StatefulAuth] 401 received, attempting refresh');
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const newToken = await this.getAccessToken();
        headers.set('Authorization', `Bearer ${newToken}`);
        res = await fetch(url, {...init, headers} as RequestInit);
      }
    }

    return res;
  }

  async getAuthorizationHeader(): Promise<string> {
    const token = await this.getAccessToken();
    return `Bearer ${token}`;
  }

  /**
   * Returns the current token as AccessTokenResponse (expires/scopes from JWT).
   */
  async getTokenResponse(): Promise<AccessTokenResponse> {
    const token = await this.getAccessToken();
    const decoded = decodeJWT(token);
    const exp = (decoded.payload.exp as number) ?? 0;
    const scope = decoded.payload.scope as string | string[] | undefined;
    const scopes = scope == null ? [] : Array.isArray(scope) ? scope : scope.split(' ');
    return {
      accessToken: token,
      expires: new Date(exp * 1000),
      scopes,
    };
  }

  async getJWT(): Promise<DecodedJWT> {
    const token = await this.getAccessToken();
    return decodeJWT(token);
  }

  invalidateToken(): void {
    clearStoredSession();
    this._session = {...this._session, accessToken: ''};
  }

  private async getAccessToken(): Promise<string> {
    const session = getStoredSession();
    if (session?.accessToken) {
      this._session = session;
      return session.accessToken;
    }
    throw new Error('Stateful session lost; please run auth:login or configure client credentials.');
  }

  /**
   * Attempts to refresh the access token using stored refresh_token or client_credentials (renew base).
   * Requires SFCC_CLIENT_RENEW_BASE (client:secret) for both flows; updates store on success.
   */
  private async tryRefresh(): Promise<boolean> {
    const logger = getLogger();
    const session = getStoredSession();
    if (!session?.renewBase) {
      logger.debug('[StatefulAuth] No renew credentials (SFCC_CLIENT_RENEW_BASE); cannot refresh');
      clearStoredSession();
      return false;
    }

    const url = `https://${this.accountManagerHost}/dwsso/oauth2/access_token`;
    const grantPayload: Record<string, string> =
      session.refreshToken != null && session.refreshToken !== ''
        ? {grant_type: 'refresh_token', refresh_token: session.refreshToken}
        : {grant_type: 'client_credentials'};
    if (this.scopes.length > 0) {
      grantPayload.scope = this.scopes.join(' ');
    }

    const body = new URLSearchParams(grantPayload).toString();
    let request = new Request(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${session.renewBase}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const middleware = globalAuthMiddlewareRegistry.getMiddleware();
    request = await applyAuthRequestMiddleware(request, middleware);

    let response: Response;
    try {
      response = await fetch(request);
      response = await applyAuthResponseMiddleware(request, response, middleware);
    } catch (err) {
      logger.debug({err}, '[StatefulAuth] Refresh request failed');
      clearStoredSession();
      return false;
    }

    if (!response.ok) {
      const text = await response.text();
      logger.debug({status: response.status, body: text}, '[StatefulAuth] Refresh failed');
      clearStoredSession();
      return false;
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      scope?: string;
      refresh_token?: string;
    };

    setStoredSession({
      clientId: session.clientId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? session.refreshToken ?? null,
      renewBase: session.renewBase ?? null,
      user: session.user ?? null,
    });
    this._session = getStoredSession()!;
    logger.debug('[StatefulAuth] Token refreshed successfully');
    return true;
  }
}
