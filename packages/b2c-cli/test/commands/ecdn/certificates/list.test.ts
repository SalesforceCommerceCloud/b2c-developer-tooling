/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnCertificatesList from '../../../../src/commands/ecdn/certificates/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('ecdn certificates list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnCertificatesList, hooks.getConfig(), flags, {});
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

  it('returns certificates in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              certificateId: 'cert-1',
              hosts: ['example.com'],
              status: 'active',
              certificateType: 'managed',
            },
            {
              certificateId: 'cert-2',
              hosts: ['test.com', 'www.test.com'],
              status: 'pending',
              certificateType: 'custom',
            },
          ],
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('certificates');
    expect(result).to.have.property('total', 2);
    expect(result.certificates).to.have.lengthOf(2);
    expect(result.certificates[0].certificateId).to.equal('cert-1');
    expect(result.certificates[1].status).to.equal('pending');
  });

  it('handles empty certificates list', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
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
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: [
            {
              certificateId: 'cert-1',
              hosts: ['example.com'],
              status: 'active',
              certificateType: 'managed',
            },
          ],
        },
      }),
    });

    const result = (await runSilent(() => command.run())) as {total: number};

    expect(result).to.have.property('total', 1);
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      GET: async () => ({
        data: undefined,
        error: {title: 'Not Found', detail: 'Zone not found'},
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
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone', extended: true});

    const columns = command.getSelectedColumns();

    expect(columns).to.include('certificateId');
    expect(columns).to.include('hosts');
    expect(columns).to.include('status');
    expect(columns).to.include('expiresOn');
  });

  it('supports custom columns with --columns flag', async () => {
    const command: any = await createCommand({
      'tenant-id': 'zzxy_prd',
      zone: 'my-zone',
      columns: 'certificateId,status',
    });

    const columns = command.getSelectedColumns();

    expect(columns).to.deep.equal(['certificateId', 'status']);
  });
});
