/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import OrgGet from '../../../src/commands/org/get.js';
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
 * Unit tests for org get command CLI logic.
 * Tests output formatting, error handling.
 * SDK tests cover the actual API calls.
 */
describe('org get', () => {
  const server = setupServer();

  const mockOrg = {
    id: 'org-123',
    name: 'Test Organization',
    realms: ['realm1', 'realm2'],
    emailsDomains: ['example.com'],
    twoFARoles: ['role1', 'role2'],
    twoFAEnabled: true,
    allowedVerifierTypes: ['TOTP', 'SMS'],
    vaasEnabled: false,
    sfIdentityFederation: true,
    passwordMinEntropy: 8,
    passwordHistorySize: 5,
    passwordDaysExpiration: 90,
    contactUsers: ['user-1', 'user-2'],
    sfAccountIds: ['account-1', 'account-2'],
  };

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
    it('should require org as argument', () => {
      expect(OrgGet.args).to.have.property('org');
      expect(OrgGet.args.org.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(OrgGet.description).to.be.a('string');
      expect(OrgGet.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(OrgGet.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return organization data in JSON mode', async () => {
      const command = new OrgGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockOrg);
      expect(result.id).to.equal('org-123');
      expect(result.name).to.equal('Test Organization');
    });

    it('should return organization data in non-JSON mode', async () => {
      const command = new OrgGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(mockOrg);
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockOrg);
    });

    it('should get organization by name when ID lookup fails', async () => {
      const command = new OrgGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'Test Organization'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/Test%20Organization`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: [mockOrg]});
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockOrg);
      expect(result.name).to.equal('Test Organization');
    });

    it('should handle 404 errors with custom message', async () => {
      const command = new OrgGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'nonexistent-org'},
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
        http.get(`${BASE_URL}/organizations/nonexistent-org`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
        http.get(`${BASE_URL}/organizations/search/findByName`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).to.include('not found');
      }
    });

    it('should handle organization with password policy attributes', async () => {
      const command = new OrgGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const orgWithPasswordPolicy = {
        ...mockOrg,
        passwordMinEntropy: 10,
        passwordHistorySize: 3,
        passwordDaysExpiration: 60,
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(orgWithPasswordPolicy);
        }),
      );

      const result = await command.run();

      expect(result.passwordMinEntropy).to.equal(10);
      expect(result.passwordHistorySize).to.equal(3);
      expect(result.passwordDaysExpiration).to.equal(60);
    });

    it('should handle organization without password policy attributes', async () => {
      const command = new OrgGet([], {} as any);

      Object.defineProperty(command, 'args', {
        value: {org: 'org-123'},
        configurable: true,
      });

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const orgWithoutPasswordPolicy = {
        ...mockOrg,
        passwordMinEntropy: undefined,
        passwordHistorySize: undefined,
        passwordDaysExpiration: undefined,
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
            scope: 'sfcc.accountmanager.user.manage',
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json(orgWithoutPasswordPolicy);
        }),
      );

      const result = await command.run();

      expect(result.passwordMinEntropy).to.be.undefined;
      expect(result.passwordHistorySize).to.be.undefined;
      expect(result.passwordDaysExpiration).to.be.undefined;
    });
  });
});
