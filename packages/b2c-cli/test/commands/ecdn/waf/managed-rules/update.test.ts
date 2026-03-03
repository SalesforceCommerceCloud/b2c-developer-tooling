/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafManagedRulesUpdate from '../../../../../src/commands/ecdn/waf/managed-rules/update.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn waf managed-rules update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafManagedRulesUpdate, hooks.getConfig(), flags, {});
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

  function stubCdnRwClient(command: any, client: Partial<{PATCH: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('updates a managed rule with enabled flag in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'mr-1',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            ruleId: 'mr-1',
            description: 'Enabled Rule',
            action: 'block',
            enabled: true,
            score: 5,
            categories: ['sqli'],
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('rule');
    expect(result.rule.ruleId).to.equal('mr-1');
    expect(result.rule.enabled).to.equal(true);
    expect(result.rule.action).to.equal('block');
  });

  it('updates a managed rule with action flag', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'mr-2',
      action: 'challenge',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            ruleId: 'mr-2',
            description: 'Challenge Rule',
            action: 'challenge',
            enabled: true,
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.rule.action).to.equal('challenge');
  });

  it('displays update result in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'mr-3',
      enabled: false,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            ruleId: 'mr-3',
            description: 'Disabled Rule',
            action: 'block',
            enabled: false,
            score: 3,
            categories: ['xss', 'injection'],
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {rule: any};

    expect(result.rule.ruleId).to.equal('mr-3');
    expect(result.rule.enabled).to.equal(false);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'mr-1',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: undefined,
        error: {title: 'Forbidden', detail: 'Not authorized'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to update WAF managed rule');
    }
  });

  it('errors when no data returned', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'mr-1',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {data: undefined},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('No WAF managed rule data returned');
    }
  });
});
