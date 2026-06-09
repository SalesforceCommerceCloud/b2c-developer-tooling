/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import sinon from 'sinon';
import EcdnFirewallReorder from '../../../../src/commands/ecdn/firewall/reorder.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn firewall reorder', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnFirewallReorder, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolveZoneId').resolves('zone123');
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    Object.defineProperty(command, 'logger', {
      value: {info() {}, debug() {}, warn() {}, error() {}},
      configurable: true,
    });
  }

  function stubCdnClient(command: any, client: Partial<{PATCH: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('errors when neither rule-ids nor rule-ids-file is supplied', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      force: true,
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

  it('errors on duplicate rule IDs', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-ids': 'a,b,a',
      force: true,
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

  it('requires force in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-ids': 'a,b',
    });
    stubCommon(command, {jsonEnabled: false});

    const result = await command.run();
    expect(result.total).to.equal(0);
  });

  it('sends the rule-ids to the API in order', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-ids': 'b, a, c',
      force: true,
    });
    stubCommon(command, {jsonEnabled: true});

    let captured: any;
    stubCdnClient(command, {
      async PATCH(_path: string, options: any) {
        captured = options;
        return {
          data: {
            data: [
              {ruleId: 'b', description: 'b', expression: '...', actions: ['block'], lastUpdated: '', enabled: true},
              {ruleId: 'a', description: 'a', expression: '...', actions: ['block'], lastUpdated: '', enabled: true},
              {ruleId: 'c', description: 'c', expression: '...', actions: ['block'], lastUpdated: '', enabled: true},
            ],
          },
        };
      },
    });

    const result = await command.run();

    expect(captured.body.ruleIds).to.deep.equal(['b', 'a', 'c']);
    expect(result.total).to.equal(3);
  });

  it('reads rule-ids from a JSON file when --rule-ids-file is provided', async () => {
    const tmp = path.join(os.tmpdir(), `ecdn-firewall-reorder-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(['x', 'y']), 'utf8');

    try {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'rule-ids-file': tmp,
        force: true,
      });
      stubCommon(command, {jsonEnabled: true});

      let captured: any;
      stubCdnClient(command, {
        async PATCH(_path: string, options: any) {
          captured = options;
          return {
            data: {
              data: [
                {ruleId: 'x', description: 'x', expression: '...', actions: ['block'], lastUpdated: '', enabled: true},
                {ruleId: 'y', description: 'y', expression: '...', actions: ['block'], lastUpdated: '', enabled: true},
              ],
            },
          };
        },
      });

      await command.run();

      expect(captured.body.ruleIds).to.deep.equal(['x', 'y']);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('errors when the file is not a JSON array of strings', async () => {
    const tmp = path.join(os.tmpdir(), `ecdn-firewall-reorder-bad-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify({not: 'an array'}), 'utf8');

    try {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'rule-ids-file': tmp,
        force: true,
      });
      stubCommon(command, {jsonEnabled: true});

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'rule-ids': 'a,b',
      force: true,
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PATCH: async () => ({data: undefined, error: {title: 'Bad Request', detail: 'Invalid order'}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
