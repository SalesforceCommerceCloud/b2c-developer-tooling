/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import PreferencesSiteUpdate from '../../../../src/commands/preferences/site/update.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks} from '../../../helpers/test-setup.js';

describe('preferences site update', () => {
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

    it('errors when neither --file nor --body is provided', async () => {
      const command: any = new PreferencesSiteUpdate([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'instance-type': 'staging', 'site-id': 'RefArch', 'mask-passwords': false},
        {'group-id': 'CustomGroupId'},
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
        expect(String(errorStub.firstCall.args[0])).to.match(/--file or --body/);
      }
    });

    it('errors on invalid JSON body', async () => {
      const command: any = new PreferencesSiteUpdate([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'instance-type': 'staging',
          'site-id': 'RefArch',
          'mask-passwords': false,
          body: 'not-json',
        },
        {'group-id': 'CustomGroupId'},
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
        expect(String(errorStub.firstCall.args[0])).to.match(/Failed to parse JSON/i);
      }
    });

    it('sends body to PATCH request with siteId query param', async () => {
      const command: any = new PreferencesSiteUpdate([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'instance-type': 'staging',
          'site-id': 'RefArch',
          'mask-passwords': false,
          body: '{"c_attr":"value"}',
        },
        {'group-id': 'CustomGroupId'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        expect(req.url).to.include('/site-preference-groups/CustomGroupId/staging');
        expect(req.url).to.include('siteId=RefArch');
        expect(req.method).to.equal('PATCH');
        expect(await req.clone().json()).to.deep.equal({c_attr: 'value'});
        return new Response(JSON.stringify({c_attr: 'value'}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });
  });
});
