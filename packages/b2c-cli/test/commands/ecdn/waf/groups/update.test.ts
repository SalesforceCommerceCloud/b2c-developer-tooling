/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafGroupsUpdate from '../../../../../src/commands/ecdn/waf/groups/update.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn waf groups update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafGroupsUpdate, hooks.getConfig(), flags, {});
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

  it('updates a group in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
      mode: 'on',
      action: 'block',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {
          data: {groupId: 'grp-1', description: 'Updated Group', mode: 'on', action: 'block'},
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('group');
    expect(result.group.groupId).to.equal('grp-1');
    expect(result.group.mode).to.equal('on');
    expect(result.group.action).to.equal('block');
  });

  it('updates a group without action flag', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-2',
      mode: 'off',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {
          data: {groupId: 'grp-2', description: 'Disabled Group', mode: 'off', action: 'default'},
        },
      }),
    });

    const result = await command.run();

    expect(result.group.mode).to.equal('off');
  });

  it('displays update result in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-3',
      mode: 'on',
      action: 'challenge',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {
          data: {groupId: 'grp-3', description: 'Challenge Group', mode: 'on', action: 'challenge'},
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {group: any};

    expect(result.group.groupId).to.equal('grp-3');
    expect(result.group.action).to.equal('challenge');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
      mode: 'on',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: undefined,
        error: {title: 'Not Found', detail: 'Group not found'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to update WAF group');
    }
  });

  it('errors when no data returned', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'group-id': 'grp-1',
      mode: 'on',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PUT: async () => ({
        data: {data: undefined},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('No WAF group data returned');
    }
  });
});
