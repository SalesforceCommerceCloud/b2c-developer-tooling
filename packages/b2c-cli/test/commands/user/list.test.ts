/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import UserList from '../../../src/commands/user/list.js';
import {stubCommandConfigAndLogger, stubJsonEnabled, makeCommandThrowOnError} from '../../helpers/test-setup.js';

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
 * Unit tests for user list command CLI logic.
 * Tests column selection, pagination validation, output formatting.
 * SDK tests cover the actual API calls.
 */
describe('user list', () => {
  const server = setupServer();

  const mockUsers = [
    {
      id: 'user-1',
      mail: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userState: 'ACTIVE',
      passwordExpirationTimestamp: null,
      verifiers: [],
      linkedToSfIdentity: false,
      lastLoginDate: '2025-01-01',
    },
    {
      id: 'user-2',
      mail: 'user2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      userState: 'INITIAL',
      passwordExpirationTimestamp: Date.now() - 1000,
      verifiers: [{id: 'verifier-1'}],
      linkedToSfIdentity: true,
      lastLoginDate: null,
    },
  ];

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    server.resetHandlers();
    restoreConfig();
  });

  after(() => {
    server.close();
  });

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(UserList.description).to.be.a('string');
      expect(UserList.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(UserList.enableJsonFlag).to.be.true;
    });
  });

  describe('getSelectedColumns', () => {
    it('should return default columns when no flags provided', () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal([
        'mail',
        'firstName',
        'lastName',
        'userState',
        'passwordExpired',
        'twoFAEnabled',
        'linkedToSfIdentity',
        'lastLoginDate',
      ]);
    });

    it('should return all columns when --extended flag is set', () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {extended: true};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.include('mail');
      expect(columns).to.include('roles');
      expect(columns).to.include('organizations');
    });

    it('should return custom columns when --columns flag is set', () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {columns: 'mail,firstName,userState'};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal(['mail', 'firstName', 'userState']);
    });
  });

  describe('pagination validation', () => {
    it('should validate size parameter - minimum', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {size: 0};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Page size must be between 1 and 4000/);
      }
    });

    it('should validate size parameter - maximum', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {size: 5000};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Page size must be between 1 and 4000/);
      }
    });

    it('should validate page parameter - negative', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {page: -1};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Page number must be a non-negative integer/);
      }
    });
  });

  describe('output formatting', () => {
    it('should return user collection in JSON mode', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.json({content: mockUsers});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.not.be.undefined;
      expect(result.content).to.have.lengthOf(2);
      expect(result.content![0].mail).to.equal('user1@example.com');
    });

    it('should handle empty results', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      const result = await command.run();

      expect(result.content).to.deep.equal([]);
    });

    it('should return data in non-JSON mode', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, () => {
          return HttpResponse.json({content: mockUsers});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });

    it('should use default pagination when not specified', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      let capturedSize: null | string = null;
      let capturedPage: null | string = null;

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, ({request}) => {
          const url = new URL(request.url);
          capturedSize = url.searchParams.get('size');
          capturedPage = url.searchParams.get('page');
          return HttpResponse.json({content: []});
        }),
      );

      await command.run();

      expect(capturedSize).to.equal('20');
      expect(capturedPage).to.equal('0');
    });

    it('should pass custom pagination parameters', async () => {
      const command = new UserList([], {} as any);
      (command as any).flags = {size: 50, page: 2};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      let capturedSize: null | string = null;
      let capturedPage: null | string = null;

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/users`, ({request}) => {
          const url = new URL(request.url);
          capturedSize = url.searchParams.get('size');
          capturedPage = url.searchParams.get('page');
          return HttpResponse.json({content: []});
        }),
      );

      await command.run();

      expect(capturedSize).to.equal('50');
      expect(capturedPage).to.equal('2');
    });
  });
});
