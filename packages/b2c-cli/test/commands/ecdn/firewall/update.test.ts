/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnFirewallUpdate from '../../../../src/commands/ecdn/firewall/update.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn firewall update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnFirewallUpdate, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{PATCH: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('rejects when no update fields are provided', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-id': 'rule-1',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('sends only the fields that were provided', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-id': 'rule-1',
      description: 'updated copy',
      enabled: false,
    });
    stubCommon(command, {jsonEnabled: true});

    let captured: any;
    stubCdnClient(command, {
      async PATCH(_path: string, options: any) {
        captured = options;
        return {
          data: {
            data: {
              ruleId: 'rule-1',
              description: 'updated copy',
              expression: '(...)',
              actions: ['block'],
              lastUpdated: '2026-01-01T00:00:00Z',
              enabled: false,
            },
          },
        };
      },
    });

    await command.run();

    expect(Object.keys(captured.body).sort()).to.deep.equal(['description', 'enabled']);
    expect(captured.body.description).to.equal('updated copy');
    expect(captured.body.enabled).to.equal(false);
  });

  it('parses comma-separated actions on update', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-id': 'rule-1',
      actions: 'block,log',
    });
    stubCommon(command, {jsonEnabled: true});

    let captured: any;
    stubCdnClient(command, {
      async PATCH(_path: string, options: any) {
        captured = options;
        return {
          data: {
            data: {
              ruleId: 'rule-1',
              description: 'desc',
              expression: '(...)',
              actions: ['block', 'log'],
              lastUpdated: '2026-01-01T00:00:00Z',
              enabled: true,
            },
          },
        };
      },
    });

    await command.run();

    expect(captured.body.actions).to.deep.equal(['block', 'log']);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-id': 'rule-1',
      description: 'noop',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PATCH: async () => ({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid update'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
