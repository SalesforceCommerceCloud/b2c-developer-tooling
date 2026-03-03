/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnMtlsGet from '../../../../src/commands/ecdn/mtls/get.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn mtls get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnMtlsGet, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    Object.defineProperty(command, 'logger', {
      value: {info() {}, debug() {}, warn() {}, error() {}},
      configurable: true,
    });
  }

  function stubCdnClient(command: any, client: Partial<{GET: any}>) {
    Object.defineProperty(command, '_cdnZonesClient', {value: client, configurable: true, writable: true});
  }

  it('returns mTLS certificate in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'certificate-id': 'cert-123',
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            mtlsCertificateId: 'cert-123',
            mtlsCertificateName: 'Test Certificate',
            issuer: 'CN=Test CA',
            expiresOn: '2025-12-31',
            ca: false,
            mtlsAssociatedCodeUploadHostname: 'upload.example.com',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('certificate');
    expect(result.certificate.mtlsCertificateId).to.equal('cert-123');
    expect(result.certificate.mtlsCertificateName).to.equal('Test Certificate');
  });

  it('displays certificate details in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'certificate-id': 'cert-123',
    });
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(ux, 'stdout');

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            mtlsCertificateId: 'cert-123',
            mtlsCertificateName: 'Test Certificate',
            issuer: 'CN=Test CA',
            expiresOn: '2025-12-31',
            ca: true,
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('certificate');
    expect(result.certificate.ca).to.equal(true);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'certificate-id': 'cert-123',
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Not Found', detail: 'Certificate not found'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors when no data is returned', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      'certificate-id': 'cert-123',
    });
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
    }
  });
});
