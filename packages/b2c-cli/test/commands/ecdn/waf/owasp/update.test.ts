/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafOwaspUpdate from '../../../../../src/commands/ecdn/waf/owasp/update.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn waf owasp update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafOwaspUpdate, hooks.getConfig(), flags, {});
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

  it('updates OWASP package in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      sensitivity: 'medium',
      'action-mode': 'block',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            id: 'owasp-pkg-1',
            name: 'OWASP Package',
            sensitivity: 'medium',
            action_mode: 'block',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('package');
    expect(result.package.sensitivity).to.equal('medium');
    expect(result.package.action_mode).to.equal('block');
  });

  it('updates OWASP package with low sensitivity', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      sensitivity: 'low',
      'action-mode': 'simulate',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            id: 'owasp-pkg-2',
            name: 'OWASP Package',
            sensitivity: 'low',
            action_mode: 'simulate',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.package.sensitivity).to.equal('low');
    expect(result.package.action_mode).to.equal('simulate');
  });

  it('updates OWASP package with high sensitivity', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      sensitivity: 'high',
      'action-mode': 'challenge',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            id: 'owasp-pkg-3',
            name: 'OWASP Package',
            sensitivity: 'high',
            action_mode: 'challenge',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.package.sensitivity).to.equal('high');
    expect(result.package.action_mode).to.equal('challenge');
  });

  it('updates OWASP package with off sensitivity', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      sensitivity: 'off',
      'action-mode': 'simulate',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            id: 'owasp-pkg-4',
            name: 'OWASP Package',
            sensitivity: 'off',
            action_mode: 'simulate',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.package.sensitivity).to.equal('off');
  });

  it('displays update in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      sensitivity: 'medium',
      'action-mode': 'block',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            id: 'owasp-pkg-5',
            name: 'OWASP ModSecurity',
            sensitivity: 'medium',
            action_mode: 'block',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {package: any};

    expect(result.package.name).to.equal('OWASP ModSecurity');
    expect(result.package.action_mode).to.equal('block');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      sensitivity: 'medium',
      'action-mode': 'block',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PATCH: async () => ({
        data: undefined,
        error: {title: 'Forbidden', detail: 'Not authorized'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to update OWASP package settings');
    }
  });

  it('errors when no data returned', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      sensitivity: 'medium',
      'action-mode': 'block',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      PATCH: async () => ({
        data: {data: undefined},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('No OWASP package data returned');
    }
  });
});
