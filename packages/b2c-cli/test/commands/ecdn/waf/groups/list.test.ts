/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafGroupsList from '../../../../../src/commands/ecdn/waf/groups/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn waf groups list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafGroupsList, hooks.getConfig(), flags, {});
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

  it('returns groups in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {groupId: 'grp-1', description: 'Group 1', mode: 'on', action: 'block'},
            {groupId: 'grp-2', description: 'Group 2', mode: 'off', action: 'monitor'},
          ],
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('groups');
    expect(result.groups).to.have.lengthOf(2);
    expect(result.total).to.equal(2);
    expect(result.groups[0].groupId).to.equal('grp-1');
    expect(result.groups[1].mode).to.equal('off');
  });

  it('displays groups in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [{groupId: 'grp-1', description: 'Test Group', mode: 'on', action: 'block'}],
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {groups: any[]; total: number};

    expect(result.groups).to.have.lengthOf(1);
    expect(result.total).to.equal(1);
    expect(result.groups[0].groupId).to.equal('grp-1');
  });

  it('handles empty groups list', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: []},
      }),
    });

    const result = await command.run();

    expect(result.groups).to.have.lengthOf(0);
    expect(result.total).to.equal(0);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Forbidden', detail: 'Not authorized'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to fetch WAF groups');
    }
  });

  it('handles null data gracefully', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: undefined},
      }),
    });

    const result = await command.run();

    expect(result.groups).to.have.lengthOf(0);
    expect(result.total).to.equal(0);
  });
});
