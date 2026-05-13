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
  initializeFileAuthSessionStore,
  findAuthSession,
  saveAuthSession,
  deleteAuthSession,
  listAuthSessions,
  clearAllAuthSessions,
  isAuthSessionTokenValid,
  resetAuthSessionStoreForTesting,
} from '@salesforce/b2c-tooling-sdk/auth';

function makeJWT(payload: {exp?: number; scope?: string | string[]}): string {
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
  const body = Buffer.from(JSON.stringify({sub: 'test', ...payload})).toString('base64');
  const sig = Buffer.from('sig').toString('base64');
  return `${header}.${body}.${sig}`;
}

describe('auth/session-store', () => {
  let testDir: string;

  before(() => {
    testDir = mkdtempSync(join(tmpdir(), 'b2c-auth-session-test-'));
    initializeFileAuthSessionStore(testDir);
  });

  after(() => {
    resetAuthSessionStoreForTesting();
    rmSync(testDir, {recursive: true, force: true});
  });

  afterEach(() => {
    clearAllAuthSessions();
  });

  describe('findAuthSession', () => {
    it('returns null when no session is stored', () => {
      expect(findAuthSession('any-client')).to.be.null;
    });

    it('returns the session for a clientId', () => {
      saveAuthSession({
        clientId: 'my-client',
        flow: 'client-credentials',
        accessToken: 'tok',
        refreshToken: null,
      });
      const session = findAuthSession('my-client');
      expect(session).to.not.be.null;
      expect(session!.clientId).to.equal('my-client');
      expect(session!.accessToken).to.equal('tok');
      expect(session!.flow).to.equal('client-credentials');
      expect(session!.refreshToken).to.be.null;
    });

    it('persists pkce sessions with refresh tokens', () => {
      saveAuthSession({
        clientId: 'pkce-client',
        flow: 'pkce',
        accessToken: 't',
        refreshToken: 'rt',
        sub: 'user@example.com',
      });
      const session = findAuthSession('pkce-client');
      expect(session!.flow).to.equal('pkce');
      expect(session!.refreshToken).to.equal('rt');
      expect(session!.sub).to.equal('user@example.com');
    });

    it('keeps multiple sessions distinct by clientId', () => {
      saveAuthSession({clientId: 'a', flow: 'client-credentials', accessToken: 't1', refreshToken: null});
      saveAuthSession({clientId: 'b', flow: 'pkce', accessToken: 't2', refreshToken: 'r2'});

      expect(findAuthSession('a')!.accessToken).to.equal('t1');
      expect(findAuthSession('b')!.accessToken).to.equal('t2');
      expect(listAuthSessions()).to.have.length(2);
    });
  });

  describe('deleteAuthSession', () => {
    it('removes a single session', () => {
      saveAuthSession({clientId: 'a', flow: 'client-credentials', accessToken: 't', refreshToken: null});
      saveAuthSession({clientId: 'b', flow: 'pkce', accessToken: 't', refreshToken: null});
      deleteAuthSession('a');
      expect(findAuthSession('a')).to.be.null;
      expect(findAuthSession('b')).to.not.be.null;
    });
  });

  describe('clearAllAuthSessions', () => {
    it('removes every stored session', () => {
      saveAuthSession({clientId: 'a', flow: 'client-credentials', accessToken: 't', refreshToken: null});
      saveAuthSession({clientId: 'b', flow: 'pkce', accessToken: 't', refreshToken: null});
      clearAllAuthSessions();
      expect(listAuthSessions()).to.have.length(0);
    });
  });

  describe('isAuthSessionTokenValid', () => {
    function session(clientId: string, accessToken: string) {
      return {
        clientId,
        flow: 'client-credentials' as const,
        accessToken,
        refreshToken: null,
      };
    }

    it('returns false when token has no exp claim', () => {
      expect(isAuthSessionTokenValid(session('c', makeJWT({})))).to.be.false;
    });

    it('returns false when token is expired', () => {
      const exp = Math.floor(Date.now() / 1000) - 60;
      expect(isAuthSessionTokenValid(session('c', makeJWT({exp})))).to.be.false;
    });

    it('returns true when token is not expired and no required scopes', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      expect(isAuthSessionTokenValid(session('c', makeJWT({exp})))).to.be.true;
    });

    it('returns true when token has required scopes', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp, scope: 'sfcc.products sfcc.orders'});
      expect(isAuthSessionTokenValid(session('c', token), ['sfcc.products', 'sfcc.orders'])).to.be.true;
    });

    it('returns false when token is missing required scope', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp, scope: 'sfcc.products'});
      expect(isAuthSessionTokenValid(session('c', token), ['sfcc.products', 'sfcc.orders'])).to.be.false;
    });

    it('returns false for invalid JWT', () => {
      expect(isAuthSessionTokenValid(session('c', 'not-a-jwt'))).to.be.false;
    });

    it('returns true when requiredClientId matches', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      expect(isAuthSessionTokenValid(session('my-client', makeJWT({exp})), [], undefined, 'my-client')).to.be.true;
    });

    it('returns false when requiredClientId does not match', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      expect(isAuthSessionTokenValid(session('my-client', makeJWT({exp})), [], undefined, 'different-client')).to.be
        .false;
    });

    it('skips clientId check when requiredClientId is not provided', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      expect(isAuthSessionTokenValid(session('any-client', makeJWT({exp})))).to.be.true;
    });
  });
});
