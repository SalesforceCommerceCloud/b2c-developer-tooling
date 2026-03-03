/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnLogpushJobsList from '../../../../../src/commands/ecdn/logpush/jobs/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn logpush jobs list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnLogpushJobsList, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolveZoneId').resolves('zone123');
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    Object.defineProperty(command, 'logger', {
      value: {info() {}, debug() {}, warn() {}, error() {}},
      configurable: true,
    });
  }

  function stubCdnClient(command: any, client: Partial<{GET: any}>) {
    Object.defineProperty(command, '_cdnZonesClient', {value: client, configurable: true, writable: true});
  }

  it('returns logpush jobs in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              jobId: 123,
              name: 'test-job',
              logType: 'http_requests',
              enabled: true,
              destinationPath: 's3://bucket/path',
            },
            {
              jobId: 456,
              name: 'test-job-2',
              logType: 'firewall_events',
              enabled: false,
              destinationPath: 's3://bucket/path2',
            },
          ],
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('jobs');
    expect(result).to.have.property('total', 2);
    expect(result.jobs).to.have.lengthOf(2);
    expect(result.jobs[0].jobId).to.equal(123);
    expect(result.jobs[1].enabled).to.equal(false);
  });

  it('handles empty jobs list', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: []},
      }),
    });

    const result = await command.run();

    expect(result.total).to.equal(0);
    expect(result.jobs).to.deep.equal([]);
  });

  it('returns data in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              jobId: 123,
              name: 'test-job',
              logType: 'http_requests',
              enabled: true,
            },
          ],
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {total: number};

    expect(result).to.have.property('total', 1);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Not Found', detail: 'Zone not found'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('shows all columns with --extended flag', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', extended: true});

    const columns = command.getSelectedColumns();

    expect(columns).to.include('jobId');
    expect(columns).to.include('name');
    expect(columns).to.include('destinationPath');
    expect(columns).to.include('lastComplete');
  });

  it('supports custom columns with --columns flag', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', columns: 'jobId,name'});

    const columns = command.getSelectedColumns();

    expect(columns).to.deep.equal(['jobId', 'name']);
  });
});
