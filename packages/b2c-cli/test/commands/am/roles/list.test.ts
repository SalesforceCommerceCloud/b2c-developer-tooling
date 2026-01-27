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
import RoleList from '../../../../src/commands/am/roles/list.js';
import {stubCommandConfigAndLogger, stubJsonEnabled, makeCommandThrowOnError} from '../../../helpers/test-setup.js';

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
 * Unit tests for role list command CLI logic.
 * Tests column selection, pagination validation, output formatting.
 * SDK tests cover the actual API calls.
 */
describe('role list', () => {
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
    it('should have correct description', () => {
      expect(RoleList.description).to.be.a('string');
      expect(RoleList.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(RoleList.enableJsonFlag).to.be.true;
    });
  });

  describe('getSelectedColumns', () => {
    it('should return default columns when no flags provided', () => {
      const command = new RoleList([], {} as any);
      (command as any).flags = {};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal(['id', 'description', 'roleEnumName']);
    });

    it('should return all columns when --extended flag is set', () => {
      const command = new RoleList([], {} as any);
      (command as any).flags = {extended: true};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.include('id');
      expect(columns).to.include('permissions');
    });

    it('should return custom columns when --columns flag is set', () => {
      const command = new RoleList([], {} as any);
      (command as any).flags = {columns: 'id,description,scope'};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal(['id', 'description', 'scope']);
    });
  });

  describe('pagination validation', () => {
    it('should validate size parameter - minimum', async () => {
      const command = new RoleList([], {} as any);
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
      const command = new RoleList([], {} as any);
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
      const command = new RoleList([], {} as any);
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
    it('should return role collection in JSON mode', async () => {
      const command = new RoleList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      const mockRoles = {
        content: [
          {
            id: 'bm-admin',
            description: 'Business Manager Administrator',
            roleEnumName: 'ECOM_ADMIN',
            scope: 'INSTANCE',
            targetType: 'User',
            twoFAEnabled: false,
            permissions: ['permission1', 'permission2'],
          },
          {
            id: 'bm-user',
            description: 'Business Manager User',
            roleEnumName: 'ECOM_USER',
            scope: 'INSTANCE',
            targetType: 'User',
            twoFAEnabled: true,
            permissions: [],
          },
        ],
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('size')).to.equal('20');
          expect(url.searchParams.get('page')).to.equal('0');
          return HttpResponse.json(mockRoles);
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
      expect(result.content![0].id).to.equal('bm-admin');
    });

    it('should handle empty results', async () => {
      const command = new RoleList([], {} as any);
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
        http.get(`${BASE_URL}/roles`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      const result = await command.run();

      expect(result.content).to.deep.equal([]);
    });

    it('should pass target type filter', async () => {
      const command = new RoleList([], {} as any);
      (command as any).flags = {'target-type': 'User'};
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
        http.get(`${BASE_URL}/roles`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('roleTargetType')).to.equal('User');
          return HttpResponse.json({content: []});
        }),
      );

      await command.run();
    });
  });
});
