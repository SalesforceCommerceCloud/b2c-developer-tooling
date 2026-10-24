/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import type {AuthStrategy, UserAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {
  WebDavClient,
  describeWebDavUserAccessFailure,
  getWebDavRootPermission,
} from '@salesforce/b2c-tooling-sdk/clients';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {createInstanceFromConfig} from '../../src/config/mapping.js';
import {DEFAULT_PUBLIC_CLIENT_ID} from '../../src/defaults.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;

/** Minimal user (browser login) strategy whose token belongs to `sub`. */
function userStrategy(sub = 'dev@example.com'): UserAuthStrategy & {jwtCalls: number} {
  const strategy = {
    authMethod: 'user' as const,
    jwtCalls: 0,
    async fetch(url: string, init?: RequestInit & {dispatcher?: unknown}) {
      // The instance's TLS dispatcher is for undici; the global fetch doesn't need it here.
      const {dispatcher: _dispatcher, ...rest} = init ?? {};
      const headers: Record<string, string> = {Authorization: 'Bearer user-token'};
      if (rest.headers instanceof Headers) rest.headers.forEach((value, key) => (headers[key] = value));
      return fetch(url, {...rest, headers});
    },
    async getAuthorizationHeader() {
      return 'Bearer user-token';
    },
    async getJWT() {
      strategy.jwtCalls++;
      return {header: {}, payload: {sub}} as never;
    },
    async getTokenResponse() {
      return {} as never;
    },
    invalidateToken() {},
  };
  return strategy;
}

describe('WebDAV with an Account Manager user login', () => {
  const server = setupServer();

  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  describe('getWebDavRootPermission', () => {
    it('maps roots to Business Manager functional permissions', () => {
      expect(getWebDavRootPermission('Cartridges/v1/app')).to.equal('WebDAV_Manage_Customization');
      expect(getWebDavRootPermission('/Logs')).to.equal('WebDAV_Transfer_Files');
      expect(getWebDavRootPermission('securitylogs/x.log')).to.equal('WebDAV_Security_Logs_Access');
      expect(getWebDavRootPermission('Realmdata')).to.equal('WebDAV_Realm_Access');
      expect(getWebDavRootPermission('Unknown')).to.equal(undefined);
    });
  });

  describe('describeWebDavUserAccessFailure', () => {
    it('names the user, the root, and the permission', () => {
      const hint = describeWebDavUserAccessFailure('Cartridges/v1', 'dev@example.com');
      expect(hint).to.include('user "dev@example.com"');
      expect(hint).to.include('"Cartridges" requires the WebDAV_Manage_Customization functional permission');
    });

    it('works without a username or a known root', () => {
      const hint = describeWebDavUserAccessFailure('Other/file');
      expect(hint).to.include('the signed-in user');
      expect(hint).to.include('Check that the user has access to "Other"');
    });
  });

  describe('WebDavClient authFailureHint', () => {
    it('appends the hint to 401/403 errors only', async () => {
      const statuses: number[] = [];
      const client = new WebDavClient(TEST_HOST, new MockAuthStrategy(), {
        async authFailureHint(_path, status) {
          statuses.push(status);
          return 'HINT';
        },
      });
      server.use(
        http.get(`${BASE_URL}/Logs/denied.log`, () => new HttpResponse(null, {status: 403, statusText: 'Forbidden'})),
        http.get(`${BASE_URL}/Logs/missing.log`, () => new HttpResponse(null, {status: 404, statusText: 'Not Found'})),
      );

      const denied = await client.get('Logs/denied.log').catch((error: Error) => error);
      expect((denied as Error).message).to.equal('GET failed: 403 Forbidden. HINT');

      const missing = await client.get('Logs/missing.log').catch((error: Error) => error);
      expect((missing as Error).message).to.equal('GET failed: 404 Not Found');
      expect(statuses).to.deep.equal([403]);
    });
  });

  describe('B2CInstance webdavFallbackStrategy', () => {
    it('uses the fallback when neither Basic auth nor an API client is configured', () => {
      const fallback = userStrategy();
      const instance = new B2CInstance({hostname: TEST_HOST}, {}, {webdavFallbackStrategy: () => fallback});
      expect(instance.webdavUsesUserAuth).to.equal(false);
      void instance.webdav;
      expect(instance.webdavUsesUserAuth).to.equal(true);
    });

    it('prefers Basic auth and a configured API client over the fallback', () => {
      let created = 0;
      const factory = (): AuthStrategy => {
        created++;
        return userStrategy();
      };

      const basic = new B2CInstance(
        {hostname: TEST_HOST},
        {basic: {username: 'u', password: 'p'}},
        {webdavFallbackStrategy: factory},
      );
      void basic.webdav;
      expect(basic.webdavUsesUserAuth).to.equal(false);

      const oauth = new B2CInstance(
        {hostname: TEST_HOST},
        {oauth: {clientId: 'id', clientSecret: 'secret'}},
        {webdavFallbackStrategy: factory},
      );
      void oauth.webdav;
      expect(oauth.webdavUsesUserAuth).to.equal(false);
      expect(created).to.equal(0);
    });

    it('ignores the fallback when authMethods excludes user', () => {
      const instance = new B2CInstance(
        {hostname: TEST_HOST},
        {authMethods: ['basic', 'client-credentials']},
        {webdavFallbackStrategy: () => userStrategy()},
      );
      expect(() => instance.webdav).to.throw('OAuth credentials required');
    });

    it('names the user and missing permission on 403 but not on 401', async () => {
      const fallback = userStrategy('merchant@example.com');
      const instance = new B2CInstance({hostname: TEST_HOST}, {}, {webdavFallbackStrategy: fallback});
      server.use(
        http.put(
          `${BASE_URL}/Cartridges/v1/app.zip`,
          () => new HttpResponse(null, {status: 403, statusText: 'Forbidden'}),
        ),
        http.put(`${BASE_URL}/Temp/x.txt`, () => new HttpResponse(null, {status: 401, statusText: 'Unauthorized'})),
      );

      const denied = await instance.webdav.put('Cartridges/v1/app.zip', 'x').catch((error: Error) => error);
      expect((denied as Error).message).to.include('PUT failed: 403 Forbidden.');
      expect((denied as Error).message).to.include('user "merchant@example.com"');
      expect((denied as Error).message).to.include('WebDAV_Manage_Customization');

      const refused = await instance.webdav.put('Temp/x.txt', 'x').catch((error: Error) => error);
      expect((refused as Error).message).to.equal('PUT failed: 401 Unauthorized');
      expect(fallback.jwtCalls).to.equal(1);
    });

    it('never uses the fallback for OCAPI', () => {
      const instance = new B2CInstance({hostname: TEST_HOST}, {}, {webdavFallbackStrategy: () => userStrategy()});
      expect(() => instance.ocapi).to.throw('OAuth credentials required');
    });
  });

  describe('createInstanceFromConfig defaultWebDavClient', () => {
    it('builds a browser login with the built-in public client for WebDAV', () => {
      const instance = createInstanceFromConfig({hostname: TEST_HOST}, {defaultWebDavClient: true});
      void instance.webdav;
      expect(instance.webdavUsesUserAuth).to.equal(true);
      const auth = (instance as unknown as {_webdavAuth: {config: {clientId: string}}})._webdavAuth;
      expect(auth.config.clientId).to.equal(DEFAULT_PUBLIC_CLIENT_ID);
    });

    it('is off by default', () => {
      const instance = createInstanceFromConfig({hostname: TEST_HOST});
      expect(() => instance.webdav).to.throw('OAuth credentials required');
    });
  });
});
