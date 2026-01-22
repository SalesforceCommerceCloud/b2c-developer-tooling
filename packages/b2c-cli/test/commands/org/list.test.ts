/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import OrgList from '../../../src/commands/org/list.js';
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
 * Unit tests for org list command CLI logic.
 * Tests column selection, pagination validation, output formatting.
 * SDK tests cover the actual API calls.
 */
describe('org list', () => {
  const server = setupServer();

  const mockOrgs = [
    {
      id: 'org-1',
      name: 'Organization 1',
      realms: ['realm1', 'realm2'],
      emailsDomains: ['example.com'],
      twoFARoles: ['role1'],
      twoFAEnabled: true,
      allowedVerifierTypes: ['TOTP'],
      vaasEnabled: false,
      sfIdentityFederation: true,
      passwordMinEntropy: 8,
    },
    {
      id: 'org-2',
      name: 'Organization 2',
      realms: ['realm3'],
      emailsDomains: ['test.com', 'example.org'],
      twoFARoles: [],
      twoFAEnabled: false,
      allowedVerifierTypes: [],
      vaasEnabled: true,
      sfIdentityFederation: false,
      passwordMinEntropy: 12,
    },
  ];

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
    it('should have correct description', () => {
      expect(OrgList.description).to.be.a('string');
      expect(OrgList.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(OrgList.enableJsonFlag).to.be.true;
    });
  });

  describe('pagination validation', () => {
    it('should validate size parameter - minimum', async () => {
      const command = new OrgList([], {} as any);
      (command as any).flags = {size: 0};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Size must be at least 1/);
      }
    });

    it('should validate size parameter - maximum', async () => {
      const command = new OrgList([], {} as any);
      (command as any).flags = {size: 5001};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Size cannot exceed 5000/);
      }
    });

    it('should validate page parameter - negative', async () => {
      const command = new OrgList([], {} as any);
      (command as any).flags = {page: -1};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Page must be a non-negative integer/);
      }
    });
  });

  describe('output formatting', () => {
    it('should return organization collection in JSON mode', async () => {
      const command = new OrgList([], {} as any);
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
        http.get(`${BASE_URL}/organizations`, () => {
          return HttpResponse.json({content: mockOrgs, totalElements: 2, totalPages: 1, number: 0, size: 25});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.not.be.undefined;
      expect(result.content).to.have.lengthOf(2);
      expect(result.content![0].id).to.equal('org-1');
      expect(result.content![0].name).to.equal('Organization 1');
    });

    it('should handle empty results', async () => {
      const command = new OrgList([], {} as any);
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
        http.get(`${BASE_URL}/organizations`, () => {
          return HttpResponse.json({content: [], totalElements: 0, totalPages: 0, number: 0, size: 25});
        }),
      );

      const result = await command.run();

      expect(result.content).to.deep.equal([]);
    });

    it('should return data in non-JSON mode', async () => {
      const command = new OrgList([], {} as any);
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
        http.get(`${BASE_URL}/organizations`, () => {
          return HttpResponse.json({content: mockOrgs, totalElements: 2, totalPages: 1, number: 0, size: 25});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });

    it('should use default pagination when not specified', async () => {
      const command = new OrgList([], {} as any);
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
        http.get(`${BASE_URL}/organizations`, ({request}) => {
          const url = new URL(request.url);
          capturedSize = url.searchParams.get('size');
          capturedPage = url.searchParams.get('page');
          return HttpResponse.json({content: [], totalElements: 0, totalPages: 0, number: 0, size: 25});
        }),
      );

      await command.run();

      expect(capturedSize).to.equal('25');
      expect(capturedPage).to.equal('0');
    });

    it('should pass custom pagination parameters', async () => {
      const command = new OrgList([], {} as any);
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
        http.get(`${BASE_URL}/organizations`, ({request}) => {
          const url = new URL(request.url);
          capturedSize = url.searchParams.get('size');
          capturedPage = url.searchParams.get('page');
          return HttpResponse.json({content: [], totalElements: 0, totalPages: 0, number: 2, size: 50});
        }),
      );

      await command.run();

      expect(capturedSize).to.equal('50');
      expect(capturedPage).to.equal('2');
    });

    it('should use max page size when --all flag is set', async () => {
      const command = new OrgList([], {} as any);
      (command as any).flags = {all: true};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      let capturedSize: null | string = null;

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations`, ({request}) => {
          const url = new URL(request.url);
          capturedSize = url.searchParams.get('size');
          return HttpResponse.json({content: [], totalElements: 0, totalPages: 0, number: 0, size: 5000});
        }),
      );

      await command.run();

      expect(capturedSize).to.equal('5000');
    });

    it('should handle column selection with --columns flag', async () => {
      const command = new OrgList([], {} as any);
      (command as any).flags = {columns: 'id,name,realms'};
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
        http.get(`${BASE_URL}/organizations`, () => {
          return HttpResponse.json({content: mockOrgs, totalElements: 2, totalPages: 1, number: 0, size: 25});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });

    it('should handle extended columns with --extended flag', async () => {
      const command = new OrgList([], {} as any);
      (command as any).flags = {extended: true};
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
        http.get(`${BASE_URL}/organizations`, () => {
          return HttpResponse.json({content: mockOrgs, totalElements: 2, totalPages: 1, number: 0, size: 25});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(2);
    });
  });
});
