/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {configureLogger, resetLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {
  createAccountManagerApiClientsClient,
  buildCommerceApiClientRequest,
  buildCommerceApiRoleTenantFilter,
  generateApiClientPassword,
  provisionCommerceApiClient,
  NotPermittedError,
  ROLE_TENANT_FILTER_PATTERN,
} from '@salesforce/b2c-tooling-sdk/clients';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('clients/am-provisioning', () => {
  const server = setupServer();
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => {
    server.resetHandlers();
    resetLogger();
  });
  after(() => server.close());

  describe('generateApiClientPassword', () => {
    it('always includes every character class Account Manager checks', () => {
      for (let i = 0; i < 500; i++) {
        const password = generateApiClientPassword();
        expect(password).to.have.length(40);
        expect(password).to.match(/[A-Z]/);
        expect(password).to.match(/[a-z]/);
        expect(password).to.match(/\d/);
        expect(password).to.match(/[^A-Za-z\d]/);
      }
      expect(generateApiClientPassword()).to.not.equal(generateApiClientPassword());
    });

    it('supports the 12-128 length range only', () => {
      expect(generateApiClientPassword(12)).to.have.length(12);
      expect(generateApiClientPassword(128)).to.have.length(128);
      expect(() => generateApiClientPassword(11)).to.throw(RangeError);
      expect(() => generateApiClientPassword(129)).to.throw(RangeError);
    });
  });

  describe('buildCommerceApiRoleTenantFilter', () => {
    it('normalizes and de-duplicates tenants', () => {
      const filter = buildCommerceApiRoleTenantFilter(['f_ecom_zzpq_013', 'ZZPQ-013', 'abcd_prd']);
      expect(filter).to.equal('SALESFORCE_COMMERCE_API:zzpq_013,abcd_prd');
      expect(ROLE_TENANT_FILTER_PATTERN.test(filter)).to.equal(true);
    });

    it('rejects an empty or invalid tenant list', () => {
      expect(() => buildCommerceApiRoleTenantFilter([])).to.throw('At least one tenant');
      expect(() => buildCommerceApiRoleTenantFilter(['bad tenant!'])).to.throw('Invalid tenant IDs');
    });
  });

  describe('buildCommerceApiClientRequest', () => {
    it('builds a SALESFORCE_COMMERCE_API client body', () => {
      const body = buildCommerceApiClientRequest({
        name: '  Studio – jane – 2026-11-06 ',
        organizationId: 'org-1',
        tenants: ['zzpq_013'],
        scopes: ['sfcc.products', 'sfcc.catalogs', 'sfcc.products'],
      });
      expect(body).to.deep.include({
        name: 'Studio – jane – 2026-11-06',
        organizations: ['org-1'],
        active: true,
        roles: ['SALESFORCE_COMMERCE_API'],
        roleTenantFilter: 'SALESFORCE_COMMERCE_API:zzpq_013',
        scopes: ['sfcc.products', 'sfcc.catalogs'],
        defaultScopes: ['sfcc.products', 'sfcc.catalogs'],
        tokenEndpointAuthMethod: 'client_secret_post',
      });
      expect(body.password).to.have.length(40);
    });

    it('validates name, organization and password', () => {
      const base = {name: 'x', organizationId: 'o', tenants: ['zzpq_013'], scopes: []};
      expect(() => buildCommerceApiClientRequest({...base, name: ' '})).to.throw('name is required');
      expect(() => buildCommerceApiClientRequest({...base, organizationId: ''})).to.throw('Organization ID');
      expect(() => buildCommerceApiClientRequest({...base, password: 'short'})).to.throw('12-128');
    });
  });

  describe('provisionCommerceApiClient', () => {
    it('creates the client, returns the secret once and never logs it', async () => {
      const lines: string[] = [];
      configureLogger({
        level: 'trace',
        json: true,
        destination: {write: (line: string | Buffer) => lines.push(String(line)) > 0},
      });
      let received: Record<string, unknown> | undefined;
      server.use(
        http.post(`${BASE_URL}/apiclients`, async ({request}) => {
          received = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({id: 'new-client-id', name: received.name, active: true});
        }),
      );
      const client = createAccountManagerApiClientsClient({hostname: TEST_HOST}, new MockAuthStrategy());
      const result = await provisionCommerceApiClient(client, {
        name: 'Studio',
        organizationId: 'org-1',
        tenants: ['zzpq_013'],
        scopes: ['sfcc.products'],
      });

      expect(result.clientId).to.equal('new-client-id');
      expect(result.clientSecret).to.equal(received!.password);
      expect(received).to.deep.include({
        roles: ['SALESFORCE_COMMERCE_API'],
        roleTenantFilter: 'SALESFORCE_COMMERCE_API:zzpq_013',
        tokenEndpointAuthMethod: 'client_secret_post',
      });
      expect(lines.length).to.be.greaterThan(0);
      expect(lines.join('\n')).to.not.include(result.clientSecret);
    });

    it('maps a 403 to NotPermittedError', async () => {
      server.use(
        http.post(`${BASE_URL}/apiclients`, () =>
          HttpResponse.json({errors: [{message: 'Access is denied'}]}, {status: 403}),
        ),
      );
      const client = createAccountManagerApiClientsClient({hostname: TEST_HOST}, new MockAuthStrategy());
      try {
        await provisionCommerceApiClient(client, {name: 'x', organizationId: 'o', tenants: ['zzpq_013'], scopes: []});
        expect.fail('expected NotPermittedError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotPermittedError);
        expect((error as NotPermittedError).status).to.equal(403);
        expect((error as Error).message).to.include('Access is denied');
      }
    });
  });
});
