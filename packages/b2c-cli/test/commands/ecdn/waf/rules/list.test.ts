/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafRulesList from '../../../../../src/commands/ecdn/waf/rules/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn waf rules list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafRulesList, hooks.getConfig(), flags, {});
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

  it('returns rules in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              ruleId: 'rule-1',
              groupId: 'grp-1',
              description: 'SQL Injection',
              action: 'block',
              defaultAction: 'monitor',
            },
            {ruleId: 'rule-2', groupId: 'grp-1', description: 'XSS', action: 'challenge', defaultAction: 'block'},
          ],
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('rules');
    expect(result.rules).to.have.lengthOf(2);
    expect(result.total).to.equal(2);
    expect(result.rules[0].ruleId).to.equal('rule-1');
    expect(result.rules[1].action).to.equal('challenge');
  });

  it('displays rules in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [{ruleId: 'rule-1', groupId: 'grp-1', description: 'Test Rule', action: 'block'}],
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {rules: any[]; total: number};

    expect(result.rules).to.have.lengthOf(1);
    expect(result.total).to.equal(1);
  });

  it('handles empty rules list', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: []},
      }),
    });

    const result = await command.run();

    expect(result.rules).to.have.lengthOf(0);
    expect(result.total).to.equal(0);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Server Error', detail: 'Internal error'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to fetch WAF rules');
    }
  });

  it('handles null data gracefully', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: undefined},
      }),
    });

    const result = await command.run();

    expect(result.rules).to.have.lengthOf(0);
    expect(result.total).to.equal(0);
  });
});
