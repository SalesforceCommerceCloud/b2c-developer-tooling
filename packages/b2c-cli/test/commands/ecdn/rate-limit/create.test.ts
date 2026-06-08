/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnRateLimitCreate from '../../../../src/commands/ecdn/rate-limit/create.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn rate-limit create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnRateLimitCreate, hooks.getConfig(), flags, {});
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

  it('creates rule in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      description: 'Rate limit /checkout',
      expression: '(http.request.uri.path matches "^/checkout")',
      characteristics: 'cf.unique_visitor_id',
      action: 'block',
      period: 60,
      'requests-per-period': 50,
      'mitigation-timeout': 600,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      POST: async () => ({
        data: {
          data: {
            ruleId: 'rule-123',
            description: 'Rate limit /checkout',
            expression: '(http.request.uri.path matches "^/checkout")',
            characteristics: ['cf.unique_visitor_id'],
            action: 'block',
            period: 60,
            requestsPerPeriod: 50,
            mitigationTimeout: 600,
            lastUpdated: '2026-01-01T00:00:00Z',
            enabled: true,
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.rule.ruleId).to.equal('rule-123');
  });

  it('creates rule in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      description: 'Rate limit /api',
      expression: '(http.request.uri.path matches "^/api")',
      characteristics: 'cf.unique_visitor_id,cf.colo.id',
      action: 'log',
      period: 60,
      'requests-per-period': 100,
      'mitigation-timeout': 0,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      POST: async () => ({
        data: {
          data: {
            ruleId: 'rule-456',
            description: 'Rate limit /api',
            expression: '(http.request.uri.path matches "^/api")',
            characteristics: ['cf.unique_visitor_id', 'cf.colo.id'],
            action: 'log',
            period: 60,
            requestsPerPeriod: 100,
            mitigationTimeout: 0,
            lastUpdated: '2026-01-01T00:00:00Z',
            enabled: true,
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {rule: {ruleId: string}};

    expect(result.rule.ruleId).to.equal('rule-456');
  });

  it('errors when characteristics are empty', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      description: 'Rate limit /checkout',
      expression: '(http.request.uri.path matches "^/checkout")',
      characteristics: '  ,  ',
      action: 'block',
      period: 60,
      'requests-per-period': 50,
      'mitigation-timeout': 600,
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      description: 'Rate limit /checkout',
      expression: '(http.request.uri.path matches "^/checkout")',
      characteristics: 'cf.unique_visitor_id',
      action: 'block',
      period: 60,
      'requests-per-period': 50,
      'mitigation-timeout': 600,
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      POST: async () => ({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid expression'},
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
