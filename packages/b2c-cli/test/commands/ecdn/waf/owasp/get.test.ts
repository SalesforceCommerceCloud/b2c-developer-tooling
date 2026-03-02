/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnWafOwaspGet from '../../../../../src/commands/ecdn/waf/owasp/get.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('ecdn waf owasp get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnWafOwaspGet, hooks.getConfig(), flags, {});
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

  it('returns OWASP package in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'owasp-pkg-1',
            name: 'OWASP ModSecurity Core Rule Set',
            description: 'OWASP ModSecurity Core Rule Set v3.3.2',
            detection_mode: 'anomaly',
            sensitivity: 'medium',
            action_mode: 'simulate',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('package');
    expect(result.package.id).to.equal('owasp-pkg-1');
    expect(result.package.detection_mode).to.equal('anomaly');
    expect(result.package.sensitivity).to.equal('medium');
  });

  it('displays OWASP package in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'owasp-pkg-2',
            name: 'OWASP Package',
            description: 'OWASP Core Rules',
            detection_mode: 'traditional',
            sensitivity: 'high',
            action_mode: 'block',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {package: any};

    expect(result.package.id).to.equal('owasp-pkg-2');
    expect(result.package.action_mode).to.equal('block');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Not Found', detail: 'OWASP package not found'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Failed to fetch OWASP package settings');
    }
  });

  it('errors when no data returned', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
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

  it('displays all package fields', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            id: 'pkg-full',
            name: 'Full Package',
            description: 'Complete package with all fields',
            detection_mode: 'anomaly',
            sensitivity: 'low',
            action_mode: 'challenge',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {package: any};

    expect(result.package.name).to.equal('Full Package');
    expect(result.package.description).to.equal('Complete package with all fields');
    expect(result.package.detection_mode).to.equal('anomaly');
    expect(result.package.sensitivity).to.equal('low');
    expect(result.package.action_mode).to.equal('challenge');
  });
});
