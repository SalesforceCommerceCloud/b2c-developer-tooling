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
    expect(stdout).to.include('--from');
    expect(stdout).to.include('--to');
    expect(stdout).to.include('--window');
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

    it('sends epoch seconds on the wire and echoes the resolved bounds (--from + --window)', async () => {
      const command: any = new MetricsGet(['scapi'], config);
      // "1h window, 7 days ago" — the key ergonomic case.
      stubParse(command, {'tenant-id': 'zzxy_prd', from: '7d', window: '1h'}, {category: 'scapi'});
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

      const result = await command.run();

      expect(fetchStub.calledOnce).to.equal(true);
      const firstArg = fetchStub.firstCall.args[0];
      const url = typeof firstArg === 'string' ? firstArg : (firstArg as Request).url;
      const params = new URL(url).searchParams;
      const from = Number(params.get('from'));
      const to = Number(params.get('to'));
      // Wire values are epoch SECONDS (10 digits), not milliseconds (13).
      expect(String(from)).to.have.length(10);
      // 1h window derived from --from => exactly 3600 seconds.
      expect(to - from).to.equal(3600);

      // Resolved bounds + filters echoed back to the caller.
      expect(result.query.category).to.equal('scapi');
      expect(result.query.fromEpochSeconds).to.equal(from);
      expect(result.query.toEpochSeconds).to.equal(to);
      expect(result.query.from).to.be.a('string');
      expect(result.query.to).to.be.a('string');
    });

    it('derives an explicit 24h window forward when only --from is given', async () => {
      const command: any = new MetricsGet(['overall'], config);
      // 7d ago is within retention; from + 24h is still before now, so a full
      // 24h window is sent (both bounds explicit, no reliance on server default).
      stubParse(command, {'tenant-id': 'zzxy_prd', from: '7d'}, {category: 'overall'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      sinon.stub(command, 'requireTenantId').returns('zzxy_prd');

      const fetchStub = sinon
        .stub(globalThis, 'fetch')
        .resolves(
          new Response(JSON.stringify({data: []}), {status: 200, headers: {'content-type': 'application/json'}}),
        );

      const result = await command.run();
      const url = new URL(
        typeof fetchStub.firstCall.args[0] === 'string'
          ? (fetchStub.firstCall.args[0] as string)
          : (fetchStub.firstCall.args[0] as Request).url,
      );
      const from = Number(url.searchParams.get('from'));
      const to = Number(url.searchParams.get('to'));
      expect(url.searchParams.has('from')).to.equal(true);
      expect(url.searchParams.has('to')).to.equal(true); // explicit, derived from the 24h default
      expect(to - from).to.equal(24 * 60 * 60);
      expect(result.query.defaultedWindow).to.equal(true);
      expect(result.query.toEpochSeconds).to.equal(to);
    });

    it('defaults to the last 24h when no bounds are given', async () => {
      const command: any = new MetricsGet(['overall'], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {category: 'overall'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      sinon.stub(command, 'requireTenantId').returns('zzxy_prd');

      const fetchStub = sinon
        .stub(globalThis, 'fetch')
        .resolves(
          new Response(JSON.stringify({data: []}), {status: 200, headers: {'content-type': 'application/json'}}),
        );

      const result = await command.run();
      const url = new URL(
        typeof fetchStub.firstCall.args[0] === 'string'
          ? (fetchStub.firstCall.args[0] as string)
          : (fetchStub.firstCall.args[0] as Request).url,
      );
      const from = Number(url.searchParams.get('from'));
      const to = Number(url.searchParams.get('to'));
      expect(url.searchParams.has('from')).to.equal(true);
      expect(url.searchParams.has('to')).to.equal(true);
      expect(to - from).to.equal(24 * 60 * 60);
      expect(result.query.defaultedWindow).to.equal(true);
    });

    it('errors on over-specification (--from + --to + --window) before calling the API', async () => {
      const command: any = new MetricsGet(['overall'], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', from: '2d', to: '1d', window: '1h'}, {category: 'overall'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      const errorStub = sinon.stub(command, 'error').throws(new Error('over-specified'));
      const fetchStub = sinon.stub(globalThis, 'fetch');

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(String(errorStub.firstCall.args[0])).to.match(/at most two/);
        expect(fetchStub.called).to.equal(false);
      }
    });
  });
});
