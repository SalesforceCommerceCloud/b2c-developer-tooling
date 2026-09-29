/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {toOrganizationId} from '../clients/custom-apis.js';
import type {MiddlewareRegistry} from '../clients/middleware-registry.js';
import {getGuestToken, refreshShopperToken} from '../slas/token.js';
import type {SlasTokenConfig, SlasTokenResponse} from '../slas/types.js';

export interface ScapiShopperConfig {
  shortCode: string;
  tenantId: string;
  slasClientId?: string;
  slasClientSecret?: string;
  /** Redirect URI registered on a public SLAS client. Defaults to http://localhost:3000/callback. */
  redirectUri?: string;
  middlewareRegistry?: MiddlewareRegistry;
}

/** Host-held shopper access; the token never reaches executed code. */
export interface ScapiShopperAuth {
  /** Bearer token for a guest shopper on the site. */
  getAccessToken(siteId: string, signal: AbortSignal): Promise<string>;
  /** Drop a rejected token so the next request starts a new session. */
  invalidate(siteId: string): void;
}

interface Session {
  token: SlasTokenResponse;
  expiresAt: number;
}

/** Refresh this long before expiry so a request does not race the token's lifetime. */
const EXPIRY_MARGIN_MS = 60_000;

/**
 * Guest shopper sessions per tenant, SLAS client, and site. A session outlives
 * individual executions so baskets and other shopper state carry across them;
 * expired tokens are refreshed, keeping the same shopper.
 */
export class ScapiShopperSessions {
  private readonly pending = new Map<string, Promise<Session>>();
  private readonly sessions = new Map<string, Session>();

  /** Shopper auth bound to one configuration. */
  for(config: ScapiShopperConfig): ScapiShopperAuth {
    return {
      getAccessToken: async (siteId, signal) => (await this.session(config, siteId, signal)).token.access_token,
      invalidate: (siteId) => {
        if (config.slasClientId) this.sessions.delete(sessionKey(config, siteId));
      },
    };
  }

  /** Forget all sessions; subsequent requests start as new guests. */
  reset(): void {
    this.sessions.clear();
    this.pending.clear();
  }

  private async session(config: ScapiShopperConfig, siteId: string, signal: AbortSignal): Promise<Session> {
    if (!config.slasClientId)
      throw new Error(
        'SCAPI_SHOPPER_CONFIG_MISSING: Shopper APIs require slasClientId (and slasClientSecret for private clients). Use config_inspect; Storefront Next projects provide these through .env.',
      );
    const key = sessionKey(config, siteId);
    const current = this.sessions.get(key);
    if (current && current.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return current;
    let pending = this.pending.get(key);
    if (!pending) {
      const tokenConfig: SlasTokenConfig = {
        shortCode: config.shortCode,
        organizationId: toOrganizationId(config.tenantId),
        slasClientId: config.slasClientId,
        slasClientSecret: config.slasClientSecret,
        siteId,
        redirectUri: config.redirectUri ?? 'http://localhost:3000/callback',
        middlewareRegistry: config.middlewareRegistry,
      };
      pending = (async () => {
        let token: SlasTokenResponse | undefined;
        if (current?.token.refresh_token)
          token = await refreshShopperToken(tokenConfig, current.token.refresh_token).catch(() => undefined);
        token ??= await getGuestToken(tokenConfig);
        const session = {token, expiresAt: Date.now() + token.expires_in * 1000};
        this.sessions.set(key, session);
        return session;
      })().finally(() => this.pending.delete(key));
      this.pending.set(key, pending);
    }
    // A shared token request is not tied to the first caller's signal.
    return await abortable(pending, signal);
  }
}

function sessionKey(config: ScapiShopperConfig, siteId: string): string {
  return [config.shortCode, toOrganizationId(config.tenantId), config.slasClientId, siteId]
    .map((part) => String(part).toLowerCase())
    .join('/');
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, {once: true});
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}
