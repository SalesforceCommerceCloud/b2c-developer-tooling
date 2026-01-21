/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
/* eslint-disable @typescript-eslint/no-explicit-any */
import UserGet from '../../../src/commands/user/get.js';
import {stubCommandConfigAndLogger, stubJsonEnabled, makeCommandThrowOnError} from '../../helpers/user.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;
const OAUTH_URL = `https://${TEST_HOST}/dwsso/oauth2/access_token`;

function createMockJWT(payload: Record<string, unknown> = {}): string {
  const header = {alg: 'HS256', typ: 'JWT'};
  const defaultPayload = {sub: 'test-client', iat: Math.floor(Date.now() / 1000), ...payload};
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(defaultPayload)).toString('base64url');
  return `${headerB64}.${payloadB64}.signature`;
}

/**
 * Unit tests for user get command CLI logic.
 * Tests output formatting.
 * SDK tests cover the actual API calls.
 */
describe('user get', () => {
  const server = setupServer();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    server.resetHandlers();
  });

  after(() => {
    server.close();
  });

  describe('command structure', () => {
    it('should require login as argument', () => {
      expect(UserGet.args).to.have.property('login');
      expect(UserGet.args.login.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(UserGet.description).to.be.a('string');
      expect(UserGet.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(UserGet.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return user data in JSON mode', async () => {
      const command = new UserGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {login: 'user@example.com'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const mockUser = {
        id: 'user-123',
        mail: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        userState: 'ACTIVE',
        primaryOrganization: 'org-123',
        passwordExpirationTimestamp: null,
        verifiers: [],
        linkedToSfIdentity: false,
        lastLoginDate: '2025-01-01',
        createdAt: 1_234_567_890,
        lastModified: 1_234_567_890,
        roles: ['bm-admin'],
        organizations: ['org-123'],
        roleTenantFilterMap: {
          'bm-admin': 'tenant1,tenant2',
        },
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, () => {
          // findUserByLogin searches through pages and filters by mail
          return HttpResponse.json({content: [mockUser]});
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockUser);
      expect(result.mail).to.equal('user@example.com');
    });

    it('should return user data in non-JSON mode', async () => {
      const command = new UserGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {login: 'user@example.com'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockUser = {
        id: 'user-123',
        mail: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userState: 'ACTIVE',
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, () => {
          // findUserByLogin searches through pages and filters by mail
          return HttpResponse.json({content: [mockUser]});
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockUser);
    });

    it('should handle API errors', async () => {
      const command = new UserGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {login: 'nonexistent@example.com'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, () => {
          // findUserByLogin searches through pages - return empty result
          return HttpResponse.json({content: []});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('not found');
      }
    });
  });
});
