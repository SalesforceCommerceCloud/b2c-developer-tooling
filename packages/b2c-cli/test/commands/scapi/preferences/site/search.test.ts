/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import PreferencesSiteSearch from '../../../../../src/commands/scapi/preferences/site/search.js';
import {stubParse} from '../../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../../../helpers/test-setup.js';

describe('scapi preferences site search', () => {
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

    function stubCommandDefaults(command: any): void {
      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
    }

    it('builds matchAllQuery when no convenience flags or query is provided', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', limit: 25, offset: 0, 'sort-order': 'asc', 'mask-passwords': false},
        {'group-id': 'CustomGroupId', 'instance-type': 'staging'},
      );
      await command.init();
      stubCommandDefaults(command);
      sinon.stub(command, 'jsonEnabled').returns(true);

      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        expect(req.url).to.include('/preference-search');
        expect(req.method).to.equal('POST');
        const body = (await req.clone().json()) as any;
        expect(body.query).to.deep.equal({matchAllQuery: {}});
        expect(body.limit).to.equal(25);
        expect(body.offset).to.equal(0);
        return new Response(JSON.stringify({hits: [], total: 0}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
      expect(fetchStub.called).to.equal(true);
    });

    it('builds textQuery when --search-phrase is provided alone', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'search-phrase': 'Wapi',
          limit: 25,
          offset: 0,
          'sort-order': 'asc',
          'mask-passwords': false,
        },
        {'group-id': 'CustomGroupId', 'instance-type': 'staging'},
      );
      await command.init();
      stubCommandDefaults(command);
      sinon.stub(command, 'jsonEnabled').returns(true);

      sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        const body = (await req.clone().json()) as any;
        expect(body.query).to.deep.equal({
          textQuery: {fields: ['id', 'displayName', 'description'], searchPhrase: 'Wapi'},
        });
        return new Response(JSON.stringify({hits: [], total: 0}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
    });

    it('builds termQuery when --value-type is provided alone', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'value-type': 'string',
          limit: 25,
          offset: 0,
          'sort-order': 'asc',
          'mask-passwords': false,
        },
        {'group-id': 'CustomGroupId', 'instance-type': 'staging'},
      );
      await command.init();
      stubCommandDefaults(command);
      sinon.stub(command, 'jsonEnabled').returns(true);

      sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        const body = (await req.clone().json()) as any;
        expect(body.query).to.deep.equal({
          termQuery: {fields: ['valueType'], operator: 'is', values: ['string']},
        });
        return new Response(JSON.stringify({hits: [], total: 0}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
    });

    it('builds boolQuery combining --search-phrase and --value-type', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'search-phrase': 'Wapi',
          'value-type': 'string',
          limit: 25,
          offset: 0,
          'sort-order': 'asc',
          'mask-passwords': false,
        },
        {'group-id': 'CustomGroupId', 'instance-type': 'staging'},
      );
      await command.init();
      stubCommandDefaults(command);
      sinon.stub(command, 'jsonEnabled').returns(true);

      sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        const body = (await req.clone().json()) as any;
        expect(body.query.boolQuery.must).to.have.lengthOf(2);
        expect(body.query.boolQuery.must[0]).to.deep.equal({
          textQuery: {fields: ['id', 'displayName', 'description'], searchPhrase: 'Wapi'},
        });
        expect(body.query.boolQuery.must[1]).to.deep.equal({
          termQuery: {fields: ['valueType'], operator: 'is', values: ['string']},
        });
        return new Response(JSON.stringify({hits: [], total: 0}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
    });

    it('uses inline --query body and adds sorts when --sort-by is set', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          query: '{"matchAllQuery":{}}',
          'sort-by': 'id',
          'sort-order': 'desc',
          limit: 25,
          offset: 0,
          'mask-passwords': false,
        },
        {'group-id': 'CustomGroupId', 'instance-type': 'staging'},
      );
      await command.init();
      stubCommandDefaults(command);
      sinon.stub(command, 'jsonEnabled').returns(true);

      sinon.stub(globalThis, 'fetch').callsFake(async (input: Request | string | URL) => {
        const req = input as Request;
        const body = (await req.clone().json()) as any;
        expect(body.query).to.deep.equal({matchAllQuery: {}});
        expect(body.sorts).to.deep.equal([{field: 'id', sortOrder: 'desc'}]);
        return new Response(JSON.stringify({hits: [], total: 0}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
    });

    it('passes expand=value to query string', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          expand: 'value',
          limit: 25,
          offset: 0,
          'sort-order': 'asc',
          'mask-passwords': false,
        },
        {'group-id': 'CustomGroupId', 'instance-type': 'staging'},
      );
      await command.init();
      stubCommandDefaults(command);
      sinon.stub(command, 'jsonEnabled').returns(true);

      sinon.stub(globalThis, 'fetch').callsFake(async (url: Request | string | URL) => {
        const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        expect(requestUrl).to.include('expand=value');
        return new Response(JSON.stringify({hits: [], total: 0}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        });
      });

      await command.run();
    });

    it('errors on invalid instance type', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', limit: 25, offset: 0, 'sort-order': 'asc', 'mask-passwords': false},
        {'group-id': 'CustomGroupId', 'instance-type': 'bogus'},
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

    it('renders search hits to stdout in non-JSON mode', async () => {
      const command: any = new PreferencesSiteSearch([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', limit: 25, offset: 0, 'sort-order': 'asc', 'mask-passwords': false},
        {'group-id': 'CustomGroupId', 'instance-type': 'staging'},
      );
      await command.init();
      stubCommandDefaults(command);
      sinon.stub(command, 'jsonEnabled').returns(false);

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            total: 1,
            hits: [{id: 'WapiStringAttr', valueType: 'string', displayName: {default: 'WAPI String'}}],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = (await runSilent(() => command.run())) as {total: number};
      expect(result.total).to.equal(1);
    });
  });
});
