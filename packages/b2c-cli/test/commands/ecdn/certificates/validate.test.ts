/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnCertificatesValidate from '../../../../src/commands/ecdn/certificates/validate.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn certificates validate', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnCertificatesValidate, hooks.getConfig(), flags, {});
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

  function stubCdnRwClient(command: any, client: Partial<{PATCH: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('validates hostname in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'custom-hostname-id': 'ch-1',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            customHostnameId: 'ch-1',
            customHostname: 'shop.example.com',
            customHostnameStatus: 'pending',
            customHostnameVerificationTXTName: '_txt.shop.example.com',
            customHostnameVerificationTXTValue: 'verify-123',
          },
        },
      }),
    });

    const result = await command.run();
    expect(result).to.have.property('validation');
    expect(result.validation.customHostnameId).to.equal('ch-1');
    expect(result.validation.customHostnameStatus).to.equal('pending');
  });

  it('displays validation info in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'custom-hostname-id': 'ch-2',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      PATCH: async () => ({
        data: {
          data: {
            customHostnameId: 'ch-2',
            customHostname: 'store.example.com',
            customHostnameStatus: 'active',
            customHostnameVerificationTXTName: '_txt.store.example.com',
            customHostnameVerificationTXTValue: 'verify-456',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {validation: any};
    expect(result.validation.customHostname).to.equal('store.example.com');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'custom-hostname-id': 'ch-bad',
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PATCH: async () => ({data: undefined, error: {title: 'Not Found', detail: 'Hostname not found'}}),
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
      zone: 'my-zone',
      'custom-hostname-id': 'ch-empty',
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      PATCH: async () => ({data: {data: undefined}}),
    });

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
