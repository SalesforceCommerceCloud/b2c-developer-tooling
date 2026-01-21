/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ScapiCustomStatus from '../../../../src/commands/scapi/custom/status.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('scapi custom status', () => {
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
    const command: any = new ScapiCustomStatus([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('returns API response in JSON mode', async () => {
    const command: any = new ScapiCustomStatus([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}}));

    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
      new Response(
        JSON.stringify({
          total: 1,
          activeCodeVersion: 'version1',
          data: [
            {
              apiName: 'MyApi',
              apiVersion: 'v1',
              cartridgeName: 'app_custom',
              endpointPath: '/test',
              httpMethod: 'get',
              status: 'active',
              securityScheme: 'AmOAuth2',
              siteId: 'RefArch',
            },
          ],
        }),
        {status: 200, headers: {'content-type': 'application/json'}},
      ),
    );

    const result = await command.run();

    expect(fetchStub.called).to.equal(true);
    expect(result.total).to.equal(1);
    expect(result.activeCodeVersion).to.equal('version1');
    expect(result.data).to.have.lengthOf(1);
  });

  it('passes status filter through to the request', async () => {
    const command: any = new ScapiCustomStatus([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd', status: 'active'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}}));

    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (url: Request | string | URL) => {
      const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      expect(requestUrl).to.include('status=active');
      return new Response(JSON.stringify({total: 0, data: []}), {
        status: 200,
        headers: {'content-type': 'application/json'},
      });
    });

    await command.run();
    expect(fetchStub.called).to.equal(true);
  });

  it('does not block in non-JSON mode (renderEndpoints is stubbed)', async () => {
    const command: any = new ScapiCustomStatus([], config);

    stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
    await command.init();

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}}));

    sinon.stub(command, 'renderEndpoints').returns(void 0);

    sinon.stub(command, 'getOAuthStrategy').returns({
      getAuthorizationHeader: async () => 'Bearer test',
    });

    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
      new Response(JSON.stringify({total: 1, data: []}), {
        status: 200,
        headers: {'content-type': 'application/json'},
      }),
    );

    const result = await command.run();
    expect(fetchStub.called).to.equal(true);
    expect(result.total).to.equal(1);
  });
});
