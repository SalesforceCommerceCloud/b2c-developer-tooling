/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnPageShieldNotificationsCreate from '../../../../../src/commands/ecdn/page-shield/notifications/create.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn page-shield notifications create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnPageShieldNotificationsCreate, hooks.getConfig(), flags, {});
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

  function stubCdnRwClient(command: any, client: Partial<{POST: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  const webhookData = {
    id: 'webhook-1',
    name: 'My Webhook',
    webhookUrl: 'https://example.com/webhook',
    type: 'page_shield',
    zones: ['zone1', 'zone2'],
  };

  it('creates webhook in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'webhook-url': 'https://example.com/webhook',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: webhookData}}),
    });

    const result = await command.run();
    expect(result.webhook.id).to.equal('webhook-1');
    expect(result.webhook.webhookUrl).to.equal('https://example.com/webhook');
  });

  it('creates webhook with secret and zones', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'webhook-url': 'https://example.com/webhook',
      secret: 'my-secret',
      zones: 'zone1, zone2',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: webhookData}}),
    });

    const result = await command.run();
    expect(result.webhook.id).to.equal('webhook-1');
  });

  it('displays webhook in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'webhook-url': 'https://example.com/webhook',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: webhookData}}),
    });

    const result = (await runSilent(() => command.run())) as {webhook: any};
    expect(result.webhook.id).to.equal('webhook-1');
  });

  it('displays webhook without zones in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'webhook-url': 'https://example.com/webhook',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      POST: async () => ({data: {data: {...webhookData, zones: []}}}),
    });

    const result = (await runSilent(() => command.run())) as {webhook: any};
    expect(result.webhook.id).to.equal('webhook-1');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'webhook-url': 'https://example.com/webhook',
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
      'webhook-url': 'https://example.com/webhook',
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
