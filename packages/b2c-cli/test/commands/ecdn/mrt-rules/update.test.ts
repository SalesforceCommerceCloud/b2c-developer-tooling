/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnMrtRulesUpdate from '../../../../src/commands/ecdn/mrt-rules/update.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn mrt-rules update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnMrtRulesUpdate, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolveZoneId').resolves('zone123');
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    Object.defineProperty(command, 'logger', {
      value: {info() {}, debug() {}, warn() {}, error() {}},
      configurable: true,
    });
  }

  function stubCdnClient(command: any, client: Partial<{PATCH: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('updates MRT hostname in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'mrt-hostname': 'new-customer.mobify-storefront.com',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            ruleset: {
              id: 'ruleset-123',
              name: 'MRT Rules',
              rules: [
                {
                  id: 'rule-1',
                  enabled: true,
                  mrtHostname: 'new-customer.mobify-storefront.com',
                  expression: '(http.host eq "example.com")',
                },
              ],
            },
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('ruleset');
    expect(result.ruleset.rules[0].mrtHostname).to.equal('new-customer.mobify-storefront.com');
  });

  it('updates hostname and adds new rules in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'mrt-hostname': 'customer.mobify-storefront.com',
      'old-mrt-hostname': 'old-customer.mobify-storefront.com',
      expressions: '(http.host eq "new.example.com")',
      descriptions: 'New route',
    });
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(ux, 'stdout');

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            ruleset: {
              id: 'ruleset-123',
              name: 'MRT Rules',
              rules: [
                {
                  id: 'rule-1',
                  enabled: true,
                  mrtHostname: 'customer.mobify-storefront.com',
                  expression: '(http.host eq "example.com")',
                },
                {
                  id: 'rule-2',
                  enabled: true,
                  mrtHostname: 'customer.mobify-storefront.com',
                  expression: '(http.host eq "new.example.com")',
                  description: 'New route',
                },
              ],
            },
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.ruleset.rules).to.have.lengthOf(2);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'mrt-hostname': 'new-customer.mobify-storefront.com',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PATCH: async () => ({
        data: undefined,
        error: {title: 'Bad Request', detail: 'Invalid hostname'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors when no ruleset data is returned', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'mrt-hostname': 'new-customer.mobify-storefront.com',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {data: {ruleset: undefined}},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
