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
import UserDelete from '../../../src/commands/user/delete.js';
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
 * Unit tests for user delete command CLI logic.
 * Tests flag validation, output formatting.
 * SDK tests cover the actual API calls.
 */
describe('user delete', () => {
  const server = setupServer();

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
    it('should require login as argument', () => {
      expect(UserDelete.args).to.have.property('login');
      expect(UserDelete.args.login.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(UserDelete.description).to.be.a('string');
      expect(UserDelete.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(UserDelete.enableJsonFlag).to.be.true;
    });
  });

  describe('validation', () => {
    it('should error when user has no ID', async () => {
      const command = new UserDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {login: 'user@example.com'},
        configurable: true,
      });

      (command as any).flags = {purge: false};

      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      const mockUser = {
        mail: 'user@example.com',
        id: undefined,
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

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/User does not have an ID/);
      }
    });
  });

  describe('output formatting', () => {
    it('should delete user (soft delete)', async () => {
      const command = new UserDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {login: 'user@example.com'},
        configurable: true,
      });

      (command as any).flags = {purge: false};

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockUser = {
        id: 'user-123',
        mail: 'user@example.com',
      };

      let deleteCalled = false;

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
        http.post(`${BASE_URL}/users/user-123/disable`, () => {
          deleteCalled = true;
          return HttpResponse.json({});
        }),
      );

      await command.run();

      expect(deleteCalled).to.be.true;
    });

    it('should purge user (hard delete)', async () => {
      const command = new UserDelete([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {login: 'user@example.com'},
        configurable: true,
      });

      (command as any).flags = {purge: true};

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockUser = {
        id: 'user-123',
        mail: 'user@example.com',
      };

      let purgeCalled = false;

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
        http.delete(`${BASE_URL}/users/user-123`, () => {
          purgeCalled = true;
          return HttpResponse.json({});
        }),
      );

      await command.run();

      expect(purgeCalled).to.be.true;
    });
  });
});
