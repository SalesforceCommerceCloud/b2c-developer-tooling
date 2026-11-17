/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {BasicAuthStrategy, OAuthStrategy, type AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const host = {hostname: 'my-sandbox.example.com', shortCode: 'abc123', tenantId: 'zzzz_001'};

function webdavAuth(instance: B2CInstance): AuthStrategy {
  return (instance.webdav as unknown as {auth: AuthStrategy}).auth;
}

describe('instance/B2CInstance host-owned strategies', () => {
  it('uses scapiStrategy for scapiClientConfig without OAuth config', () => {
    const scapi = new OAuthStrategy({clientId: 'host-client', clientSecret: 'secret'});
    let built = 0;
    const instance = new B2CInstance(
      host,
      {},
      {
        scapiStrategy: () => {
          built++;
          return scapi;
        },
      },
    );

    expect(instance.hasOAuthCredentials).to.equal(true);
    expect(instance.scapiClientConfig).to.deep.equal({shortCode: 'abc123', tenantId: 'zzzz_001', auth: scapi});
    instance.scapiClientConfig;
    expect(built).to.equal(1);
  });

  it('still needs shortCode and tenantId for SCAPI', () => {
    const instance = new B2CInstance(
      {hostname: 'my-sandbox.example.com'},
      {},
      {scapiStrategy: new OAuthStrategy({clientId: 'c', clientSecret: 's'})},
    );
    expect(instance.scapiClientConfig).to.equal(undefined);
  });

  it('uses webdavStrategy over Basic auth and OAuth config', () => {
    const webdav = new BasicAuthStrategy('host-user', 'host-key');
    const instance = new B2CInstance(
      host,
      {basic: {username: 'cfg', password: 'cfg'}, oauth: {clientId: 'c', clientSecret: 's'}},
      {webdavStrategy: webdav},
    );
    expect(webdavAuth(instance)).to.equal(webdav);
    expect(instance.webdavUsesUserAuth).to.equal(false);
  });

  it('reports user auth when webdavStrategy is a user strategy', () => {
    const user = {
      authMethod: 'user',
      fetch: async () => new Response(),
      getAuthorizationHeader: async () => 'Bearer x',
      getJWT: async () => ({header: {}, payload: {sub: 'user@example.com'}}),
      getTokenResponse: async () => ({accessToken: 'x', expires: new Date(), scopes: []}),
    } as unknown as AuthStrategy;
    const instance = new B2CInstance(host, {}, {webdavStrategy: user});
    void instance.webdav;
    expect(instance.webdavUsesUserAuth).to.equal(true);
  });
});
