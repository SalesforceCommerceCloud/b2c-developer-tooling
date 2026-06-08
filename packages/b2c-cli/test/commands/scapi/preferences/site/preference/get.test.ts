/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import PreferencesSitePreferenceGet from '../../../../../../src/commands/scapi/preferences/site/preference/get.js';
import {stubParse} from '../../../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks} from '../../../../../helpers/test-setup.js';

describe('scapi preferences site preference get', () => {
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

    it('returns the API response in JSON mode and uses the correct path', async () => {
      const command: any = new PreferencesSitePreferenceGet([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'mask-passwords': false},
        {'group-id': 'CustomGroupId', 'instance-type': 'staging', 'preference-id': 'WapiStringAttr'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (url: Request | string | URL) => {
        const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        expect(requestUrl).to.include('/site-preference-groups/CustomGroupId/staging/preferences/WapiStringAttr');
        return new Response(
          JSON.stringify({id: 'WapiStringAttr', valueType: 'string', siteValues: {RefArch: 'value'}}),
          {status: 200, headers: {'content-type': 'application/json'}},
        );
      });

      const result = await command.run();
      expect(fetchStub.called).to.equal(true);
      expect(result.id).to.equal('WapiStringAttr');
      expect(result.siteValues?.RefArch).to.equal('value');
    });

    it('errors on invalid instance type', async () => {
      const command: any = new PreferencesSitePreferenceGet([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'mask-passwords': false},
        {'group-id': 'CustomGroupId', 'instance-type': 'invalid', 'preference-id': 'WapiStringAttr'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/Invalid instance type/i);
      }
    });

    it('errors on API failure', async () => {
      const command: any = new PreferencesSitePreferenceGet([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'mask-passwords': false},
        {'group-id': 'CustomGroupId', 'instance-type': 'staging', 'preference-id': 'NoSuchAttr'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({title: 'Not Found'}), {
          status: 404,
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
