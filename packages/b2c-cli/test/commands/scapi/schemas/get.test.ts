/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ScapiSchemasGet from '../../../../src/commands/scapi/schemas/get.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../../helpers/test-setup.js';

describe('scapi schemas get', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('scapi schemas get --help');
    expect(error).to.be.undefined;
  });

  it('falls back to the bundled contract without tenant configuration', async () => {
    const {error, stdout} = await runCommand(
      'scapi schemas get checkout shopper-baskets v2 --json --client-id test-client --short-code testcode',
    );
    expect(error).to.be.undefined;
    const output = JSON.parse(stdout) as {source: string; warning: string; schema: {openapi: string}};
    expect(output.source).to.equal('bundled');
    expect(output.warning).to.include('tenant-id');
    expect(output.schema.openapi).to.match(/^3\./);
  });

  it('requires apiFamily argument', async () => {
    const {error} = await runCommand('scapi schemas get --tenant-id f_ecom_zzxy_prd');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('apiFamily');
  });

  it('shows expand flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas get --help');
    expect(stdout).to.include('--expand-paths');
    expect(stdout).to.include('--expand-schemas');
    expect(stdout).to.include('--expand-examples');
    expect(stdout).to.include('--expand-all');
    expect(stdout).to.include('--expand-custom-properties');
  });

  it('shows the server-side include flag in help', async () => {
    const {stdout} = await runCommand('scapi schemas get --help');
    expect(stdout).to.include('--include');
    expect(stdout).to.include('summaries');
  });

  it('shows list flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas get --help');
    expect(stdout).to.include('--list-paths');
    expect(stdout).to.include('--list-schemas');
    expect(stdout).to.include('--list-examples');
  });

  it('shows output format flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas get --help');
    expect(stdout).to.include('--yaml');
    expect(stdout).to.include('--json');
  });

  describe('run', () => {
    let config: Config;
    let fetchStub: sinon.SinonStub;
    const schema = {
      openapi: '3.0.0',
      info: {title: 'Baskets', version: '1'},
      paths: {'/baskets': {post: {operationId: 'createBasket', summary: 'Create a basket'}}},
      components: {schemas: {Basket: {type: 'object'}}, examples: {Ex: {value: 1}}},
    };

    async function prepare(flags: Record<string, unknown>, status = 200) {
      const command: any = new ScapiSchemasGet(['checkout', 'shopper-baskets', 'v2'], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'expand-custom-properties': true, 'expand-all': false, ...flags},
        {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v2'},
      );
      await command.init();
      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      fetchStub.resolves(
        new Response(JSON.stringify(status === 200 ? schema : {message: 'nope'}), {
          status,
          headers: {'content-type': 'application/json'},
        }),
      );
      return command;
    }
    const requestedExpand = () => new URL((fetchStub.firstCall.args[0] as Request).url).searchParams.get('expand');

    beforeEach(async () => {
      config = await Config.load();
      fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('requests only custom properties for the collapsed outline', async () => {
      const command = await prepare({});
      const result: any = await runSilent(() => command.run());
      expect(requestedExpand()).to.equal('custom_properties');
      expect(result.source).to.equal('live');
      expect(result.expand).to.equal('custom_properties');
      expect(result.schema.paths['/baskets']).to.deep.equal(['post']);
    });

    it('requests nothing extra for the outline without custom properties', async () => {
      const command = await prepare({'expand-custom-properties': false});
      await runSilent(() => command.run());
      expect(requestedExpand()).to.equal(null);
    });

    it('requests operation prose when expanding paths or schemas', async () => {
      const command = await prepare({'expand-paths': '/baskets'});
      await runSilent(() => command.run());
      expect(requestedExpand()).to.equal('custom_properties,descriptions,summaries,titles');
    });

    it('requests examples when expanding or listing them', async () => {
      const command = await prepare({'list-examples': true});
      const result: any = await runSilent(() => command.run());
      expect(requestedExpand()).to.equal('custom_properties,examples');
      expect(result).to.deep.equal(['Ex']);
    });

    it('requests everything with --expand-all, as one comma-free value', async () => {
      const command = await prepare({'expand-all': true});
      await runSilent(() => command.run());
      expect(requestedExpand()).to.equal('all');
    });

    it('lets --include override the automatic selection', async () => {
      const command = await prepare({include: 'summaries;tags'});
      await runSilent(() => command.run());
      expect(requestedExpand()).to.equal('summaries,tags');
    });

    it('rejects an unknown --include value', async () => {
      const command = await prepare({include: 'bogus'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('bad include'));
      try {
        await runSilent(() => command.run());
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.firstCall.args[0]).to.include('bogus');
      }
    });

    it('falls back to the bundled contract with a warning when the live fetch fails', async () => {
      const command = await prepare({'expand-all': true}, 403);
      const warnStub = sinon.stub(command, 'warn');
      const result: any = await runSilent(() => command.run());
      expect(result.source).to.equal('bundled');
      expect(result.expand).to.equal(undefined);
      expect(result.warning).to.include('bundled checkout/shopper-baskets/v2');
      expect(warnStub.calledOnce).to.equal(true);
      expect(result.schema.openapi).to.match(/^3\./);
      expect(result.schema.paths).to.have.property('/organizations/{organizationId}/baskets');
    });

    it('still fails for a schema that is not bundled', async () => {
      const command: any = new ScapiSchemasGet(['custom', 'my-api', 'v1'], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'expand-custom-properties': true},
        {
          apiFamily: 'custom',
          apiName: 'my-api',
          apiVersion: 'v1',
        },
      );
      await command.init();
      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      fetchStub.resolves(new Response('{}', {status: 404, headers: {'content-type': 'application/json'}}));
      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to fetch schema');
      }
    });
  });
});
