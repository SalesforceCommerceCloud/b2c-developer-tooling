/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {expect} from 'chai';
import {
  PkceOAuthStrategy,
  initializeFileAuthSessionStore,
  findAuthSession,
  saveAuthSession,
  clearAllAuthSessions,
  resetAuthSessionStoreForTesting,
} from '@salesforce/b2c-tooling-sdk/auth';

type TokenResponse = {
  accessToken: string;
  expires: Date;
  scopes: string[];
};

function futureDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Replace `runFlow` (the browser-driven exchange) with a stub. Returns the
 * call counter so tests can assert how many times the flow ran.
 */
function stubRunFlow(strategy: PkceOAuthStrategy, factory: (call: number) => Promise<TokenResponse>) {
  const counter = {calls: 0};
  (strategy as unknown as {runFlow: () => Promise<TokenResponse>}).runFlow = async () => {
    counter.calls++;
    return factory(counter.calls);
  };
  return counter;
}

describe('auth/oauth-pkce', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('without persistence (persistSession: false)', () => {
    it('adds Authorization and x-dw-client-id headers on fetch', async () => {
      const clientId = 'pkce-client-headers';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a'], persistSession: false});

      stubRunFlow(strategy, async () => ({
        accessToken: 'tok-1',
        expires: futureDate(30),
        scopes: ['a'],
      }));

      let seenAuth: string | null = null;
      let seenClientId: string | null = null;

      globalThis.fetch = async (_input, init?: RequestInit) => {
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
      const clientId = 'pkce-client-401';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a'], persistSession: false});

      const stub = stubRunFlow(strategy, async (call) => ({
        accessToken: call === 1 ? 'tok-1' : 'tok-2',
        expires: futureDate(30),
        scopes: ['a'],
      }));

      const seenAuth: string[] = [];
      let fetchCalls = 0;

      globalThis.fetch = async (_input, init?: RequestInit) => {
        fetchCalls++;
        const headers = new Headers(init?.headers);
        seenAuth.push(headers.get('Authorization') ?? '');
        if (fetchCalls === 1) return new Response('ok', {status: 200});
        if (fetchCalls === 2) return new Response('unauthorized', {status: 401});
        return new Response('ok', {status: 200});
      };

      const firstRes = await strategy.fetch('https://example.com/test');
      expect(firstRes.status).to.equal(200);

      const res = await strategy.fetch('https://example.com/test');
      expect(res.status).to.equal(200);

      expect(fetchCalls).to.equal(3);
      expect(stub.calls).to.equal(2);
      expect(seenAuth[0]).to.equal('Bearer tok-1');
      expect(seenAuth[1]).to.equal('Bearer tok-1');
      expect(seenAuth[2]).to.equal('Bearer tok-2');

      strategy.invalidateToken();
    });

    it('does not retry on initial 401 when no prior success', async () => {
      const clientId = 'pkce-client-no-retry';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a'], persistSession: false});

      const stub = stubRunFlow(strategy, async () => ({
        accessToken: 'tok-bad',
        expires: futureDate(30),
        scopes: ['a'],
      }));

      let fetchCalls = 0;
      globalThis.fetch = async () => {
        fetchCalls++;
        return new Response('unauthorized', {status: 401});
      };

      const res = await strategy.fetch('https://example.com/test');
      expect(res.status).to.equal(401);
      expect(fetchCalls).to.equal(1);
      expect(stub.calls).to.equal(1);

      strategy.invalidateToken();
    });

    it('reuses cached token when scopes and expiry are valid', async () => {
      const clientId = 'pkce-client-cache';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a'], persistSession: false});

      const stub = stubRunFlow(strategy, async () => ({
        accessToken: 'tok-cache',
        expires: futureDate(30),
        scopes: ['a'],
      }));

      const t1 = await strategy.getTokenResponse();
      const t2 = await strategy.getTokenResponse();

      expect(stub.calls).to.equal(1);
      expect(t2.accessToken).to.equal(t1.accessToken);

      strategy.invalidateToken();
    });

    it('re-authenticates when cached token is missing required scopes', async () => {
      const clientId = 'pkce-client-scopes';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a', 'b'], persistSession: false});

      const stub = stubRunFlow(strategy, async (call) => ({
        accessToken: call === 1 ? 'tok-missing-scope' : 'tok-all-scopes',
        expires: futureDate(30),
        scopes: call === 1 ? ['a'] : ['a', 'b'],
      }));

      const t1 = await strategy.getTokenResponse();
      const t2 = await strategy.getTokenResponse();

      expect(stub.calls).to.equal(2);
      expect(t1.accessToken).to.equal('tok-missing-scope');
      expect(t2.accessToken).to.equal('tok-all-scopes');

      strategy.invalidateToken();
    });

    it('deduplicates concurrent token requests using pending auth mutex', async () => {
      const clientId = 'pkce-client-pending';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a'], persistSession: false});

      let resolveToken: ((t: TokenResponse) => void) | undefined;
      let runFlowCalls = 0;

      (strategy as unknown as {runFlow: () => Promise<TokenResponse>}).runFlow = async () => {
        runFlowCalls++;
        return await new Promise<TokenResponse>((resolve) => {
          resolveToken = resolve;
        });
      };

      globalThis.fetch = async () => new Response('ok', {status: 200});

      const p1 = strategy.fetch('https://example.com/test');
      const p2 = strategy.fetch('https://example.com/test');

      // Yield so the pending-auth mutex can be set up before we resolve
      await new Promise((resolve) => setTimeout(resolve, 5));

      if (!resolveToken) {
        throw new Error('Expected token request to be started');
      }

      resolveToken({accessToken: 'tok-pending', expires: futureDate(30), scopes: ['a']});

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.status).to.equal(200);
      expect(r2.status).to.equal(200);
      expect(runFlowCalls).to.equal(1);

      strategy.invalidateToken();
    });
  });

  describe('persistence and refresh', () => {
    let testDir: string;

    before(() => {
      testDir = mkdtempSync(join(tmpdir(), 'b2c-pkce-test-'));
      initializeFileAuthSessionStore(testDir);
    });

    after(() => {
      resetAuthSessionStoreForTesting();
      rmSync(testDir, {recursive: true, force: true});
    });

    afterEach(() => {
      clearAllAuthSessions();
    });

    it('hydrates a stored access token from the session store on first use', async () => {
      const clientId = 'pkce-hydrate';
      saveAuthSession({
        clientId,
        flow: 'pkce',
        accessToken: 'persisted-access',
        refreshToken: null,
        scopes: ['a'],
        expiresAt: futureDate(30).toISOString(),
        sub: 'user@example.com',
      });

      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a']});

      // runFlow should NOT be called — hydrated token is fresh.
      const stub = stubRunFlow(strategy, async () => {
        throw new Error('runFlow should not be invoked when a valid stored token exists');
      });

      const tokenResponse = await strategy.getTokenResponse();
      expect(tokenResponse.accessToken).to.equal('persisted-access');
      expect(stub.calls).to.equal(0);

      strategy.invalidateToken();
    });

    it('ignores stored sessions tagged with a different flow (e.g. implicit)', async () => {
      const clientId = 'pkce-wrong-flow';
      saveAuthSession({
        clientId,
        flow: 'implicit',
        accessToken: 'implicit-access',
        refreshToken: null,
        scopes: ['a'],
        expiresAt: futureDate(30).toISOString(),
      });

      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a']});
      stubRunFlow(strategy, async () => ({
        accessToken: 'fresh-pkce-access',
        expires: futureDate(30),
        scopes: ['a'],
      }));

      const tokenResponse = await strategy.getTokenResponse();
      // The implicit-flow record must not be reused; PKCE runs its own flow.
      expect(tokenResponse.accessToken).to.equal('fresh-pkce-access');

      strategy.invalidateToken();
    });

    it('persists access + refresh tokens to the store after a fresh flow', async () => {
      const clientId = 'pkce-persist';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a']});

      // Simulate runFlow completing AND setting the refresh token internally,
      // which is what the real implementation does. We mimic that side effect.
      (strategy as unknown as {runFlow: () => Promise<TokenResponse>}).runFlow = async () => {
        (strategy as unknown as {_refreshToken: string})._refreshToken = 'rt-fresh';
        const tokenResponse = {
          accessToken: 'at-fresh',
          expires: futureDate(30),
          scopes: ['a'],
        };
        // Mimic the real implementation calling persistTokens.
        (strategy as unknown as {persistTokens: (t: TokenResponse) => void}).persistTokens(tokenResponse);
        return tokenResponse;
      };

      await strategy.getTokenResponse();

      const stored = findAuthSession(clientId);
      expect(stored).to.not.be.null;
      expect(stored!.flow).to.equal('pkce');
      expect(stored!.accessToken).to.equal('at-fresh');
      expect(stored!.refreshToken).to.equal('rt-fresh');

      strategy.invalidateToken();
    });

    it('uses a stored refresh token to mint a new access token without running the browser flow', async () => {
      const clientId = 'pkce-refresh';
      // Pre-populate an EXPIRED access token + valid refresh token
      saveAuthSession({
        clientId,
        flow: 'pkce',
        accessToken: 'old-expired',
        refreshToken: 'rt-valid',
        scopes: ['a'],
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      });

      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a']});

      // runFlow must NOT be invoked.
      const flowStub = stubRunFlow(strategy, async () => {
        throw new Error('Browser flow should not run when a refresh token is available');
      });

      let tokenEndpointCalls = 0;
      let refreshBody = '';
      globalThis.fetch = async (input, init?: RequestInit) => {
        tokenEndpointCalls++;
        refreshBody = (init?.body as string) ?? '';
        expect(String(input)).to.include('/dwsso/oauth2/access_token');
        return new Response(
          JSON.stringify({
            access_token: 'at-refreshed',
            refresh_token: 'rt-rotated',
            expires_in: 1800,
            scope: 'a',
          }),
          {status: 200, headers: {'Content-Type': 'application/json'}},
        );
      };

      const tokenResponse = await strategy.getTokenResponse();
      expect(tokenResponse.accessToken).to.equal('at-refreshed');
      expect(flowStub.calls).to.equal(0);
      expect(tokenEndpointCalls).to.equal(1);
      expect(refreshBody).to.include('grant_type=refresh_token');
      expect(refreshBody).to.include('refresh_token=rt-valid');
      expect(refreshBody).to.include(`client_id=${clientId}`);

      // The rotated refresh token + new access token must be persisted.
      const stored = findAuthSession(clientId);
      expect(stored!.accessToken).to.equal('at-refreshed');
      expect(stored!.refreshToken).to.equal('rt-rotated');

      strategy.invalidateToken();
    });

    it('falls back to the browser flow when refresh fails (e.g. invalid_grant)', async () => {
      const clientId = 'pkce-refresh-fail';
      saveAuthSession({
        clientId,
        flow: 'pkce',
        accessToken: 'old-expired',
        refreshToken: 'rt-revoked',
        scopes: ['a'],
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      });

      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a']});

      const flowStub = stubRunFlow(strategy, async () => {
        // Simulate the real flow persisting after success.
        (strategy as unknown as {_refreshToken: string})._refreshToken = 'rt-fresh-after-browser';
        const tokenResponse = {
          accessToken: 'at-from-browser',
          expires: futureDate(30),
          scopes: ['a'],
        };
        (strategy as unknown as {persistTokens: (t: TokenResponse) => void}).persistTokens(tokenResponse);
        return tokenResponse;
      });

      // Refresh endpoint rejects with invalid_grant.
      globalThis.fetch = async () =>
        new Response(JSON.stringify({error: 'invalid_grant'}), {
          status: 400,
          headers: {'Content-Type': 'application/json'},
        });

      const tokenResponse = await strategy.getTokenResponse();
      expect(tokenResponse.accessToken).to.equal('at-from-browser');
      expect(flowStub.calls).to.equal(1);

      // Browser-flow tokens should now be in the store.
      const stored = findAuthSession(clientId);
      expect(stored!.accessToken).to.equal('at-from-browser');
      expect(stored!.refreshToken).to.equal('rt-fresh-after-browser');

      strategy.invalidateToken();
    });

    it('does not persist when persistSession is false', async () => {
      const clientId = 'pkce-no-persist';
      const strategy = new PkceOAuthStrategy({clientId, scopes: ['a'], persistSession: false});

      (strategy as unknown as {runFlow: () => Promise<TokenResponse>}).runFlow = async () => {
        (strategy as unknown as {_refreshToken: string})._refreshToken = 'rt';
        const t = {accessToken: 'at', expires: futureDate(30), scopes: ['a']};
        (strategy as unknown as {persistTokens: (t: TokenResponse) => void}).persistTokens(t);
        return t;
      };

      await strategy.getTokenResponse();
      expect(findAuthSession(clientId)).to.be.null;

      strategy.invalidateToken();
    });
  });
});
