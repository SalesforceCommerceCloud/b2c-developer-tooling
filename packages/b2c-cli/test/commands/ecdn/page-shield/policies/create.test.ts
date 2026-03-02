/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnPageShieldPoliciesCreate from '../../../../../src/commands/ecdn/page-shield/policies/create.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn page-shield policies create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnPageShieldPoliciesCreate, hooks.getConfig(), flags, {});
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

  function stubCdnRwClient(command: any, client: Partial<{POST: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  const createdPolicy = {
    id: 'policy-new',
    action: 'allow',
    enabled: true,
    value: 'script-src',
    description: 'Allow trusted scripts',
    expression: 'http.request.uri.path contains "/trusted/"',
  };

  it('creates policy in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      action: 'allow',
      value: 'script-src',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: createdPolicy}}),
    });

    const result = await command.run();
    expect(result.policy.id).to.equal('policy-new');
    expect(result.policy.action).to.equal('allow');
  });

  it('creates policy with expression and description', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      action: 'log',
      value: 'script-src',
      expression: 'http.request.uri.path contains "/untrusted/"',
      description: 'Log untrusted scripts',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: {...createdPolicy, action: 'log', description: 'Log untrusted scripts'}}}),
    });

    const result = await command.run();
    expect(result.policy.action).to.equal('log');
  });

  it('displays created policy in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      action: 'allow',
      value: 'script-src',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: createdPolicy}}),
    });

    const result = (await runSilent(() => command.run())) as {policy: any};
    expect(result.policy.id).to.equal('policy-new');
  });

  it('displays policy without optional fields in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      action: 'allow',
      value: 'script-src',
      enabled: false,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: {id: 'policy-minimal', action: 'allow', enabled: false, value: 'script-src'}}}),
    });

    const result = (await runSilent(() => command.run())) as {policy: any};
    expect(result.policy.enabled).to.equal(false);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      action: 'allow',
      value: 'script-src',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      POST: async () => ({data: undefined, error: {title: 'Bad Request'}}),
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
      action: 'allow',
      value: 'script-src',
      enabled: true,
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: undefined}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
