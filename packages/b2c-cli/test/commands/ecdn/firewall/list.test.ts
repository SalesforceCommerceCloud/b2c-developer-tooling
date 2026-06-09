/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnFirewallList from '../../../../src/commands/ecdn/firewall/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn firewall list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnFirewallList, hooks.getConfig(), flags, {});
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
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              ruleId: 'rule-1',
              description: 'Block /admin',
              expression: '(http.request.uri.path matches "^/admin")',
              actions: ['block'],
              lastUpdated: '2026-01-01T00:00:00Z',
              enabled: true,
            },
          ],
        },
      }),
    });

    const result = await command.run();

    expect(result.total).to.equal(1);
    expect(result.rules[0].ruleId).to.equal('rule-1');
  });

  it('forwards limit and offset query params', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      limit: 10,
      offset: 20,
    });
    stubCommon(command, {jsonEnabled: true});

    let captured: any;
    stubCdnClient(command, {
      async GET(_path: string, options: any) {
        captured = options;
        return {data: {data: []}};
      },
    });

    await command.run();

    expect(captured.params.query).to.deep.equal({limit: 10, offset: 20});
  });

  it('returns rules in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              ruleId: 'rule-2',
              description: 'Challenge bots',
              expression: 'cf.threat_score gt 30',
              actions: ['managed_challenge'],
              lastUpdated: '2026-01-01T00:00:00Z',
              enabled: true,
            },
          ],
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {total: number};

    expect(result.total).to.equal(1);
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
});
