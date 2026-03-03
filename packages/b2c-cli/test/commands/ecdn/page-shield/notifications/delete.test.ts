/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnPageShieldNotificationsDelete from '../../../../../src/commands/ecdn/page-shield/notifications/delete.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn page-shield notifications delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnPageShieldNotificationsDelete, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
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

  it('deletes webhook in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', 'webhook-id': 'webhook-1'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      DELETE: async () => ({data: {}, error: undefined}),
    });

    const result = await command.run();
    expect(result.deleted).to.equal(true);
    expect(result.webhookId).to.equal('webhook-1');
  });

  it('deletes webhook in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', 'webhook-id': 'webhook-2'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      DELETE: async () => ({data: {}, error: undefined}),
    });

    const result = (await runSilent(() => command.run())) as {deleted: boolean; webhookId: string};
    expect(result.deleted).to.equal(true);
    expect(result.webhookId).to.equal('webhook-2');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', 'webhook-id': 'bad'});
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      DELETE: async () => ({data: undefined, error: {title: 'Not Found'}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
