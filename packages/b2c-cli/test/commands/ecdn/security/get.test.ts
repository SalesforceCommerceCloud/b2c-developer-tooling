/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnSecurityGet from '../../../../src/commands/ecdn/security/get.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

/**
 * Unit tests for eCDN security get command CLI logic.
 * Tests output formatting and error handling.
 */
describe('ecdn security get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnSecurityGet, hooks.getConfig(), flags, {});
  }

  function stubCommon(
    command: any,
    {jsonEnabled = true, zoneId = 'zone-abc123'}: {jsonEnabled?: boolean; zoneId?: string} = {},
  ) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'getOrganizationId').returns('f_ecom_zzxy_prd');
    sinon.stub(command, 'resolveZoneId').resolves(zoneId);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'warn').returns(void 0);
    Object.defineProperty(command, 'logger', {
      value: {info() {}, debug() {}, warn() {}, error() {}},
      configurable: true,
    });
  }

  function stubCdnClient(command: any, client: Partial<{GET: any; POST: any; PUT: any; PATCH: any; DELETE: any}>) {
    Object.defineProperty(command, '_cdnZonesClient', {value: client, configurable: true, writable: true});
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  describe('output formatting', () => {
    it('returns security settings in JSON mode', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
        GET: async () => ({
          data: {
            data: {
              securityLevel: 'medium',
              alwaysUseHttps: true,
              tls13Enabled: true,
              wafEnabled: false,
              hsts: {
                enabled: true,
                includeSubdomains: true,
                maxAge: 31_536_000,
                preload: false,
              },
            },
          },
        }),
      });

      const result = await command.run();

      expect(result).to.have.property('settings');
      expect(result.settings.securityLevel).to.equal('medium');
      expect(result.settings.alwaysUseHttps).to.be.true;
      expect(result.settings.tls13Enabled).to.be.true;
      expect(result.settings.wafEnabled).to.be.false;
      expect(result.settings.hsts?.enabled).to.be.true;
      expect(result.settings.hsts?.maxAge).to.equal(31_536_000);
    });

    it('returns data in non-JSON mode', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
      stubCommon(command, {jsonEnabled: false});

      stubCdnClient(command, {
        GET: async () => ({
          data: {
            data: {
              securityLevel: 'high',
              alwaysUseHttps: true,
              tls13Enabled: true,
              wafEnabled: true,
            },
          },
        }),
      });

      const result = (await runSilent(() => command.run())) as {
        settings: {securityLevel: string; wafEnabled: boolean};
      };

      expect(result.settings.securityLevel).to.equal('high');
      expect(result.settings.wafEnabled).to.be.true;
    });

    it('handles settings without HSTS', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
        GET: async () => ({
          data: {
            data: {
              securityLevel: 'low',
              alwaysUseHttps: false,
              tls13Enabled: false,
              wafEnabled: false,
            },
          },
        }),
      });

      const result = await command.run();

      expect(result.settings.hsts).to.be.undefined;
    });
  });

  describe('error handling', () => {
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
      }
    });
  });
});
