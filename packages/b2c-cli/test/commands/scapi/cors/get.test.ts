/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ScapiCorsGet from '../../../../src/commands/scapi/cors/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('scapi cors get', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('calls command.error when shortCode is missing from resolved config', async () => {
    const command: any = new ScapiCorsGet([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', 'site-id': 'RefArch'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: undefined, tenantId: 'zzxy_prd'}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls command.error when site-id is missing', async () => {
    const command: any = new ScapiCorsGet([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('returns CORS preferences in JSON mode', async () => {
    const command: any = new ScapiCorsGet([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', 'site-id': 'RefArch'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    sinon.stub(globalThis, 'fetch').resolves(
      new Response(
        JSON.stringify({
          corsClientPreferences: [{clientId: 'abc-123', origins: ['http://foo.com']}],
        }),
        {status: 200, headers: {'content-type': 'application/json'}},
      ),
    );

    const result = await command.run();

    expect(result.siteId).to.equal('RefArch');
    expect(result.corsClientPreferences).to.have.length(1);
    expect(result.corsClientPreferences[0].clientId).to.equal('abc-123');
    expect(result.corsClientPreferences[0].origins).to.deep.equal(['http://foo.com']);
  });

  it('returns empty list when no preferences configured', async () => {
    const command: any = new ScapiCorsGet([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', 'site-id': 'RefArch'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    sinon
      .stub(globalThis, 'fetch')
      .resolves(new Response(JSON.stringify({}), {status: 200, headers: {'content-type': 'application/json'}}));

    const result = await command.run();

    expect(result.siteId).to.equal('RefArch');
    expect(result.corsClientPreferences).to.deep.equal([]);
  });

  it('calls command.error on API failure', async () => {
    const command: any = new ScapiCorsGet([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', 'site-id': 'RefArch'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    sinon.stub(globalThis, 'fetch').resolves(
      new Response(JSON.stringify({title: 'Not Found', type: 'error', detail: 'Site not found'}), {
        status: 404,
        headers: {'content-type': 'application/json'},
      }),
    );

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to fetch CORS preferences');
    }
  });
});
