/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnRateLimitUpdate from '../../../../src/commands/ecdn/rate-limit/update.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn rate-limit update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnRateLimitUpdate, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{PATCH: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('updates rule in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-id': 'rule-123',
      action: 'managed_challenge',
      'requests-per-period': 100,
      'mitigation-timeout': 120,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            ruleId: 'rule-123',
            description: 'Rate limit /checkout',
            expression: '(http.request.uri.path matches "^/checkout")',
            characteristics: ['cf.unique_visitor_id'],
            action: 'managed_challenge',
            period: 60,
            requestsPerPeriod: 100,
            mitigationTimeout: 120,
            lastUpdated: '2026-01-01T00:00:00Z',
            enabled: true,
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.rule.action).to.equal('managed_challenge');
  });

  it('updates rule in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-id': 'rule-123',
      description: 'Updated description',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            ruleId: 'rule-123',
            description: 'Updated description',
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

    const result = (await runSilent(() => command.run())) as {rule: {description: string}};

    expect(result.rule.description).to.equal('Updated description');
  });

  it('errors when no update fields are provided', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-id': 'rule-123',
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
      'rule-id': 'rule-123',
      action: 'managed_challenge',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PATCH: async () => ({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid action'},
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
