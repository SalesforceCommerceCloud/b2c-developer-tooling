/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnCertificatesAdd from '../../../../src/commands/ecdn/certificates/add.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn certificates add', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnCertificatesAdd, hooks.getConfig(), flags, {});
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

  function stubCdnRwClient(command: any, client: Partial<{POST: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('adds automatic certificate in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      hostname: 'example.com',
      type: 'automatic',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnRwClient(command, {
      POST: async () => ({
        data: {
          data: {
            certificateId: 'cert-1',
            hosts: ['example.com'],
            status: 'pending_validation',
            certificateType: 'automatic',
            certificateVerificationTXTName: '_acme-challenge.example.com',
            certificateVerificationTXTValue: 'verify-abc123',
          },
        },
      }),
    });

    const result = await command.run();
    expect(result).to.have.property('certificate');
    expect(result.certificate.certificateId).to.equal('cert-1');
    expect(result.certificate.status).to.equal('pending_validation');
  });

  it('displays certificate in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      hostname: 'shop.example.com',
      type: 'automatic',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      POST: async () => ({
        data: {
          data: {
            certificateId: 'cert-2',
            hosts: ['shop.example.com'],
            status: 'active',
            certificateType: 'automatic',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {certificate: any};
    expect(result.certificate.certificateId).to.equal('cert-2');
  });

  it('displays DNS verification info in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      hostname: 'verify.example.com',
      type: 'automatic',
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnRwClient(command, {
      POST: async () => ({
        data: {
          data: {
            certificateId: 'cert-dns',
            hosts: ['verify.example.com'],
            status: 'pending_validation',
            certificateType: 'automatic',
            certificateVerificationTXTName: '_acme.verify.example.com',
            certificateVerificationTXTValue: 'verify-dns-value',
          },
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {certificate: any};
    expect(result.certificate.certificateVerificationTXTName).to.exist;
  });

  it('errors when custom cert missing files', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      hostname: 'example.com',
      type: 'custom',
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('--certificate-file');
    }
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      hostname: 'example.com',
      type: 'automatic',
    });
    stubCommon(command, {jsonEnabled: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnRwClient(command, {
      POST: async () => ({data: undefined, error: {title: 'Conflict', detail: 'Certificate already exists'}}),
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
      hostname: 'example.com',
      type: 'automatic',
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
