/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnPageShieldPoliciesUpdate from '../../../../../src/commands/ecdn/page-shield/policies/update.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn page-shield policies update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnPageShieldPoliciesUpdate, hooks.getConfig(), flags, {});
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

  function stubCdnRwClient(command: any, client: Partial<{PUT: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  const updatedPolicy = {
    id: 'policy-1',
    action: 'log',
    enabled: true,
    value: 'script-src',
    description: 'Updated description',
    expression: 'http.request.uri.path contains "/new/"',
  };

  it('updates policy in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'policy-id': 'policy-1',
      action: 'log',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PUT: async () => ({data: {data: updatedPolicy}}),
    });

    const result = await command.run();
    expect(result.policy.id).to.equal('policy-1');
    expect(result.policy.action).to.equal('log');
  });

  it('updates policy with all fields', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'policy-id': 'policy-1',
      action: 'allow',
      value: 'script-src',
      expression: 'test-expr',
      description: 'test-desc',
      enabled: false,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PUT: async () => ({data: {data: {...updatedPolicy, enabled: false}}}),
    });

    const result = await command.run();
    expect(result.policy.enabled).to.equal(false);
  });

  it('displays updated policy in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'policy-id': 'policy-1',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PUT: async () => ({data: {data: updatedPolicy}}),
    });

    const result = (await runSilent(() => command.run())) as {policy: any};
    expect(result.policy.id).to.equal('policy-1');
  });

  it('displays policy without optional fields in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'policy-id': 'policy-2',
      action: 'allow',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PUT: async () => ({data: {data: {id: 'policy-2', action: 'allow', enabled: false}}}),
    });

    const result = (await runSilent(() => command.run())) as {policy: any};
    expect(result.policy.id).to.equal('policy-2');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'policy-id': 'bad',
      action: 'log',
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PUT: async () => ({data: undefined, error: {title: 'Not Found'}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors when no data returned', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'policy-id': 'empty',
      action: 'log',
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PUT: async () => ({data: {data: undefined}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
