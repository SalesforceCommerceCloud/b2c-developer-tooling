/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createServer, type Server} from 'node:http';
import {expect} from 'chai';
import {resetLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {
  AuthRequiredError,
  InMemoryAuthSessionBackend,
  PkceOAuthStrategy,
  buildPkceAuthorizeRequest,
  createUserAuthStrategy,
  isAuthRequiredError,
  readPkceAuthorizationResponse,
  resetAuthSessionStoreForTesting,
  setAuthSessionBackend,
} from '@salesforce/b2c-tooling-sdk/auth';

const REDIRECT = 'http://127.0.0.1:8086/callback';

function tokenResponse(accessToken: string, refreshToken?: string): Response {
  return new Response(
    JSON.stringify({access_token: accessToken, refresh_token: refreshToken, expires_in: 1800, scope: 'openid roles'}),
    {status: 200, headers: {'Content-Type': 'application/json'}},
  );
}

describe('auth/oauth-pkce host integration', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetAuthSessionStoreForTesting();
    resetLogger();
  });

  describe('buildPkceAuthorizeRequest / readPkceAuthorizationResponse', () => {
    it('builds an S256 authorize URL with state and scopes', () => {
      const request = buildPkceAuthorizeRequest({
        clientId: 'c1',
        redirectUri: REDIRECT,
        accountManagerHost: 'account.example.com',
        scopes: ['openid', 'roles', 'tenantFilter'],
      });
      const url = new URL(request.url);
      expect(url.host).to.equal('account.example.com');
      expect(url.pathname).to.equal('/dwsso/oauth2/authorize');
      expect(url.searchParams.get('client_id')).to.equal('c1');
      expect(url.searchParams.get('redirect_uri')).to.equal(REDIRECT);
      expect(url.searchParams.get('code_challenge_method')).to.equal('S256');
      expect(url.searchParams.get('state')).to.equal(request.state);
      expect(url.searchParams.get('scope')).to.equal('openid roles tenantFilter');
      expect(url.searchParams.get('code_challenge')).to.not.equal(request.codeVerifier);
      expect(request.url).to.not.include(request.codeVerifier);
    });

    it('accepts the matching redirect and rejects wrong state, origin, or an OAuth error', () => {
      const request = {redirectUri: REDIRECT, state: 's1'};
      expect(readPkceAuthorizationResponse(`${REDIRECT}?code=abc&state=s1`, request)).to.equal('abc');
      expect(() => readPkceAuthorizationResponse(`${REDIRECT}?code=abc&state=other`, request)).to.throw(
        'state mismatch',
      );
      expect(() => readPkceAuthorizationResponse(`${REDIRECT}?code=abc&state=s1&state=s1`, request)).to.throw(
        'state mismatch',
      );
      expect(() => readPkceAuthorizationResponse(`http://127.0.0.1:9999/callback?code=abc&state=s1`, request)).to.throw(
        'redirect URI',
      );
      expect(() => readPkceAuthorizationResponse(`${REDIRECT}?error=access_denied&state=s1`, request)).to.throw(
        'access_denied',
      );
      expect(() => readPkceAuthorizationResponse(`${REDIRECT}?state=s1`, request)).to.throw('authorization code');
    });
  });

  describe('authorize hook', () => {
    it('completes sign-in from a host-delivered redirect without opening a listener', async () => {
      // Occupy the port the strategy would listen on: opening a listener would fail with EADDRINUSE.
      const blocker: Server = createServer();
      await new Promise<void>((resolve) => blocker.listen(0, '127.0.0.1', resolve));
      const {port} = blocker.address() as {port: number};
      let tokenBody = '';
      globalThis.fetch = async (_input, init?: RequestInit) => {
        tokenBody = String(init?.body ?? '');
        return tokenResponse('at-1', 'rt-1');
      };
      const strategy = new PkceOAuthStrategy({
        clientId: 'host-authorize',
        redirectUri: REDIRECT,
        localPort: port,
        persistSession: false,
        async authorize(url, context) {
          expect(context.redirectUri).to.equal(REDIRECT);
          const state = new URL(url).searchParams.get('state');
          return new URL(`${REDIRECT}?code=the-code&state=${state}`);
        },
      });

      const token = await strategy.signIn().finally(() => blocker.close());
      expect(token.accessToken).to.equal('at-1');
      expect(tokenBody).to.include('grant_type=authorization_code');
      expect(tokenBody).to.include('code=the-code');
      expect(tokenBody).to.include('code_verifier=');
      expect(tokenBody).to.include(`redirect_uri=${encodeURIComponent(REDIRECT)}`);
      strategy.signOut();
    });

    it('rejects a redirect with a mismatched state and never exchanges the code', async () => {
      let fetched = false;
      globalThis.fetch = async () => {
        fetched = true;
        return tokenResponse('at');
      };
      const strategy = new PkceOAuthStrategy({
        clientId: 'host-authorize-bad-state',
        redirectUri: REDIRECT,
        persistSession: false,
        authorize: async () => `${REDIRECT}?code=the-code&state=forged`,
      });
      try {
        await strategy.signIn();
        expect.fail('expected state mismatch');
      } catch (error) {
        expect((error as Error).message).to.include('state mismatch');
      }
      expect(fetched).to.equal(false);
    });

    it('propagates a host cancellation', async () => {
      const strategy = new PkceOAuthStrategy({
        clientId: 'host-authorize-cancel',
        redirectUri: REDIRECT,
        persistSession: false,
        authorize: async () => {
          throw new Error('Window closed');
        },
      });
      try {
        await strategy.signIn();
        expect.fail('expected cancellation');
      } catch (error) {
        expect((error as Error).message).to.equal('Window closed');
      }
    });
  });

  describe('non-interactive mode with a host session backend', () => {
    it('signs in, refreshes, signs out and fails with AuthRequiredError, without touching the process-wide store', async () => {
      const backend = new InMemoryAuthSessionBackend();
      // The process-wide backend (the file store by default) must not be used when a
      // per-strategy backend is passed; this one throws if touched.
      setAuthSessionBackend({
        find: () => {
          throw new Error('global backend used');
        },
        save: () => {
          throw new Error('global backend used');
        },
        delete: () => {
          throw new Error('global backend used');
        },
        list: () => [],
        clearAll: () => {},
      });
      let authorizeCalls = 0;
      const responses = [tokenResponse('at-signin', 'rt-1'), tokenResponse('at-refreshed', 'rt-2')];
      const bodies: string[] = [];
      globalThis.fetch = async (_input, init?: RequestInit) => {
        bodies.push(String(init?.body ?? ''));
        return responses.shift() ?? new Response('{"error":"invalid_grant"}', {status: 400});
      };
      const config = {
        clientId: 'host-backend',
        redirectUri: REDIRECT,
        interactive: false,
        sessionBackend: backend,
        async authorize(url: string) {
          authorizeCalls++;
          return `${REDIRECT}?code=c&state=${new URL(url).searchParams.get('state')}`;
        },
      };

      // Sign in explicitly; the session lands in the host backend.
      const strategy = new PkceOAuthStrategy(config);
      expect((await strategy.signIn()).accessToken).to.equal('at-signin');
      expect(backend.find('host-backend')?.refreshToken).to.equal('rt-1');

      // A later strategy refreshes from the stored refresh token once the access token has expired.
      strategy.invalidateToken();
      const expire = () => {
        const stored = backend.find('host-backend')!;
        backend.save({...stored, expiresAt: new Date(Date.now() - 60_000).toISOString()});
      };
      expire();
      const restored = new PkceOAuthStrategy(config);
      expect((await restored.getTokenResponse()).accessToken).to.equal('at-refreshed');
      expect(bodies[1]).to.include('grant_type=refresh_token');
      expect(bodies[1]).to.include('refresh_token=rt-1');
      expect(backend.find('host-backend')?.refreshToken).to.equal('rt-2');

      // Revoked refresh token → AuthRequiredError, no sign-in attempt.
      restored.invalidateToken();
      expire();
      try {
        await new PkceOAuthStrategy(config).getTokenResponse();
        expect.fail('expected AuthRequiredError');
      } catch (error) {
        expect(error).to.be.instanceOf(AuthRequiredError);
        expect(isAuthRequiredError(error)).to.equal(true);
        expect((error as AuthRequiredError).reason).to.equal('refresh-failed');
      }
      expect(authorizeCalls).to.equal(1);

      // Sign out removes the session; the next call reports no session.
      restored.signOut();
      expect(backend.find('host-backend')).to.equal(null);
      try {
        await new PkceOAuthStrategy(config).getTokenResponse();
        expect.fail('expected AuthRequiredError');
      } catch (error) {
        expect((error as AuthRequiredError).reason).to.equal('no-session');
      }

      expect(authorizeCalls).to.equal(1);
    });

    it('keeps sessions in different backends apart even with the same client ID', async () => {
      globalThis.fetch = async () => tokenResponse('at-profile-a', 'rt-a');
      const authorize = async (url: string) => `${REDIRECT}?code=c&state=${new URL(url).searchParams.get('state')}`;
      const profileA = new InMemoryAuthSessionBackend();
      const profileB = new InMemoryAuthSessionBackend();
      const base = {clientId: 'shared-public-client', redirectUri: REDIRECT, interactive: false, authorize};

      const a = new PkceOAuthStrategy({...base, sessionBackend: profileA});
      expect((await a.signIn()).accessToken).to.equal('at-profile-a');

      const b = new PkceOAuthStrategy({...base, sessionBackend: profileB});
      try {
        await b.getTokenResponse();
        expect.fail('expected AuthRequiredError for the empty profile');
      } catch (error) {
        expect(isAuthRequiredError(error)).to.equal(true);
      }
      b.signOut();
      expect(
        (await new PkceOAuthStrategy({...base, sessionBackend: profileA}).getTokenResponse()).accessToken,
      ).to.equal('at-profile-a');
      a.signOut();
    });

    it('a sign-out sticks for other live instances on the same backend', async () => {
      const backend = new InMemoryAuthSessionBackend();
      const bodies: string[] = [];
      globalThis.fetch = async (_input, init?: RequestInit) => {
        bodies.push(String(init?.body ?? ''));
        return tokenResponse('at-1', 'rt-1');
      };
      const config = {
        clientId: 'signout-sticks',
        redirectUri: REDIRECT,
        interactive: false,
        sessionBackend: backend,
        authorize: async (url: string) => `${REDIRECT}?code=c&state=${new URL(url).searchParams.get('state')}`,
      };
      const first = new PkceOAuthStrategy(config);
      await first.signIn();
      const second = new PkceOAuthStrategy(config);
      expect((await second.getTokenResponse()).accessToken).to.equal('at-1');

      first.signOut();
      try {
        await second.getTokenResponse();
        expect.fail('expected AuthRequiredError after sign-out');
      } catch (error) {
        expect((error as AuthRequiredError).reason).to.equal('no-session');
      }
      // No refresh was attempted with the forgotten refresh token, and nothing was written back.
      expect(bodies.filter((body) => body.includes('grant_type=refresh_token'))).to.have.length(0);
      expect(backend.find('signout-sticks')).to.equal(null);
    });

    it('createUserAuthStrategy skips the implicit fallback for host-driven configs', () => {
      expect(createUserAuthStrategy({clientId: 'x', interactive: false})).to.be.instanceOf(PkceOAuthStrategy);
      expect(createUserAuthStrategy({clientId: 'x', authorize: async () => REDIRECT})).to.be.instanceOf(
        PkceOAuthStrategy,
      );
      expect(
        createUserAuthStrategy({clientId: 'x', sessionBackend: new InMemoryAuthSessionBackend()}),
      ).to.be.instanceOf(PkceOAuthStrategy);
      expect(createUserAuthStrategy({clientId: 'x'})).to.not.be.instanceOf(PkceOAuthStrategy);
    });
  });
});
