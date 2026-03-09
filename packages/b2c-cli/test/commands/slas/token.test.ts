/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import SlasToken from '../../../src/commands/slas/token.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../helpers/stub-parse.js';

const SHORT_CODE = 'kv7kzm78';
const ORG_ID = 'f_ecom_abcd_123';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${ORG_ID}`;

// A valid 3-part JWT for testing decodedJWT output
const JWT_HEADER = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
const JWT_PAYLOAD_OBJ = {sub: 'cc-slas::abcd_123:scid:my-client::usid:mock-usid', iss: 'slas', exp: 9_999_999_999};
const JWT_PAYLOAD = Buffer.from(JSON.stringify(JWT_PAYLOAD_OBJ)).toString('base64');
const MOCK_JWT = `${JWT_HEADER}.${JWT_PAYLOAD}.fake-signature`;

const MOCK_TOKEN_RESPONSE = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 1800,
  token_type: 'Bearer',
  usid: 'mock-usid',
  customer_id: 'mock-customer-id',
};

describe('slas token', () => {
  let config: Config;
  const server = setupServer();

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasToken([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  function stubErrorToThrow(command: any) {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  before(() => {
    server.listen({onUnhandledRequest: 'bypass'});
  });

  afterEach(() => {
    server.resetHandlers();
    sinon.restore();
    restoreConfig();
  });

  after(() => {
    server.close();
  });

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  describe('with explicit slas-client-id (no auto-discovery)', () => {
    it('returns guest token in JSON mode via PKCE flow', async () => {
      // Mock the SLAS authorize and token endpoints
      server.use(
        http.get(`${BASE_URL}/oauth2/authorize`, () => {
          return new HttpResponse(null, {
            status: 303,
            headers: {Location: 'http://localhost:3000/callback?code=test-code&usid=test-usid'},
          });
        }),
        http.post(`${BASE_URL}/oauth2/token`, () => {
          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'slas-client-id': 'my-client',
        'site-id': 'RefArch',
        'short-code': SHORT_CODE,
      });

      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.response.accessToken).to.equal('mock-access-token');
      expect(result.response.refreshToken).to.equal('mock-refresh-token');
      expect(result.response.expiresIn).to.equal(1800);
      expect(result.clientId).to.equal('my-client');
      expect(result.siteId).to.equal('RefArch');
      expect(result.isGuest).to.equal(true);
    });

    it('includes decodedJWT in JSON output when access_token is a valid JWT', async () => {
      server.use(
        http.get(`${BASE_URL}/oauth2/authorize`, () => {
          return new HttpResponse(null, {
            status: 303,
            headers: {Location: 'http://localhost:3000/callback?code=test-code&usid=test-usid'},
          });
        }),
        http.post(`${BASE_URL}/oauth2/token`, () => {
          return HttpResponse.json({...MOCK_TOKEN_RESPONSE, access_token: MOCK_JWT});
        }),
      );

      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'slas-client-id': 'my-client',
        'site-id': 'RefArch',
        'short-code': SHORT_CODE,
      });

      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.decodedJWT).to.deep.equal(JWT_PAYLOAD_OBJ);
    });

    it('omits decodedJWT when access_token is not a valid JWT', async () => {
      server.use(
        http.get(`${BASE_URL}/oauth2/authorize`, () => {
          return new HttpResponse(null, {
            status: 303,
            headers: {Location: 'http://localhost:3000/callback?code=test-code&usid=test-usid'},
          });
        }),
        http.post(`${BASE_URL}/oauth2/token`, () => {
          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'slas-client-id': 'my-client',
        'site-id': 'RefArch',
        'short-code': SHORT_CODE,
      });

      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.decodedJWT).to.be.undefined;
    });

    it('returns guest token via client_credentials when secret provided', async () => {
      server.use(
        http.post(`${BASE_URL}/oauth2/token`, () => {
          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'slas-client-id': 'my-client',
        'slas-client-secret': 'my-secret',
        'site-id': 'RefArch',
        'short-code': SHORT_CODE,
      });

      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.response.accessToken).to.equal('mock-access-token');
      expect(result.isGuest).to.equal(true);
    });
  });

  describe('auto-discovery', () => {
    it('errors when no public client found', async () => {
      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'site-id': 'RefArch',
        'short-code': SHORT_CODE,
      });

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

      // Mock SLAS admin client — all private clients
      const getStub = sinon.stub().resolves({
        data: {
          data: [
            {
              clientId: 'private-client',
              name: 'Private Client',
              isPrivateClient: true,
              channels: ['RefArch'],
              redirectUri: ['http://localhost:3000/callback'],
              scopes: '',
            },
          ],
        },
        error: undefined,
        response: {status: 200},
      });
      sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);

      const errorStub = stubErrorToThrow(command);

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const errorMessage = errorStub.firstCall.args[0];
        expect(errorMessage).to.include('No public SLAS client found');
      }
    });
  });

  describe('missing required flags', () => {
    it('errors when site-id is missing and no auto-discovery', async () => {
      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'slas-client-id': 'my-client',
        'short-code': SHORT_CODE,
        // no site-id
      });

      const errorStub = stubErrorToThrow(command);

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const errorMessage = errorStub.firstCall.args[0];
        expect(errorMessage).to.include('site-id');
      }
    });

    it('errors when short-code is missing', async () => {
      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'slas-client-id': 'my-client',
        'site-id': 'RefArch',
        // no short-code — isolateConfig() ensures no dw.json or env var provides it
      });

      const errorStub = stubErrorToThrow(command);

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const errorMessage = errorStub.firstCall.args[0];
        expect(errorMessage).to.include('short code');
      }
    });
  });

  describe('registered customer flow', () => {
    it('uses registered token flow when shopper-login is provided', async () => {
      // Mock the SLAS login and token endpoints
      server.use(
        http.post(`${BASE_URL}/oauth2/login`, () => {
          return new HttpResponse(null, {
            status: 303,
            headers: {Location: 'http://localhost:3000/callback?code=reg-code&usid=reg-usid'},
          });
        }),
        http.post(`${BASE_URL}/oauth2/token`, () => {
          return HttpResponse.json(MOCK_TOKEN_RESPONSE);
        }),
      );

      const command: any = await createCommand({
        'tenant-id': 'abcd_123',
        'slas-client-id': 'my-client',
        'site-id': 'RefArch',
        'short-code': SHORT_CODE,
        'shopper-login': 'user@example.com',
        'shopper-password': 'secret123',
      });

      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.isGuest).to.equal(false);
      expect(result.response.accessToken).to.equal('mock-access-token');
    });
  });
});
