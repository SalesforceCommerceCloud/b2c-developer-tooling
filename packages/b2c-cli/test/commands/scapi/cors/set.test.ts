/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ScapiCorsSet from '../../../../src/commands/scapi/cors/set.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

const VALID_FLAGS = {
  'tenant-id': 'zzxy_prd',
  'site-id': 'RefArch',
  'client-id': 'abc-123',
  origins: 'http://foo.com',
};

const RESOLVED_CONFIG = {values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', clientId: 'abc-123'}};

describe('scapi cors set', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('client-id validation', () => {
    it('calls command.error when client-id contains invalid characters', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, 'client-id': 'invalid@char!'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('client-id must contain only letters, numbers, and hyphens');
      }
    });

    it('accepts client-id with letters, numbers, and hyphens', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, 'client-id': 'valid-client-123'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon
        .stub(globalThis, 'fetch')
        .resolves(
          new Response(
            JSON.stringify({corsClientPreferences: [{clientId: 'valid-client-123', origins: ['http://foo.com']}]}),
            {status: 200, headers: {'content-type': 'application/json'}},
          ),
        );

      const result = await command.run();
      expect(result.corsClientPreferences[0].clientId).to.equal('valid-client-123');
    });
  });

  describe('origins validation', () => {
    it('calls command.error when an origin has a port', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, origins: 'http://foo.com:8080'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('http://foo.com:8080');
      }
    });

    it('calls command.error when an origin has a path', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, origins: 'http://foo.com/path'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('http://foo.com/path');
      }
    });

    it('calls command.error when an origin has no scheme', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, origins: 'foo.com'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('foo.com');
      }
    });

    it('reports all invalid origins together in one error', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, origins: 'foo.com,http://bar.com:9000'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('foo.com');
        expect(errorStub.firstCall.args[0]).to.include('http://bar.com:9000');
      }
    });

    it('accepts empty origins string (allow known domains only)', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, origins: ''}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (req: Request | string | URL) => {
        const body = (await (req as Request).json()) as {
          corsClientPreferences: Array<{clientId: string; origins: string[]}>;
        };
        expect(body.corsClientPreferences[0].origins).to.deep.equal([]);
        return new Response(JSON.stringify({corsClientPreferences: [{clientId: 'abc-123', origins: []}]}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });
  });

  describe('successful API call', () => {
    it('returns corsClientPreferences in JSON mode', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, origins: 'http://foo.com,https://bar.com'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            corsClientPreferences: [{clientId: 'abc-123', origins: ['http://foo.com', 'https://bar.com']}],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = await command.run();

      expect(result.siteId).to.equal('RefArch');
      expect(result.corsClientPreferences[0].clientId).to.equal('abc-123');
      expect(result.corsClientPreferences[0].origins).to.deep.equal(['http://foo.com', 'https://bar.com']);
    });

    it('sends client-id and origins in the request body', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, {...VALID_FLAGS, 'client-id': 'my-client', origins: 'http://foo.com'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (req: Request | string | URL) => {
        const body = (await (req as Request).json()) as {
          corsClientPreferences: Array<{clientId: string; origins: string[]}>;
        };
        expect(body.corsClientPreferences[0].clientId).to.equal('my-client');
        expect(body.corsClientPreferences[0].origins).to.deep.equal(['http://foo.com']);
        return new Response(
          JSON.stringify({corsClientPreferences: [{clientId: 'my-client', origins: ['http://foo.com']}]}),
          {
            status: 200,
            headers: {'content-type': 'application/json'},
          },
        );
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });

    it('calls command.error on API failure', async () => {
      const command: any = new ScapiCorsSet([], config);

      stubParse(command, VALID_FLAGS, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => RESOLVED_CONFIG);
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon
        .stub(globalThis, 'fetch')
        .resolves(
          new Response(
            JSON.stringify({title: 'Bad Request', type: 'error', detail: 'Client ID must not be null or empty'}),
            {status: 400, headers: {'content-type': 'application/json'}},
          ),
        );

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('Failed to set CORS preferences');
      }
    });
  });
});
