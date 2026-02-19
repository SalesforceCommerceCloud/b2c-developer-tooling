/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  getStoredSession,
  setStoredSession,
  clearStoredSession,
  isStatefulTokenValid,
  resetStatefulStoreForTesting,
} from '@salesforce/b2c-tooling-sdk/auth';

/** Minimal JWT (header.payload.signature) with exp and scope for testing; uses base64 to match decodeJWT */
function makeJWT(payload: {exp?: number; scope?: string | string[]}): string {
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
  const body = Buffer.from(JSON.stringify({sub: 'test', ...payload})).toString('base64');
  const sig = Buffer.from('sig').toString('base64');
  return `${header}.${body}.${sig}`;
}

describe('auth/stateful-store', () => {
  const originalEnv = process.env.NODE_ENV;

  before(() => {
    process.env.NODE_ENV = 'test';
    resetStatefulStoreForTesting();
  });

  after(() => {
    process.env.NODE_ENV = originalEnv;
  });

  afterEach(() => {
    clearStoredSession();
    resetStatefulStoreForTesting();
  });

  describe('getStoredSession', () => {
    it('returns null when no token stored', () => {
      expect(getStoredSession()).to.be.null;
    });

    it('returns session when client id and token are stored', () => {
      setStoredSession({
        clientId: 'my-client',
        accessToken: 'tok',
        refreshToken: null,
        renewBase: null,
        user: null,
      });
      const session = getStoredSession();
      expect(session).to.not.be.null;
      expect(session!.clientId).to.equal('my-client');
      expect(session!.accessToken).to.equal('tok');
      expect(session!.refreshToken).to.be.null;
      expect(session!.renewBase).to.be.null;
    });

    it('returns refreshToken and renewBase when set', () => {
      setStoredSession({
        clientId: 'c',
        accessToken: 't',
        refreshToken: 'rt',
        renewBase: 'b64',
        user: 'u',
      });
      const session = getStoredSession();
      expect(session!.refreshToken).to.equal('rt');
      expect(session!.renewBase).to.equal('b64');
      expect(session!.user).to.equal('u');
    });
  });

  describe('clearStoredSession', () => {
    it('clears stored session', () => {
      setStoredSession({clientId: 'c', accessToken: 't', refreshToken: null, renewBase: null, user: null});
      expect(getStoredSession()).to.not.be.null;
      clearStoredSession();
      expect(getStoredSession()).to.be.null;
    });
  });

  describe('isStatefulTokenValid', () => {
    it('returns false when token has no exp claim', () => {
      const token = makeJWT({});
      setStoredSession({clientId: 'c', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session)).to.be.false;
    });

    it('returns false when token is expired', () => {
      const exp = Math.floor(Date.now() / 1000) - 60;
      const token = makeJWT({exp});
      setStoredSession({clientId: 'c', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session)).to.be.false;
    });

    it('returns true when token is not expired and no required scopes', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp});
      setStoredSession({clientId: 'c', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session)).to.be.true;
    });

    it('returns true when token has required scopes', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp, scope: 'sfcc.products sfcc.orders'});
      setStoredSession({clientId: 'c', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session, ['sfcc.products', 'sfcc.orders'])).to.be.true;
    });

    it('returns false when token is missing required scope', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp, scope: 'sfcc.products'});
      setStoredSession({clientId: 'c', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session, ['sfcc.products', 'sfcc.orders'])).to.be.false;
    });

    it('returns false for invalid JWT', () => {
      setStoredSession({
        clientId: 'c',
        accessToken: 'not-a-jwt',
        refreshToken: null,
        renewBase: null,
        user: null,
      });
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session)).to.be.false;
    });

    it('returns true when requiredClientId matches session clientId', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp});
      setStoredSession({clientId: 'my-client', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session, [], undefined, 'my-client')).to.be.true;
    });

    it('returns false when requiredClientId does not match session clientId', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp});
      setStoredSession({clientId: 'my-client', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session, [], undefined, 'different-client')).to.be.false;
    });

    it('skips clientId check when requiredClientId is not provided', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJWT({exp});
      setStoredSession({clientId: 'any-client', accessToken: token, refreshToken: null, renewBase: null, user: null});
      const session = getStoredSession()!;
      expect(isStatefulTokenValid(session)).to.be.true;
    });
  });
});
