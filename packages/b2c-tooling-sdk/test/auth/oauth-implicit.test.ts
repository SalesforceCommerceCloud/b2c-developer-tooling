/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

type TokenResponse = {
  accessToken: string;
  expires: Date;
  scopes: string[];
};

function futureDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

describe('auth/oauth-implicit', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('adds Authorization and x-dw-client-id headers on fetch', async () => {
    const clientId = 'implicit-client-headers';
    const strategy = new ImplicitOAuthStrategy({clientId, scopes: ['a']});

    (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => ({
      accessToken: 'tok-1',
      expires: futureDate(30),
      scopes: ['a'],
    });

    let seenAuth: string | null = null;
    let seenClientId: string | null = null;

    globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      seenAuth = headers.get('Authorization');
      seenClientId = headers.get('x-dw-client-id');
      return new Response('ok', {status: 200});
    };

    const res = await strategy.fetch('https://example.com/test');
    expect(res.status).to.equal(200);
    expect(seenAuth).to.equal('Bearer tok-1');
    expect(seenClientId).to.equal(clientId);

    strategy.invalidateToken();
  });

  it('retries once on 401 after invalidating the cached token', async () => {
    const clientId = 'implicit-client-401';
    const strategy = new ImplicitOAuthStrategy({clientId, scopes: ['a']});

    let tokenCalls = 0;
    (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => {
      tokenCalls++;
      return {
        accessToken: tokenCalls === 1 ? 'tok-1' : 'tok-2',
        expires: futureDate(30),
        scopes: ['a'],
      };
    };

    const seenAuth: string[] = [];
    let fetchCalls = 0;

    globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
      fetchCalls++;
      const headers = new Headers(init?.headers);
      seenAuth.push(headers.get('Authorization') ?? '');

      // First call succeeds (establishes prior success)
      if (fetchCalls === 1) {
        return new Response('ok', {status: 200});
      }

      // Second call returns 401 (simulates expired token)
      if (fetchCalls === 2) {
        return new Response('unauthorized', {status: 401});
      }

      // Third call succeeds (retry with fresh token)
      return new Response('ok', {status: 200});
    };

    // First call succeeds - establishes prior success
    const firstRes = await strategy.fetch('https://example.com/test');
    expect(firstRes.status).to.equal(200);

    // Second call gets 401 then retries with fresh token
    const res = await strategy.fetch('https://example.com/test');
    expect(res.status).to.equal(200);

    expect(fetchCalls).to.equal(3);
    expect(tokenCalls).to.equal(2);
    expect(seenAuth[0]).to.equal('Bearer tok-1');
    expect(seenAuth[1]).to.equal('Bearer tok-1');
    expect(seenAuth[2]).to.equal('Bearer tok-2');

    strategy.invalidateToken();
  });

  it('does not retry on initial 401 when no prior success', async () => {
    const clientId = 'implicit-client-no-retry';
    const strategy = new ImplicitOAuthStrategy({clientId, scopes: ['a']});

    let tokenCalls = 0;
    (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => {
      tokenCalls++;
      return {
        accessToken: 'tok-bad',
        expires: futureDate(30),
        scopes: ['a'],
      };
    };

    let fetchCalls = 0;

    globalThis.fetch = async (_input: string | URL | Request, _init?: RequestInit) => {
      fetchCalls++;
      return new Response('unauthorized', {status: 401});
    };

    // First call gets 401 - should NOT retry since no prior success
    const res = await strategy.fetch('https://example.com/test');
    expect(res.status).to.equal(401);

    expect(fetchCalls).to.equal(1); // No retry
    expect(tokenCalls).to.equal(1); // Only fetched once

    strategy.invalidateToken();
  });

  it('reuses cached token when scopes and expiry are valid', async () => {
    const clientId = 'implicit-client-cache';
    const strategy = new ImplicitOAuthStrategy({clientId, scopes: ['a']});

    let tokenCalls = 0;
    (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => {
      tokenCalls++;
      return {
        accessToken: 'tok-cache',
        expires: futureDate(30),
        scopes: ['a'],
      };
    };

    const t1 = await strategy.getTokenResponse();
    const t2 = await strategy.getTokenResponse();

    expect(tokenCalls).to.equal(1);
    expect(t2.accessToken).to.equal(t1.accessToken);

    strategy.invalidateToken();
  });

  it('re-authenticates when cached token is missing required scopes', async () => {
    const clientId = 'implicit-client-scopes';
    const strategy = new ImplicitOAuthStrategy({clientId, scopes: ['a', 'b']});

    let tokenCalls = 0;
    (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => {
      tokenCalls++;
      return {
        accessToken: tokenCalls === 1 ? 'tok-missing-scope' : 'tok-all-scopes',
        expires: futureDate(30),
        scopes: tokenCalls === 1 ? ['a'] : ['a', 'b'],
      };
    };

    const t1 = await strategy.getTokenResponse();
    const t2 = await strategy.getTokenResponse();

    expect(tokenCalls).to.equal(2);
    expect(t1.accessToken).to.equal('tok-missing-scope');
    expect(t2.accessToken).to.equal('tok-all-scopes');

    strategy.invalidateToken();
  });

  it('deduplicates concurrent token requests using pending auth mutex', async () => {
    const clientId = 'implicit-client-pending';
    const strategy = new ImplicitOAuthStrategy({clientId, scopes: ['a']});

    let resolveToken: ((t: TokenResponse) => void) | undefined;
    let tokenCalls = 0;

    (strategy as unknown as {implicitFlowLogin: () => Promise<TokenResponse>}).implicitFlowLogin = async () => {
      tokenCalls++;
      return await new Promise<TokenResponse>((resolve) => {
        resolveToken = resolve;
      });
    };

    globalThis.fetch = async () => new Response('ok', {status: 200});

    const p1 = strategy.fetch('https://example.com/test');
    const p2 = strategy.fetch('https://example.com/test');

    if (!resolveToken) {
      throw new Error('Expected token request to be started');
    }

    resolveToken({accessToken: 'tok-pending', expires: futureDate(30), scopes: ['a']});

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.status).to.equal(200);
    expect(r2.status).to.equal(200);
    expect(tokenCalls).to.equal(1);

    strategy.invalidateToken();
  });
});
