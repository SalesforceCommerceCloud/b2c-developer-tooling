/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {
  ImplicitOAuthStrategy,
  PkceOAuthStrategy,
  PkceWithImplicitFallbackStrategy,
  PkceGrantUnsupportedError,
  createUserAuthStrategy,
  isPkceFallbackDisabled,
} from '@salesforce/b2c-tooling-sdk/auth';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

/**
 * Build a fake AuthStrategy that records how many times each method is called
 * and returns canned values, so tests can assert the wrapper delegated to the
 * implicit fallback without opening a browser.
 */
function fakeStrategy(label: string) {
  const calls = {fetch: 0, getAuthorizationHeader: 0, getJWT: 0, getTokenResponse: 0, invalidateToken: 0};
  const strategy: AuthStrategy = {
    async fetch() {
      calls.fetch++;
      return new Response(label, {status: 200});
    },
    async getAuthorizationHeader() {
      calls.getAuthorizationHeader++;
      return `Bearer ${label}`;
    },
    async getJWT() {
      calls.getJWT++;
      return {header: {}, payload: {sub: label}, signature: ''} as any;
    },
    async getTokenResponse() {
      calls.getTokenResponse++;
      return {accessToken: label, expires: new Date(Date.now() + 60_000), scopes: []};
    },
    invalidateToken() {
      calls.invalidateToken++;
    },
  };
  return {strategy, calls};
}

/**
 * Replace the wrapper's internal PKCE strategy method with one that throws the
 * given error, and its lazily-built implicit fallback with a controllable fake.
 */
function instrument(
  wrapper: PkceWithImplicitFallbackStrategy,
  pkceError: Error | null,
  implicitFake = fakeStrategy('implicit'),
) {
  const internal = wrapper as unknown as {
    pkce: AuthStrategy;
    implicit: AuthStrategy | null;
  };
  const pkceCalls = {fetch: 0, getAuthorizationHeader: 0, getJWT: 0, getTokenResponse: 0};
  const throwOrReturn = async <T>(value: T): Promise<T> => {
    if (pkceError) throw pkceError;
    return value;
  };
  internal.pkce.fetch = async () => {
    pkceCalls.fetch++;
    return throwOrReturn(new Response('pkce', {status: 200}));
  };
  internal.pkce.getAuthorizationHeader = async () => {
    pkceCalls.getAuthorizationHeader++;
    return throwOrReturn('Bearer pkce');
  };
  internal.pkce.getJWT = async () => {
    pkceCalls.getJWT++;
    return throwOrReturn({header: {}, payload: {sub: 'pkce'}, signature: ''} as any);
  };
  internal.pkce.getTokenResponse = async () => {
    pkceCalls.getTokenResponse++;
    return throwOrReturn({accessToken: 'pkce', expires: new Date(Date.now() + 60_000), scopes: []});
  };
  // Pre-seed the lazily-built implicit strategy so both fetch() fallback and
  // invalidateToken() (which reads the private field) use the same fake.
  internal.implicit = implicitFake.strategy;
  return {pkceCalls, implicitCalls: implicitFake.calls};
}

const GRANT_ERROR = new PkceGrantUnsupportedError('unsupported', 'token', 'unauthorized_client');

describe('auth/oauth-pkce-fallback', () => {
  const originalEnv = process.env.SFCC_DISABLE_PKCE_FALLBACK;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SFCC_DISABLE_PKCE_FALLBACK;
    } else {
      process.env.SFCC_DISABLE_PKCE_FALLBACK = originalEnv;
    }
  });

  describe('isPkceFallbackDisabled', () => {
    it('is enabled (returns false) when the env var is unset', () => {
      delete process.env.SFCC_DISABLE_PKCE_FALLBACK;
      expect(isPkceFallbackDisabled()).to.be.false;
    });

    it('treats empty, "0", and "false" as not disabled', () => {
      for (const value of ['', '0', 'false', 'FALSE', 'False']) {
        process.env.SFCC_DISABLE_PKCE_FALLBACK = value;
        expect(isPkceFallbackDisabled(), `value=${JSON.stringify(value)}`).to.be.false;
      }
    });

    it('treats any other non-empty value as disabled', () => {
      for (const value of ['1', 'true', 'yes', 'on']) {
        process.env.SFCC_DISABLE_PKCE_FALLBACK = value;
        expect(isPkceFallbackDisabled(), `value=${JSON.stringify(value)}`).to.be.true;
      }
    });
  });

  describe('createUserAuthStrategy', () => {
    it('returns the fallback wrapper when the fallback is enabled', () => {
      delete process.env.SFCC_DISABLE_PKCE_FALLBACK;
      const strategy = createUserAuthStrategy({clientId: 'c'});
      expect(strategy).to.be.instanceOf(PkceWithImplicitFallbackStrategy);
    });

    it('returns a plain PkceOAuthStrategy when the fallback is disabled', () => {
      process.env.SFCC_DISABLE_PKCE_FALLBACK = '1';
      const strategy = createUserAuthStrategy({clientId: 'c'});
      expect(strategy).to.be.instanceOf(PkceOAuthStrategy);
      expect(strategy).to.not.be.instanceOf(PkceWithImplicitFallbackStrategy);
    });
  });

  describe('PkceWithImplicitFallbackStrategy', () => {
    it('uses PKCE and never touches implicit when PKCE succeeds', async () => {
      const wrapper = new PkceWithImplicitFallbackStrategy({clientId: 'c', scopes: ['a']});
      const {pkceCalls, implicitCalls} = instrument(wrapper, null);

      const res = await wrapper.fetch('https://example.com');
      expect(res.status).to.equal(200);
      expect(pkceCalls.fetch).to.equal(1);
      expect(implicitCalls.fetch).to.equal(0);
    });

    it('falls back to implicit on a PkceGrantUnsupportedError', async () => {
      const wrapper = new PkceWithImplicitFallbackStrategy({clientId: 'c', scopes: ['a']});
      const {pkceCalls, implicitCalls} = instrument(wrapper, GRANT_ERROR);

      const res = await wrapper.fetch('https://example.com');
      expect(res.status).to.equal(200);
      expect(pkceCalls.fetch).to.equal(1);
      expect(implicitCalls.fetch).to.equal(1);
    });

    it('sticks with implicit after the first fallback (no repeated PKCE attempts)', async () => {
      const wrapper = new PkceWithImplicitFallbackStrategy({clientId: 'c', scopes: ['a']});
      const {pkceCalls, implicitCalls} = instrument(wrapper, GRANT_ERROR);

      await wrapper.fetch('https://example.com');
      await wrapper.fetch('https://example.com');
      await wrapper.getAuthorizationHeader();

      // PKCE attempted exactly once (the first fetch); everything else went to implicit.
      expect(pkceCalls.fetch).to.equal(1);
      expect(implicitCalls.fetch).to.equal(2);
      expect(implicitCalls.getAuthorizationHeader).to.equal(1);
      expect(pkceCalls.getAuthorizationHeader).to.equal(0);
    });

    it('propagates non-grant errors without falling back', async () => {
      const wrapper = new PkceWithImplicitFallbackStrategy({clientId: 'c', scopes: ['a']});
      const boom = new Error('network down');
      const {pkceCalls, implicitCalls} = instrument(wrapper, boom);

      let thrown: unknown;
      try {
        await wrapper.fetch('https://example.com');
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.equal(boom);
      expect(pkceCalls.fetch).to.equal(1);
      expect(implicitCalls.fetch).to.equal(0);
    });

    it('falls back across all delegated methods', async () => {
      const wrapper = new PkceWithImplicitFallbackStrategy({clientId: 'c', scopes: ['a']});
      const {implicitCalls} = instrument(wrapper, GRANT_ERROR);

      const header = await wrapper.getAuthorizationHeader();
      expect(header).to.equal('Bearer implicit');
      expect(implicitCalls.getAuthorizationHeader).to.equal(1);

      const jwt = await wrapper.getJWT();
      expect(jwt.payload.sub).to.equal('implicit');

      const token = await wrapper.getTokenResponse();
      expect(token.accessToken).to.equal('implicit');
    });

    it('invalidateToken clears both the PKCE and (built) implicit caches', async () => {
      const wrapper = new PkceWithImplicitFallbackStrategy({clientId: 'c', scopes: ['a']});
      const implicitFake = fakeStrategy('implicit');
      instrument(wrapper, GRANT_ERROR, implicitFake);

      // Trigger the fallback so the implicit strategy is built.
      await wrapper.fetch('https://example.com');
      wrapper.invalidateToken();

      expect(implicitFake.calls.invalidateToken).to.equal(1);
    });

    it('builds a real ImplicitOAuthStrategy from the PKCE config when falling back', async () => {
      const wrapper = new PkceWithImplicitFallbackStrategy({clientId: 'c', scopes: ['a']});
      // Only stub the PKCE side so the real getImplicit() runs.
      const internal = wrapper as unknown as {pkce: AuthStrategy};
      internal.pkce.fetch = async () => {
        throw GRANT_ERROR;
      };
      const built = (wrapper as unknown as {getImplicit: () => AuthStrategy}).getImplicit();
      expect(built).to.be.instanceOf(ImplicitOAuthStrategy);
    });
  });

  describe('PkceGrantUnsupportedError', () => {
    it('carries the stage and oauthError and has a stable name', () => {
      const err = new PkceGrantUnsupportedError('msg', 'authorize', 'unsupported_response_type');
      expect(err).to.be.instanceOf(Error);
      expect(err.name).to.equal('PkceGrantUnsupportedError');
      expect(err.stage).to.equal('authorize');
      expect(err.oauthError).to.equal('unsupported_response_type');
      expect(err.message).to.equal('msg');
    });
  });
});
