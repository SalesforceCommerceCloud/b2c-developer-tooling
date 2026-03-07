/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ScapiCorsDelete from '../../../../src/commands/scapi/cors/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('scapi cors delete', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('returns deleted: true in JSON mode on success', async () => {
    const command: any = new ScapiCorsDelete([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', 'site-id': 'RefArch'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response(null, {status: 204}));

    const result = await command.run();

    expect(fetchStub.called).to.equal(true);
    expect(result.siteId).to.equal('RefArch');
    expect(result.deleted).to.equal(true);
  });

  it('sends the siteId as a query parameter', async () => {
    const command: any = new ScapiCorsDelete([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', 'site-id': 'SiteB'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (url: Request | string | URL) => {
      const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      expect(requestUrl).to.include('siteId=SiteB');
      return new Response(null, {status: 204});
    });

    await command.run();
    expect(fetchStub.called).to.equal(true);
  });

  it('calls command.error when site-id is missing', async () => {
    const command: any = new ScapiCorsDelete([], config);

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

  it('calls command.error on API failure', async () => {
    const command: any = new ScapiCorsDelete([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', 'site-id': 'RefArch'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    sinon.stub(globalThis, 'fetch').resolves(
      new Response(JSON.stringify({title: 'Forbidden', type: 'error', detail: 'Insufficient permissions'}), {
        status: 403,
        headers: {'content-type': 'application/json'},
      }),
    );

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to delete CORS preferences');
    }
  });
});
