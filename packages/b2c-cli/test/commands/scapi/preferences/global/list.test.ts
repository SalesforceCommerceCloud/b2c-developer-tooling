/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import PreferencesGlobalList from '../../../../../src/commands/scapi/preferences/global/list.js';
import {stubParse} from '../../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../../../helpers/test-setup.js';

describe('scapi preferences global list', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  describe('run', () => {
    let config: Config;

    beforeEach(async () => {
      config = await Config.load();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('returns the API response in JSON mode', async () => {
      const command: any = new PreferencesGlobalList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', limit: 200, offset: 0, 'mask-password': false}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            total: 1,
            data: [{id: 'c_attr', value: 'foo', groupId: 'CustomGroup'}],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = await command.run();
      expect(fetchStub.called).to.equal(true);
      expect(result.total).to.equal(1);
      expect(result.data).to.have.lengthOf(1);
      expect(result.data[0].id).to.equal('c_attr');
    });

    it('passes limit, offset, and maskPassword query params to the request', async () => {
      const command: any = new PreferencesGlobalList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', limit: 50, offset: 100, 'mask-password': true}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (url: Request | string | URL) => {
        const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        expect(requestUrl).to.include('/global-custom-preferences');
        expect(requestUrl).to.include('limit=50');
        expect(requestUrl).to.include('offset=100');
        expect(requestUrl).to.include('maskPassword=true');
        return new Response(JSON.stringify({total: 0, data: []}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });

    it('renders preferences to stdout in non-JSON mode', async () => {
      const command: any = new PreferencesGlobalList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', limit: 200, offset: 0, 'mask-password': false}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            total: 2,
            data: [
              {id: 'c_attr1', value: 'value1', groupId: 'CustomGroup'},
              {id: 'c_attr2', value: 42, groupId: 'CustomGroup'},
            ],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = (await runSilent(() => command.run())) as {total: number};
      expect(result.total).to.equal(2);
    });

    it('errors when API request fails', async () => {
      const command: any = new PreferencesGlobalList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', limit: 200, offset: 0, 'mask-password': false}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({title: 'Forbidden', detail: 'Insufficient scope'}), {
          status: 403,
          headers: {'content-type': 'application/json'},
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });
  });
});
