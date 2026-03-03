/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnLogpushJobsCreate from '../../../../../src/commands/ecdn/logpush/jobs/create.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('ecdn logpush jobs create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnLogpushJobsCreate, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{POST: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('creates logpush job in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      name: 'test-job',
      'destination-path': 's3://bucket/logs/{DATE}?region=us-east-1',
      'log-type': 'http_requests',
      'log-fields': 'ClientIP,RayID',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      POST: async () => ({
        data: {
          data: {
            jobId: 123,
            name: 'test-job',
            logType: 'http_requests',
            enabled: true,
            destinationPath: 's3://bucket/logs/{DATE}?region=us-east-1',
            logFields: ['ClientIP', 'RayID'],
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('job');
    expect(result.job.jobId).to.equal(123);
    expect(result.job.name).to.equal('test-job');
  });

  it('creates job with filter in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      name: 'filtered-job',
      'destination-path': 's3://bucket/logs',
      'log-type': 'http_requests',
      'log-fields': 'ClientIP',
      filter: 'ClientRequestHost eq "example.com"',
    });
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(ux, 'stdout');

    stubCdnClient(command, {
      POST: async () => ({
        data: {
          data: {
            jobId: 456,
            name: 'filtered-job',
            logType: 'http_requests',
            enabled: true,
            filter: 'ClientRequestHost eq "example.com"',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('job');
    expect(result.job.filter).to.equal('ClientRequestHost eq "example.com"');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      name: 'test-job',
      'destination-path': 's3://bucket/logs',
      'log-type': 'http_requests',
      'log-fields': 'ClientIP',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      POST: async () => ({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid destination path'},
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
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      name: 'test-job',
      'destination-path': 's3://bucket/logs',
      'log-type': 'http_requests',
      'log-fields': 'ClientIP',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      POST: async () => ({
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
