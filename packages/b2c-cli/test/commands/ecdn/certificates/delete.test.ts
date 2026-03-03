/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnCertificatesDelete from '../../../../src/commands/ecdn/certificates/delete.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn certificates delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnCertificatesDelete, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{DELETE: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('requires force flag in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', 'certificate-id': 'cert-123'});
    stubCommon(command, {jsonEnabled: false});

    const result = await command.run();

    expect(result).to.have.property('success', false);
    expect(result).to.have.property('certificateId', 'cert-123');
  });

  it('deletes certificate with force flag in JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'certificate-id': 'cert-123',
      force: true,
    });
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      DELETE: async () => ({
        data: {},
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('success', true);
    expect(result).to.have.property('certificateId', 'cert-123');
  });

  it('deletes certificate with force flag in non-JSON mode', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'certificate-id': 'cert-456',
      force: true,
    });
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      DELETE: async () => ({
        data: {},
      }),
    });

    const result = await command.run();

    expect(result.success).to.equal(true);
    expect(result.certificateId).to.equal('cert-456');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      'certificate-id': 'cert-123',
      force: true,
    });
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      DELETE: async () => ({
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
});
