/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnFirewallCreate from '../../../../src/commands/ecdn/firewall/create.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn firewall create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnFirewallCreate, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{POST: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  // The test helper bypasses the oclif parser, so flag defaults (e.g.
  // `enabled: true`) are not auto-injected. Set them explicitly here.
  const baseFlags = {
    'tenant-id': 'zzxy_prd',
    zone: 'my-zone',
    description: 'Block /admin',
    expression: '(http.request.uri.path matches "^/admin")',
    actions: 'block',
    enabled: true,
  };

  it('creates a rule with a single action', async () => {
    const command: any = await createCommand(baseFlags);
    stubCommon(command, {jsonEnabled: true});

    let captured: any;
    stubCdnClient(command, {
      async POST(_path: string, options: any) {
        captured = options;
        return {
          data: {
            data: {
              ruleId: 'rule-new',
              description: baseFlags.description,
              expression: baseFlags.expression,
              actions: ['block'],
              lastUpdated: '2026-01-01T00:00:00Z',
              enabled: true,
            },
          },
        };
      },
    });

    const result = await command.run();

    expect(result.rule.ruleId).to.equal('rule-new');
    expect(captured.body.actions).to.deep.equal(['block']);
    expect(captured.body.enabled).to.equal(true);
    expect(captured.body.position).to.equal(undefined);
  });

  it('parses comma-separated actions and forwards before-position', async () => {
    const command: any = await createCommand({
      ...baseFlags,
      actions: 'block, log',
      before: 'rule-existing',
    });
    stubCommon(command, {jsonEnabled: true});

    let captured: any;
    stubCdnClient(command, {
      async POST(_path: string, options: any) {
        captured = options;
        return {
          data: {
            data: {
              ruleId: 'rule-new',
              description: baseFlags.description,
              expression: baseFlags.expression,
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
    expect(captured.body.position).to.deep.equal({before: 'rule-existing'});
  });

  it('errors when actions resolves to an empty list', async () => {
    const command: any = await createCommand({...baseFlags, actions: ' , '});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand(baseFlags);
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      POST: async () => ({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid expression'},
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
