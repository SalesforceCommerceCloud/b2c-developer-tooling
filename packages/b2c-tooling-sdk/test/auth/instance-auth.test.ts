/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {describeAuthSession, describeInstanceAuth, type AuthSession} from '@salesforce/b2c-tooling-sdk/auth';
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
});
