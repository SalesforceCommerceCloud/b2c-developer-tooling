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
import ClientGet from '../../../../src/commands/am/clients/get.js';
import {
  stubCommandConfigAndLogger,
  stubJsonEnabled,
  stubImplicitOAuthStrategy,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('am clients get', () => {
  const server = setupServer();

  const mockClient = {
    id: 'client-123',
    name: 'My API Client',
    description: 'Test description',
    active: true,
    tokenEndpointAuthMethod: 'client_secret_basic',
    createdAt: '2025-01-01T00:00:00.000Z',
    redirectUrls: ['https://example.com/callback'],
    scopes: ['openid'],
    defaultScopes: [],
    versionControl: false,
    passwordModificationTimestamp: null,
  };

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
      expect(ClientGet.args).to.have.property('api-client-id');
      expect(ClientGet.args['api-client-id'].required).to.be.true;
    });

    it('should have correct description', () => {
      expect(ClientGet.description).to.be.a('string');
      expect(ClientGet.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(ClientGet.enableJsonFlag).to.be.true;
    });
  });

  describe('expand validation', () => {
    it('should reject invalid expand value', async () => {
      const command = new ClientGet([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {expand: 'invalid,organizations'};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Invalid expand value|organizations, roles/);
      }
    });
  });

  describe('output formatting', () => {
    it('should return client data in JSON mode', async () => {
      const command = new ClientGet([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.get(`${BASE_URL}/apiclients/client-123`, () => {
          return HttpResponse.json(mockClient);
        }),
      );

      const result = await command.run();

      expect(result.id).to.equal('client-123');
      expect(result.name).to.equal('My API Client');
      expect(result.redirectUrls).to.deep.equal(['https://example.com/callback']);
    });

    it('should display client details in non-JSON mode', async () => {
      const command = new ClientGet([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);
      stubImplicitOAuthStrategy(command);

      const fullClient = {
        ...mockClient,
        organizations: ['org-1', {id: 'org-2'}],
        roles: ['ADMIN', {roleEnumName: 'USER', id: 'user-role'}],
        roleTenantFilterMap: {ADMIN: 'f_ecom_zzxy_prd'},
        roleTenantFilter: '',
        defaultScopes: ['openid'],
        versionControl: ['v1'],
        disabledTimestamp: null,
        lastAuthenticatedDate: '2025-01-15',
        passwordModificationTimestamp: 1_706_200_000_000,
      };

      server.use(
        http.get(`${BASE_URL}/apiclients/client-123`, () => {
          return HttpResponse.json(fullClient);
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('client-123');
    });

    it('should display client with minimal fields in non-JSON mode', async () => {
      const command = new ClientGet([], {} as any);
      (command as any).args = {'api-client-id': 'client-456'};
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, false);
      stubImplicitOAuthStrategy(command);

      const minimalClient = {
        id: 'client-456',
        name: 'Minimal Client',
        active: false,
        redirectUrls: [],
        scopes: [],
        defaultScopes: [],
        organizations: [],
        roles: [],
        roleTenantFilterMap: {},
        roleTenantFilter: 'ADMIN:zzxy_prd',
      };

      server.use(
        http.get(`${BASE_URL}/apiclients/client-456`, () => {
          return HttpResponse.json(minimalClient);
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('client-456');
    });

    it('should handle valid expand flag', async () => {
      const command = new ClientGet([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {expand: 'organizations,roles'};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.get(`${BASE_URL}/apiclients/client-123`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('expand')).to.include('organizations');
          return HttpResponse.json(mockClient);
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('client-123');
    });

    it('should error when API client not found', async () => {
      const command = new ClientGet([], {} as any);
      (command as any).args = {'api-client-id': 'nonexistent'};
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.get(`${BASE_URL}/apiclients/nonexistent`, () => {
          return HttpResponse.json({error: {message: 'Not found'}}, {status: 404});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/not found|API client nonexistent not found/);
      }
    });
  });
});
