/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnZonesCreate from '../../../../src/commands/ecdn/zones/create.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn zones create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnZonesCreate, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{POST: any}>) {
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  it('creates zone in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', 'domain-name': 'example.com'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      POST: async () => ({
        data: {
          data: {
            zoneId: 'zone-123',
            zoneName: 'example.com',
            status: 'active',
            createdOn: '2025-01-15T10:30:00Z',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('zoneId', 'zone-123');
    expect(result).to.have.property('zoneName', 'example.com');
    expect(result).to.have.property('status', 'active');
  });

  it('creates zone in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', 'domain-name': 'store.example.com'});
    stubCommon(command, {jsonEnabled: false});

    stubCdnClient(command, {
      POST: async () => ({
        data: {
          data: {
            zoneId: 'zone-456',
            zoneName: 'store.example.com',
            status: 'pending',
            createdOn: '2025-01-15T10:30:00Z',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result.zoneId).to.equal('zone-456');
    expect(result.status).to.equal('pending');
  });

  it('errors on API failure', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', 'domain-name': 'example.com'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      POST: async () => ({
        data: undefined,
        error: {title: 'Conflict', detail: 'Zone already exists'},
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
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', 'domain-name': 'example.com'});
    stubCommon(command, {jsonEnabled: true});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    stubCdnClient(command, {
      POST: async () => ({
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
