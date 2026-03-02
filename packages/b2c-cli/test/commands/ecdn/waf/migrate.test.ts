/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafMigrate from '../../../../src/commands/ecdn/waf/migrate.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn waf migrate', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafMigrate, hooks.getConfig(), flags, {});
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

  it('returns migration result in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {
          data: [
            {rulesetId: 'rs-1', name: 'OWASP', enabled: true, action: 'block'},
            {rulesetId: 'rs-2', name: 'Custom', enabled: true, action: 'challenge'},
          ],
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('rulesets');
    expect(result.rulesets).to.have.lengthOf(2);
    expect(result.total).to.equal(2);
    expect(result.rulesets[0].rulesetId).to.equal('rs-1');
    expect(result.rulesets[1].name).to.equal('Custom');
  });

  it('displays migration result in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {
          data: [{rulesetId: 'rs-1', name: 'OWASP', enabled: true, action: 'block'}],
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {rulesets: any[]; total: number};

    expect(result.rulesets).to.have.lengthOf(1);
    expect(result.total).to.equal(1);
  });

  it('handles migration with no rulesets created', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {data: []},
      }),
    });

    const result = (await runSilent(() => command.run())) as {rulesets: any[]; total: number};

    expect(result.rulesets).to.have.lengthOf(0);
    expect(result.total).to.equal(0);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: undefined,
        error: {title: 'Conflict', detail: 'Zone already migrated'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to migrate zone to WAF v2');
    }
  });

  it('handles null data gracefully', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {data: undefined},
      }),
    });

    const result = await command.run();

    expect(result.rulesets).to.have.lengthOf(0);
    expect(result.total).to.equal(0);
  });
});
