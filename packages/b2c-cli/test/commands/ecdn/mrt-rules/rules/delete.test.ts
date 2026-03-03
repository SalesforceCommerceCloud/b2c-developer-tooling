/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnMrtRulesRulesDelete from '../../../../../src/commands/ecdn/mrt-rules/rules/delete.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn mrt-rules rules delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnMrtRulesRulesDelete, hooks.getConfig(), flags, {});
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

  function stubCdnRwClient(command: any, client: Partial<{DELETE: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('deletes rule in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'rule-1',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      DELETE: async () => ({error: undefined}),
    });

    const result = await command.run();
    expect(result.deleted).to.equal(true);
    expect(result.ruleId).to.equal('rule-1');
  });

  it('deletes rule in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'rule-2',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      DELETE: async () => ({error: undefined}),
    });

    const result = (await runSilent(() => command.run())) as {deleted: boolean; ruleId: string};
    expect(result.deleted).to.equal(true);
    expect(result.ruleId).to.equal('rule-2');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'ruleset-id': 'rs-1',
      'rule-id': 'rule-1',
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      DELETE: async () => ({error: {title: 'Not Found', detail: 'Rule not found'}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
