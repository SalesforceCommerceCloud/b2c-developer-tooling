/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Transitional auth strategy that prefers Authorization Code + PKCE but
 * automatically falls back to the deprecated implicit flow when the configured
 * Account Manager client is not (yet) registered for the PKCE grant.
 *
 * ## Why this exists
 *
 * Switching the default browser-based flow from implicit to PKCE requires every
 * public client in Account Manager to be re-registered as a PKCE-capable
 * "public client". Until that migration is complete, a user whose client is
 * still implicit-only would hit a hard failure on the first request. This
 * wrapper catches that specific failure ({@link PkceGrantUnsupportedError}),
 * logs a deprecation WARN, and transparently retries with the implicit flow so
 * those users keep working.
 *
 * ## Scope of the fallback
 *
 * The implicit flow uses the SAME authorize endpoint and redirect URI as PKCE,
 * so this only rescues clients that are implicit-enabled but not PKCE-enabled.
 * A client missing the redirect URI entirely fails under both flows — those
 * users must fix their Account Manager registration.
 *
 * ## Removal
 *
 * This is a temporary migration aid. Once all public clients are PKCE-capable,
 * delete this file, stop constructing it from {@link resolveAuthStrategy} /
 * `getOAuthStrategy()`, and drop {@link PkceGrantUnsupportedError}. The
 * {@link SFCC_DISABLE_PKCE_FALLBACK} env var can disable it in the meantime.
 *
 * @module auth/oauth-pkce-fallback
 */
import type {UserAuthStrategy, AccessTokenResponse, DecodedJWT, FetchInit} from './types.js';
import {getLogger} from '../logging/logger.js';
import {PkceOAuthStrategy, PkceGrantUnsupportedError, type PkceOAuthConfig} from './oauth-pkce.js';
import {ImplicitOAuthStrategy, type ImplicitOAuthConfig} from './oauth-implicit.js';

/**
 * Returns true when the automatic PKCE→implicit fallback is disabled via the
 * `SFCC_DISABLE_PKCE_FALLBACK` environment variable (any non-empty value).
 */
export function isPkceFallbackDisabled(): boolean {
  const value = process.env.SFCC_DISABLE_PKCE_FALLBACK;
  return value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false';
}

/**
 * Wraps a {@link PkceOAuthStrategy} and, on a {@link PkceGrantUnsupportedError},
 * falls back to an {@link ImplicitOAuthStrategy} for the same client. The
 * fallback is attempted at most once and then sticks for the lifetime of this
 * instance, so subsequent calls go straight to implicit without re-attempting
 * the failing PKCE flow.
 */
export class PkceWithImplicitFallbackStrategy implements UserAuthStrategy {
  private readonly pkce: PkceOAuthStrategy;
  private implicit: ImplicitOAuthStrategy | null = null;
  /** Once PKCE has failed with a grant error, route everything to implicit. */
  private useImplicit = false;

  constructor(private readonly config: PkceOAuthConfig) {
    this.pkce = new PkceOAuthStrategy(config);
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    if (this.useImplicit) {
      return this.getImplicit().fetch(url, init);
    }
    try {
      return await this.pkce.fetch(url, init);
    } catch (error) {
      if (error instanceof PkceGrantUnsupportedError) {
        this.warnAndSwitch(error);
        return this.getImplicit().fetch(url, init);
      }
      throw error;
    }
  }

  async getAuthorizationHeader(): Promise<string> {
    if (this.useImplicit) {
      return this.getImplicit().getAuthorizationHeader();
    }
    try {
      return await this.pkce.getAuthorizationHeader();
    } catch (error) {
      if (error instanceof PkceGrantUnsupportedError) {
        this.warnAndSwitch(error);
        return this.getImplicit().getAuthorizationHeader();
      }
      throw error;
    }
  }

  async getJWT(): Promise<DecodedJWT> {
    if (this.useImplicit) {
      return this.getImplicit().getJWT();
    }
    try {
      return await this.pkce.getJWT();
    } catch (error) {
      if (error instanceof PkceGrantUnsupportedError) {
        this.warnAndSwitch(error);
        return this.getImplicit().getJWT();
      }
      throw error;
    }
  }

  async getTokenResponse(): Promise<AccessTokenResponse> {
    if (this.useImplicit) {
      return this.getImplicit().getTokenResponse();
    }
    try {
      return await this.pkce.getTokenResponse();
    } catch (error) {
      if (error instanceof PkceGrantUnsupportedError) {
        this.warnAndSwitch(error);
        return this.getImplicit().getTokenResponse();
      }
      throw error;
    }
  }

  invalidateToken(): void {
    this.pkce.invalidateToken();
    this.implicit?.invalidateToken();
  }

  private warnAndSwitch(error: PkceGrantUnsupportedError): void {
    this.useImplicit = true;
    getLogger().warn(
      {clientId: this.config.clientId, stage: error.stage, oauthError: error.oauthError},
      `[Auth] Authorization Code + PKCE failed for client ${this.config.clientId} ` +
        `(${error.oauthError ?? error.message}). Falling back to the deprecated implicit flow. ` +
        'Re-register this client as a public (PKCE) client in Account Manager to remove this warning.',
    );
  }

  private getImplicit(): ImplicitOAuthStrategy {
    if (!this.implicit) {
      const implicitConfig: ImplicitOAuthConfig = {
        clientId: this.config.clientId,
        scopes: this.config.scopes,
        accountManagerHost: this.config.accountManagerHost,
        localPort: this.config.localPort,
        redirectUri: this.config.redirectUri,
        openBrowser: this.config.openBrowser,
        persistSession: this.config.persistSession,
      };
      this.implicit = new ImplicitOAuthStrategy(implicitConfig);
    }
    return this.implicit;
  }
}

/**
 * Builds the browser-based "user" auth strategy. Returns a plain
 * {@link PkceOAuthStrategy} when the fallback is disabled
 * (`SFCC_DISABLE_PKCE_FALLBACK`), otherwise a
 * {@link PkceWithImplicitFallbackStrategy}.
 */
export function createUserAuthStrategy(config: PkceOAuthConfig): UserAuthStrategy {
  if (isPkceFallbackDisabled()) {
    return new PkceOAuthStrategy(config);
  }
  return new PkceWithImplicitFallbackStrategy(config);
}
