/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * OAuth strategy backed by a persisted session in the unified auth-session
 * store. Used for sessions minted by:
 *
 * - `auth client` — non-interactive client_credentials. NO refresh: when the
 *   stored access token expires, the user must re-run `auth client <id> <secret>`.
 *   Client secrets are never persisted.
 * - `auth login` (PKCE) and the implicit flow also write here, but those
 *   strategies own their refresh logic. This strategy is only constructed
 *   when `oauth-command.ts` decides to use a stored session directly without
 *   instantiating a flow-specific strategy (e.g. when commands run after
 *   `auth client`).
 *
 * On 401, this strategy clears the session and fails — the caller must
 * re-authenticate (re-run `auth client <id> <secret>` or `auth login`).
 *
 * @module auth/stateful-oauth-strategy
 */
import type {AuthStrategy, AccessTokenResponse, DecodedJWT, FetchInit} from './types.js';
import {getLogger} from '../logging/logger.js';
import {decodeJWT} from './oauth.js';
import {decodeJwtTokenInfo} from './jwt-utils.js';
import {findAuthSession, deleteAuthSession, type AuthSession} from './session-store.js';

export interface StatefulOAuthStrategyOptions {
  accountManagerHost: string;
  scopes?: string[];
}

/**
 * Auth strategy that uses a persisted access token from the unified store.
 * No refresh — on expiry/401, the session is cleared and the caller is
 * expected to re-authenticate.
 */
export class StatefulOAuthStrategy implements AuthStrategy {
  private _session: AuthSession;

  constructor(session: AuthSession, _options: StatefulOAuthStrategyOptions) {
    this._session = session;
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const logger = getLogger();
    const token = this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-dw-client-id', this._session.clientId);

    const res = await fetch(url, {...init, headers} as RequestInit);
    if (res.status === 401) {
      logger.debug('[StatefulAuth] 401 received; clearing stored session — caller must re-authenticate');
      this.invalidateToken();
    }
    return res;
  }

  async getAuthorizationHeader(): Promise<string> {
    return `Bearer ${this.getAccessToken()}`;
  }

  /**
   * Returns the current token as AccessTokenResponse (expires/scopes from JWT).
   */
  async getTokenResponse(): Promise<AccessTokenResponse> {
    const token = this.getAccessToken();
    const {expires, scopes} = decodeJwtTokenInfo(token);
    return {accessToken: token, expires, scopes};
  }

  async getJWT(): Promise<DecodedJWT> {
    return decodeJWT(this.getAccessToken());
  }

  invalidateToken(): void {
    deleteAuthSession(this._session.clientId);
    this._session = {...this._session, accessToken: ''};
  }

  private getAccessToken(): string {
    const session = findAuthSession(this._session.clientId);
    if (session?.accessToken) {
      this._session = session;
      return session.accessToken;
    }
    throw new Error('Stored session has no access token; please re-authenticate.');
  }
}
