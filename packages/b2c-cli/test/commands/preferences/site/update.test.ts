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

    function setupOAuth(command: any): void {
      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
    }

    it('errors when neither assignments nor --file/--body is provided', async () => {
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
        expect(String(errorStub.firstCall.args[0])).to.match(/assignments or --file\/--body/);
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

      setupOAuth(command);

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

    it('builds typed body from KEY=value / KEY:=json assignments and uses the development default', async () => {
      const command: any = new PreferencesSiteUpdate([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'instance-type': 'development',
          'site-id': 'RefArch',
          'mask-passwords': false,
        },
        {'group-id': 'CustomGroupId'},
        ['CustomGroupId', 'c_name=hello', 'c_count:=5'],
      );
      await command.init();

      setupOAuth(command);

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        expect(req.url).to.include('/site-preference-groups/CustomGroupId/development');
        expect(req.url).to.include('siteId=RefArch');
        const json = (await req.clone().json()) as Record<string, unknown>;
        expect(json).to.deep.equal({c_name: 'hello', c_count: 5});
        return new Response(JSON.stringify(json), {status: 200, headers: {'content-type': 'application/json'}});
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });
  });
});
