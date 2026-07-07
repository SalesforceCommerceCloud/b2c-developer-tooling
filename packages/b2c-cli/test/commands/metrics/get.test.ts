/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import MetricsGet from '../../../src/commands/metrics/get.js';
import {stubParse} from '../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../helpers/test-setup.js';

describe('metrics get', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  it('shows help without errors', async () => {
    const {error} = await runCommand('metrics get --help');
    expect(error).to.be.undefined;
  });

  it('shows CLOSED BETA in help', async () => {
    const {stdout} = await runCommand('metrics get --help');
    expect(stdout).to.include('CLOSED BETA');
  });

  it('requires tenant-id flag', async () => {
    const {error} = await runCommand('metrics get overall --client-id test-client --short-code testcode');
    expect(error).to.not.be.undefined;
    expect(error?.message).to.include('tenant-id');
  });

  it('shows category argument in help', async () => {
    const {stdout} = await runCommand('metrics get --help');
    expect(stdout).to.include('category');
    expect(stdout).to.include('overall');
    expect(stdout).to.include('scapi');
  });

  it('shows filter flags in help', async () => {
    const {stdout} = await runCommand('metrics get --help');
    expect(stdout).to.include('--since');
    expect(stdout).to.include('--until');
    expect(stdout).to.include('--third-party-service-id');
    expect(stdout).to.include('--api-family');
    expect(stdout).to.include('--api-name');
    expect(stdout).to.include('--ocapi-category');
    expect(stdout).to.include('--ocapi-api');
  });

  describe('run', () => {
    let config: Config;

    beforeEach(async () => {
      config = await Config.load();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('returns metrics in JSON mode', async () => {
      const command: any = new MetricsGet(['overall'], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {category: 'overall'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      sinon.stub(command, 'requireTenantId').returns('zzxy_prd');

      const mockResponse = {
        data: [
          {
            metricId: 'requests_total',
            title: 'Total Requests',
            description: 'Total number of requests',
            unit: 'requests',
            dataSeries: [
              {
                id: 'series1',
                name: '2xx',
                data: [{timestamp: 1_609_459_200, value: 100}],
              },
            ],
          },
        ],
      };

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = await command.run();
      expect(result.data).to.be.an('array');
      expect(result.data.length).to.equal(1);
      expect(result.data[0].metricId).to.equal('requests_total');
    });

    it('handles empty metrics in non-JSON mode', async () => {
      const command: any = new MetricsGet(['overall'], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {category: 'overall'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      sinon.stub(command, 'requireTenantId').returns('zzxy_prd');

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({data: []}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = (await runSilent(() => command.run())) as {data: unknown[]};
      expect(result.data).to.be.an('array');
      expect(result.data.length).to.equal(0);
    });

    it('displays metrics in non-JSON mode', async () => {
      const command: any = new MetricsGet(['overall'], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {category: 'overall'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      sinon.stub(command, 'requireTenantId').returns('zzxy_prd');

      const logStub = sinon.stub(command, 'log');
      const stdoutStub = sinon.stub(ux, 'stdout');

      // API sends data-point timestamps in epoch SECONDS.
      const mockResponse = {
        data: [
          {
            metricId: 'requests_total',
            title: 'Total Requests',
            description: 'Total number of requests',
            unit: 'requests',
            dataSeries: [
              {
                id: 'series1',
                name: '2xx',
                data: [
                  {timestamp: 1_609_459_200, value: 100},
                  {timestamp: 1_609_459_260, value: 150},
                ],
              },
            ],
          },
        ],
      };

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = (await command.run()) as {data: {dataSeries: {data: {timestamp: number}[]}[]}[]};
      expect(result.data.length).to.equal(1);
      // Timestamp is normalized to ms; renders as a 2021 date (not 1970).
      expect(result.data[0].dataSeries[0].data[0].timestamp).to.equal(1_609_459_200_000);

      const logOutput = logStub
        .getCalls()
        .map((c) => String(c.args[0] ?? ''))
        .join('\n');
      const stdoutOutput = stdoutStub
        .getCalls()
        .map((c) => String(c.args[0] ?? ''))
        .join('');
      const allOutput = `${logOutput}\n${stdoutOutput}`;

      expect(logOutput).to.match(/Found\s+1/);
      expect(allOutput).to.include('Total Requests');
      expect(allOutput).to.include('2xx');
      expect(allOutput).to.include('2021-01-01');
    });

    it('handles API errors', async () => {
      const command: any = new MetricsGet(['overall'], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {category: 'overall'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      sinon.stub(command, 'requireTenantId').returns('zzxy_prd');
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

    it('supports time window filters and sends epoch seconds on the wire', async () => {
      const command: any = new MetricsGet(['overall'], config);
      // ISO 8601 inputs; the API expects epoch SECONDS on the wire.
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          since: '2021-01-01T00:00:00.000Z',
          until: '2021-01-02T00:00:00.000Z',
        },
        {category: 'overall'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      sinon.stub(command, 'requireTenantId').returns('zzxy_prd');

      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({data: []}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      );

      await command.run();

      expect(fetchStub.calledOnce).to.equal(true);
      const firstArg = fetchStub.firstCall.args[0];
      const url = typeof firstArg === 'string' ? firstArg : (firstArg as Request).url;
      // 2021-01-01T00:00:00Z = 1609459200s, 2021-01-02T00:00:00Z = 1609545600s
      expect(url).to.include('from=1609459200');
      expect(url).to.include('to=1609545600');
      expect(url).to.not.include('from=1609459200000');
    });

    it('rejects a --since that is after --until', async () => {
      const command: any = new MetricsGet(['overall'], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', since: '2021-01-02T00:00:00.000Z', until: '2021-01-01T00:00:00.000Z'},
        {category: 'overall'},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('range error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/must be before/);
      }
    });
  });
});
