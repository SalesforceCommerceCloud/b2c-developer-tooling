/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafRulesetsUpdate from '../../../../../src/commands/ecdn/waf/rulesets/update.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn waf rulesets update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafRulesetsUpdate, hooks.getConfig(), flags, {});
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

  it('updates a ruleset with enabled flag in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            rulesetId: 'rs-1',
            name: 'OWASP',
            enabled: true,
            action: 'block',
            paranoiaLevel: 2,
            anomalyScore: 'medium',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('ruleset');
    expect(result.ruleset.rulesetId).to.equal('rs-1');
    expect(result.ruleset.enabled).to.equal(true);
  });

  it('updates a ruleset with action and paranoia level', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-2',
      action: 'challenge',
      'paranoia-level': 3,
      'anomaly-score': 'high',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            rulesetId: 'rs-2',
            name: 'OWASP Custom',
            enabled: true,
            action: 'challenge',
            paranoiaLevel: 3,
            anomalyScore: 'high',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.ruleset.action).to.equal('challenge');
    expect(result.ruleset.paranoiaLevel).to.equal(3);
    expect(result.ruleset.anomalyScore).to.equal('high');
  });

  it('displays update result in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-3',
      enabled: false,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            rulesetId: 'rs-3',
            name: 'Disabled Ruleset',
            enabled: false,
            action: 'block',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {ruleset: any};

    expect(result.ruleset.rulesetId).to.equal('rs-3');
    expect(result.ruleset.enabled).to.equal(false);
  });

  it('displays paranoia level and anomaly score in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-4',
      'paranoia-level': 4,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            rulesetId: 'rs-4',
            name: 'High Paranoia',
            enabled: true,
            action: 'block',
            paranoiaLevel: 4,
            anomalyScore: 'critical',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {ruleset: any};

    expect(result.ruleset.paranoiaLevel).to.equal(4);
    expect(result.ruleset.anomalyScore).to.equal('critical');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
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
      expect(errorStub.firstCall.args[0]).to.include('Failed to update WAF ruleset');
    }
  });

  it('errors when no data returned', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
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
      expect(errorStub.firstCall.args[0]).to.include('No WAF ruleset data returned');
    }
  });
});
