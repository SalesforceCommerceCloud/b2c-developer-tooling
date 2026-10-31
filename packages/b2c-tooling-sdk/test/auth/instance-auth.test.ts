/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {
  describeAuthSession,
  describeInstanceAuth,
  describeSignIn,
  type AuthSession,
} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_PUBLIC_CLIENT_ID} from '../../src/defaults.js';

function jwt(expSecondsFromNow: number): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({alg: 'none'})}.${encode({exp: Math.floor(Date.now() / 1000) + expSecondsFromNow})}.sig`;
}

function session(clientId: string, overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    clientId,
    flow: 'pkce',
    accessToken: jwt(600),
    refreshToken: 'refresh',
    sub: 'dev@example.com',
    lastUsedAt: '2026-10-23T23:00:00.000Z',
    ...overrides,
  };
}

describe('auth/instance-auth', () => {
  it('reports nothing usable with only a hostname and no fallback', () => {
    const summary = describeInstanceAuth({}, {sessions: []});
    expect(summary).to.deep.equal({
      ocapi: {method: 'none'},
      scapi: {method: 'none'},
      webdav: {method: 'none'},
      sessions: [],
    });
  });

  it('uses the built-in client browser login for WebDAV when allowed', () => {
    const summary = describeInstanceAuth(
      {},
      {defaultWebDavClient: true, sessions: [session(DEFAULT_PUBLIC_CLIENT_ID), session('other-client')]},
    );
    expect(summary.ocapi).to.deep.equal({method: 'none'});
    expect(summary.webdav).to.deep.equal({method: 'user', clientId: DEFAULT_PUBLIC_CLIENT_ID, builtInClient: true});
    expect(summary.sessions).to.have.length(1);
    expect(summary.sessions[0]).to.include({
      clientId: DEFAULT_PUBLIC_CLIENT_ID,
      builtInClient: true,
      user: 'dev@example.com',
      accessTokenValid: true,
      canRefresh: true,
    });
    expect(summary.sessions[0].usedFor).to.deep.equal(['webdav']);
  });

  it('prefers Basic auth for WebDAV and the API client for API calls', () => {
    const summary = describeInstanceAuth(
      {username: 'u', password: 'p', clientId: 'my-client', clientSecret: 's'},
      {defaultWebDavClient: true, sessions: [session(DEFAULT_PUBLIC_CLIENT_ID)]},
    );
    expect(summary.webdav).to.deep.equal({method: 'basic'});
    expect(summary.ocapi).to.deep.equal({method: 'client-credentials', clientId: 'my-client', builtInClient: false});
    // SCAPI also needs a short code and tenant.
    expect(summary.scapi).to.deep.equal({method: 'none'});
    expect(summary.sessions).to.deep.equal([]);
  });

  it('shares a configured public client session between API and WebDAV', () => {
    const summary = describeInstanceAuth({clientId: 'my-public'}, {sessions: [session('my-public')]});
    expect(summary.ocapi.method).to.equal('user');
    expect(summary.webdav.method).to.equal('user');
    // SCAPI Admin APIs don't accept browser logins yet.
    expect(summary.scapi.method).to.equal('none');
    expect(summary.sessions.map((s) => s.usedFor)).to.deep.equal([['ocapi', 'webdav']]);
  });

  it('honors authMethods', () => {
    const summary = describeInstanceAuth(
      {username: 'u', password: 'p', clientId: 'my-client', clientSecret: 's', authMethods: ['user']},
      {sessions: []},
    );
    expect(summary.webdav.method).to.equal('user');
    expect(summary.ocapi.method).to.equal('user');
  });

  it('uses the API client for SCAPI with a stateless flow and tenant', () => {
    const summary = describeInstanceAuth(
      {clientId: 'my-client', clientSecret: 's', shortCode: 'abc', tenantId: 'zzxy_prd'},
      {sessions: []},
    );
    expect(summary.scapi).to.deep.equal({method: 'client-credentials', clientId: 'my-client', builtInClient: false});
  });

  it('reuses the only unconfigured session for API calls only when asked', () => {
    const sessions = [session('cli-login')];
    expect(describeInstanceAuth({}, {sessions}).ocapi.method).to.equal('none');
    const summary = describeInstanceAuth({}, {sessions, reuseUnconfiguredSession: true});
    expect(summary.ocapi).to.deep.equal({method: 'user', clientId: 'cli-login', builtInClient: false});
  });

  it('marks expired access tokens and sessions that cannot refresh', () => {
    const summary = describeAuthSession(
      session('legacy', {flow: 'implicit', accessToken: jwt(-60), refreshToken: null}),
    );
    expect(summary).to.include({accessTokenValid: false, canRefresh: false, builtInClient: false});
  });

  describe('describeSignIn', () => {
    let clock: sinon.SinonFakeTimers;
    let expiresAt: Date;
    let time: string;

    // Pin "now" to local midday so a 30-minute expiry never crosses midnight
    // (which would add the date to the message).
    beforeEach(() => {
      clock = sinon.useFakeTimers({now: new Date(2026, 9, 23, 12, 0), toFake: ['Date']});
      expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      time = expiresAt.toLocaleString(undefined, {timeStyle: 'short'});
    });

    afterEach(() => {
      clock.restore();
    });

    it('names the user and when access expires', () => {
      expect(describeSignIn({clientId: DEFAULT_PUBLIC_CLIENT_ID, user: 'dev@example.com', expiresAt})).to.equal(
        `Signed in to Account Manager as dev@example.com, expires ${time}.`,
      );
    });

    it('reports when the refresh token expires, since that ends the sign-in', () => {
      const refreshToken = jwt(26 * 60 * 60);
      const until = new Date((Math.floor(Date.now() / 1000) + 26 * 60 * 60) * 1000);
      const expected = until.toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'});
      expect(
        describeSignIn({clientId: DEFAULT_PUBLIC_CLIENT_ID, user: 'dev@example.com', expiresAt, refreshToken}),
      ).to.equal(`Signed in to Account Manager as dev@example.com, expires ${expected}.`);
    });

    it('describes renewals and names other clients', () => {
      expect(describeSignIn({clientId: 'my-client', user: 'dev@example.com', expiresAt, action: 'renewed'})).to.equal(
        `Renewed Account Manager sign-in for dev@example.com, client my-client, expires ${time}.`,
      );
    });
  });
});
