/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnPageShieldNotificationsList from '../../../../../src/commands/ecdn/page-shield/notifications/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn page-shield notifications list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnPageShieldNotificationsList, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{GET: any}>) {
    Object.defineProperty(command, '_cdnZonesClient', {value: client, configurable: true, writable: true});
  }

  it('returns webhooks in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {id: 'wh-1', name: 'Hook 1', webhookUrl: 'https://example.com/1', type: 'page_shield'},
            {id: 'wh-2', name: 'Hook 2', webhookUrl: 'https://example.com/2', type: 'page_shield'},
          ],
        },
      }),
    });

    const result = await command.run();
    expect(result.total).to.equal(2);
    expect(result.webhooks).to.have.lengthOf(2);
  });

  it('handles empty webhooks list', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({data: {data: []}}),
    });

    const result = await command.run();
    expect(result.total).to.equal(0);
    expect(result.webhooks).to.deep.equal([]);
  });

  it('displays webhooks in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: [{id: 'wh-1', name: 'Hook 1', webhookUrl: 'https://example.com/1', type: 'page_shield'}]},
      }),
    });

    const result = (await runSilent(() => command.run())) as {total: number};
    expect(result.total).to.equal(1);
  });

  it('handles empty list in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({data: {data: []}}),
    });

    const result = (await runSilent(() => command.run())) as {total: number};
    expect(result.total).to.equal(0);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({data: undefined, error: {title: 'Unauthorized'}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('shows extended columns', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', extended: true});
    const columns = command.getSelectedColumns();
    expect(columns).to.include('createdAt');
    expect(columns).to.include('zones');
  });

  it('supports custom columns', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', columns: 'id,name'});
    const columns = command.getSelectedColumns();
    expect(columns).to.deep.equal(['id', 'name']);
  });
});
