/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnSpeedGet from '../../../../src/commands/ecdn/speed/get.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('ecdn speed get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnSpeedGet, hooks.getConfig(), flags, {});
  }

  function stubCommon(command: any, {jsonEnabled = true}: {jsonEnabled?: boolean} = {}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolveZoneId').resolves('zone123');
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

  it('returns speed settings in JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: true});

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            brotliCompression: 'on',
            http2Prioritization: 'on',
            http2ToOrigin: 'off',
            http3: 'on',
            earlyHints: 'off',
            webp: 'on',
            polish: 'lossless',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('settings');
    expect(result.settings.brotliCompression).to.equal('on');
    expect(result.settings.http3).to.equal('on');
  });

  it('displays settings in non-JSON mode', async () => {
    const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
    stubCommon(command, {jsonEnabled: false});
    sinon.stub(ux, 'stdout');

    stubCdnClient(command, {
      GET: async () => ({
        data: {
          data: {
            brotliCompression: 'off',
            http2Prioritization: 'off',
            http2ToOrigin: 'off',
            http3: 'off',
            earlyHints: 'off',
            webp: 'off',
            polish: 'off',
          },
        },
      }),
    });

    const result = await command.run();

    expect(result).to.have.property('settings');
    expect(result.settings.polish).to.equal('off');
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

  it('errors when no data is returned', async () => {
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
    }
  });
});
