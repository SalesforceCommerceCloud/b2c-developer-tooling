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
import RoleGet from '../../../src/commands/role/get.js';
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
 * Unit tests for role get command CLI logic.
 * Tests output formatting.
 * SDK tests cover the actual API calls.
 */
describe('role get', () => {
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
    it('should require roleId as argument', () => {
      expect(RoleGet.args).to.have.property('roleId');
      expect(RoleGet.args.roleId.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(RoleGet.description).to.be.a('string');
      expect(RoleGet.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(RoleGet.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return role data in JSON mode', async () => {
      const command = new RoleGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {roleId: 'bm-admin'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const mockRole = {
        id: 'bm-admin',
        description: 'Business Manager Administrator',
        roleEnumName: 'ECOM_ADMIN',
        scope: 'INSTANCE',
        targetType: 'User',
        twoFAEnabled: false,
        permissions: ['permission1', 'permission2'],
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/roles/bm-admin`, () => {
          return HttpResponse.json(mockRole);
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockRole);
      expect(result.id).to.equal('bm-admin');
    });

    it('should return role data in non-JSON mode', async () => {
      const command = new RoleGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {roleId: 'bm-admin'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockRole = {
        id: 'bm-admin',
        description: 'Business Manager Administrator',
        roleEnumName: 'ECOM_ADMIN',
        scope: 'INSTANCE',
        targetType: 'User',
        twoFAEnabled: false,
        permissions: ['permission1'],
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/roles/bm-admin`, () => {
          return HttpResponse.json(mockRole);
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockRole);
    });

    it('should handle API errors', async () => {
      const command = new RoleGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {roleId: 'nonexistent'},
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
        http.get(`${BASE_URL}/roles/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'Role not found'}}, {status: 404});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        // The error should either be the custom 404 message or the API error message
        expect(errorMessage).to.include('not found');
      }
    });
  });
});
