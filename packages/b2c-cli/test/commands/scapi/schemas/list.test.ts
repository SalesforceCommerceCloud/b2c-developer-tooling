/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import ScapiSchemasList from '../../../../src/commands/scapi/schemas/list.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../../helpers/test-setup.js';

describe('scapi schemas list', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('scapi schemas list --help');
    expect(error).to.be.undefined;
  });

  it('requires tenant-id flag', async () => {
    const {error} = await runCommand('scapi schemas list --client-id test-client --short-code testcode');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('tenant-id');
  });

  it('shows available columns in help', async () => {
    const {stdout} = await runCommand('scapi schemas list --help');
    expect(stdout).to.include('apiFamily');
    expect(stdout).to.include('apiName');
    expect(stdout).to.include('apiVersion');
    expect(stdout).to.include('status');
  });

  it('shows filter flags in help', async () => {
    const {stdout} = await runCommand('scapi schemas list --help');
    expect(stdout).to.include('--api-family');
    expect(stdout).to.include('--api-name');
    expect(stdout).to.include('--api-version');
    expect(stdout).to.include('--status');
  });

  describe('run', () => {
    let config: Config;

    beforeEach(async () => {
      config = await Config.load();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('returns schemas in JSON mode', async () => {
      const command: any = new ScapiSchemasList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            total: 2,
            data: [
              {apiFamily: 'product', apiName: 'shopper-products', apiVersion: 'v1', status: 'current'},
              {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v1', status: 'current'},
            ],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = await command.run();
      expect(result.total).to.equal(2);
      expect(result.schemas).to.have.lengthOf(2);
    });

    it('handles empty schemas in non-JSON mode', async () => {
      const command: any = new ScapiSchemasList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({total: 0, data: []}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = (await runSilent(() => command.run())) as {total: number};
      expect(result.total).to.equal(0);
    });

    it('displays schemas in non-JSON mode', async () => {
      const command: any = new ScapiSchemasList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      const logStub = sinon.stub(command, 'log');
      const stdoutStub = sinon.stub(ux, 'stdout');

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            total: 2,
            data: [
              {apiFamily: 'product', apiName: 'shopper-products', apiVersion: 'v1', status: 'current'},
              {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v2', status: 'deprecated'},
            ],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = (await command.run()) as {total: number};
      expect(result.total).to.equal(2);

      const logOutput = logStub
        .getCalls()
        .map((c) => String(c.args[0] ?? ''))
        .join('\n');
      const stdoutOutput = stdoutStub
        .getCalls()
        .map((c) => String(c.args[0] ?? ''))
        .join('');
      const allOutput = `${logOutput}\n${stdoutOutput}`;

      expect(logOutput).to.match(/Found\s+2/);
      expect(allOutput).to.include('shopper-products');
      expect(allOutput).to.include('shopper-baskets');
      expect(allOutput).to.include('v1');
      expect(allOutput).to.include('v2');
      expect(allOutput).to.include('current');
      expect(allOutput).to.include('deprecated');
    });

    it('handles API errors', async () => {
      const command: any = new ScapiSchemasList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({message: 'Unauthorized'}), {
          status: 401,
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
