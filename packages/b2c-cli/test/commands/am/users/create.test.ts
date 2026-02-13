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
import UserCreate from '../../../../src/commands/am/users/create.js';
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
 * Unit tests for user create command CLI logic.
 * Tests flag validation, output formatting.
 * SDK tests cover the actual API calls.
 */
describe('user create', () => {
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
    it('should have required flags', () => {
      expect(UserCreate.flags).to.have.property('org');
      expect(UserCreate.flags).to.have.property('mail');
      expect(UserCreate.flags).to.have.property('first-name');
      expect(UserCreate.flags).to.have.property('last-name');
      expect(UserCreate.flags.org.required).to.be.true;
      expect(UserCreate.flags.mail.required).to.be.true;
      expect(UserCreate.flags['first-name'].required).to.be.true;
      expect(UserCreate.flags['last-name'].required).to.be.true;
    });

    it('should have correct description', () => {
      expect(UserCreate.description).to.be.a('string');
      expect(UserCreate.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(UserCreate.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return created user in JSON mode', async () => {
      const command = new UserCreate([], {} as any);
      (command as any).flags = {
        org: 'org-123',
        mail: 'newuser@example.com',
        'first-name': 'John',
        'last-name': 'Doe',
      };

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);

      const mockUser = {
        id: 'user-123',
        mail: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        organizations: ['org-123'],
        primaryOrganization: 'org-123',
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json({id: 'org-123', name: 'Test Org'});
        }),
        http.post(`${BASE_URL}/users`, async ({request}) => {
          const body = (await request.json()) as {mail?: string; firstName?: string; lastName?: string};
          expect(body.mail).to.equal('newuser@example.com');
          return HttpResponse.json(mockUser, {status: 201});
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockUser);
      expect(result.mail).to.equal('newuser@example.com');
    });

    it('should return created user in non-JSON mode', async () => {
      const command = new UserCreate([], {} as any);
      (command as any).flags = {
        org: 'org-123',
        mail: 'newuser@example.com',
        'first-name': 'John',
        'last-name': 'Doe',
      };

      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);

      const mockUser = {
        id: 'user-123',
        mail: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json({id: 'org-123', name: 'Test Org'});
        }),
        http.post(`${BASE_URL}/users`, () => {
          return HttpResponse.json(mockUser, {status: 201});
        }),
        http.get(`${BASE_URL}/roles`, () => {
          return HttpResponse.json({content: []});
        }),
        http.get(`${BASE_URL}/organizations`, () => {
          return HttpResponse.json({content: []});
        }),
      );

      const result = await command.run();

      expect(result).to.deep.equal(mockUser);
    });

    it('should handle API errors', async () => {
      const command = new UserCreate([], {} as any);
      (command as any).flags = {
        org: 'org-123',
        mail: 'newuser@example.com',
        'first-name': 'John',
        'last-name': 'Doe',
      };

      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      server.use(
        http.post(OAUTH_URL, () => {
          return HttpResponse.json({
            access_token: createMockJWT({sub: 'test-client'}),
            expires_in: 1800,
          });
        }),
        http.get(`${BASE_URL}/organizations/org-123`, () => {
          return HttpResponse.json({id: 'org-123', name: 'Test Org'});
        }),
        http.post(`${BASE_URL}/users`, () => {
          return HttpResponse.json({error: {message: 'User already exists'}}, {status: 400});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('User already exists');
      }
    });
  });
});
