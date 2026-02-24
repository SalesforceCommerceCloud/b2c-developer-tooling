/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnLogpushJobsUpdate from '../../../../../src/commands/ecdn/logpush/jobs/update.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('ecdn logpush jobs update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnLogpushJobsUpdate, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolveZoneId').resolves('zone123');
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    Object.defineProperty(command, 'logger', {
      value: {info() {}, debug() {}, warn() {}, error() {}},
      configurable: true,
    });
  }

  function stubCdnClient(command: any, client: Partial<{PUT: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('updates logpush job enabled status in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'job-id': 123, enabled: true});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      PUT: async () => ({
        data: {
          data: {
            jobId: 123,
            name: 'test-job',
            logType: 'http_requests',
            enabled: true,
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('job');
    expect(result.job.enabled).to.equal(true);
  });

  it('updates job with multiple fields in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'job-id': 123,
      enabled: false,
      filter: 'ClientRequestHost eq "test.com"',
      'log-fields': 'ClientIP,RayID,ClientRequestHost',
    });
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(ux, 'stdout');

    stubCdnClient(command, {
      PUT: async () => ({
        data: {
          data: {
            jobId: 123,
            name: 'test-job',
            enabled: false,
            filter: 'ClientRequestHost eq "test.com"',
            logFields: ['ClientIP', 'RayID', 'ClientRequestHost'],
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.job.enabled).to.equal(false);
    expect(result.job.filter).to.equal('ClientRequestHost eq "test.com"');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'job-id': 123, enabled: true});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PUT: async () => ({
        data: undefined,
        error: {title: 'Not Found', detail: 'Job not found'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors when no data is returned', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'job-id': 123, enabled: false});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PUT: async () => ({
        data: {data: undefined},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
