/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnMtlsList from '../../../../src/commands/ecdn/mtls/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn mtls list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnMtlsList, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
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

  it('returns mTLS certificates in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              mtlsCertificateId: 'cert-123',
              mtlsCertificateName: 'Test Certificate',
              issuer: 'CN=Test CA',
              expiresOn: '2025-12-31',
              ca: false,
            },
            {
              mtlsCertificateId: 'cert-456',
              mtlsCertificateName: 'Another Certificate',
              issuer: 'CN=Another CA',
              expiresOn: '2026-01-31',
              ca: true,
            },
          ],
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('certificates');
    expect(result).to.have.property('total', 2);
    expect(result.certificates).to.have.lengthOf(2);
    expect(result.certificates[0].mtlsCertificateId).to.equal('cert-123');
  });

  it('handles empty certificates list', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {data: []},
      }),
    });

    const result = await command.run();

    expect(result.total).to.equal(0);
    expect(result.certificates).to.deep.equal([]);
  });

  it('returns data in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              mtlsCertificateId: 'cert-123',
              mtlsCertificateName: 'Test Certificate',
              issuer: 'CN=Test CA',
              expiresOn: '2025-12-31',
            },
          ],
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {total: number};

    expect(result).to.have.property('total', 1);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Unauthorized', detail: 'Invalid credentials'},
      }),
    });

    try {
      await command.run();
      expect.fail('Should have thrown an error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('shows all columns with --extended flag', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', extended: true});

    const columns = command.getSelectedColumns();

    expect(columns).to.include('mtlsCertificateId');
    expect(columns).to.include('mtlsCertificateName');
    expect(columns).to.include('mtlsAssociatedCodeUploadHostname');
    expect(columns).to.include('ca');
  });

  it('supports custom columns with --columns flag', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      columns: 'mtlsCertificateId,mtlsCertificateName',
    });

    const columns = command.getSelectedColumns();

    expect(columns).to.deep.equal(['mtlsCertificateId', 'mtlsCertificateName']);
  });
});
