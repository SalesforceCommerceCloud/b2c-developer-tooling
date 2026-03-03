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
import ClientUpdate from '../../../../src/commands/am/clients/update.js';
import {
  stubCommandConfigAndLogger,
  stubJsonEnabled,
  stubImplicitOAuthStrategy,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('am clients update', () => {
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
    it('should require api-client-id as argument', () => {
      expect(ClientUpdate.args).to.have.property('api-client-id');
      expect(ClientUpdate.args['api-client-id'].required).to.be.true;
    });

    it('should have correct description', () => {
      expect(ClientUpdate.description).to.be.a('string');
      expect(ClientUpdate.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(ClientUpdate.enableJsonFlag).to.be.true;
    });
  });

  describe('validation', () => {
    it('should error when no flags provided', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/No changes specified/);
      }
    });

    it('should error when name exceeds 200 chars', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {name: 'a'.repeat(201)};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/at most 200 characters/);
      }
    });

    it('should error when description exceeds 256 chars', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {description: 'a'.repeat(257)};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/at most 256 characters/);
      }
    });

    it('should error on invalid role-tenant-filter', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {'role-tenant-filter': 'INVALID FORMAT!!'};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Role tenant filter must match pattern/);
      }
    });
  });

  describe('output formatting', () => {
    it('should return updated client in JSON mode', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {name: 'Updated Name'};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);
      stubImplicitOAuthStrategy(command);

      const mockUpdated = {
        id: 'client-123',
        name: 'Updated Name',
        description: 'Desc',
        active: true,
        tokenEndpointAuthMethod: 'client_secret_basic',
      };

      server.use(
        http.put(`${BASE_URL}/apiclients/client-123`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.name).to.equal('Updated Name');
          expect(body).to.not.have.property('active');
          return HttpResponse.json(mockUpdated);
        }),
      );

      const result = await command.run();

      expect(result.id).to.equal('client-123');
      expect(result.name).to.equal('Updated Name');
    });

    it('should handle all update flags', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {
        name: 'New Name',
        description: 'New desc',
        organizations: 'org-1,org-2',
        roles: 'role-1,role-2',
        'role-tenant-filter': 'SALESFORCE_COMMERCE_API:abcd_prd',
        active: true,
        'redirect-urls': 'https://a.com,https://b.com',
        scopes: 'openid,mail',
        'default-scopes': 'openid',
        'version-control': 'v1',
        'token-endpoint-auth-method': 'client_secret_post',
        'jwt-public-key': '  some-key  ',
      };
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.put(`${BASE_URL}/apiclients/client-123`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.name).to.equal('New Name');
          expect(body.active).to.equal(true);
          expect(body.organizations).to.deep.equal(['org-1', 'org-2']);
          expect(body.roles).to.deep.equal(['role-1', 'role-2']);
          expect(body.scopes).to.deep.equal(['openid', 'mail']);
          expect(body.defaultScopes).to.deep.equal(['openid']);
          expect(body.redirectUrls).to.deep.equal(['https://a.com', 'https://b.com']);
          expect(body.tokenEndpointAuthMethod).to.equal('client_secret_post');
          expect(body.jwtPublicKey).to.equal('some-key');
          return HttpResponse.json({id: 'client-123', ...body});
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('client-123');
    });

    it('should handle empty jwt-public-key as null', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {'jwt-public-key': ''};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.put(`${BASE_URL}/apiclients/client-123`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.jwtPublicKey).to.equal(null);
          return HttpResponse.json({id: 'client-123'});
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('client-123');
    });
  });
});
