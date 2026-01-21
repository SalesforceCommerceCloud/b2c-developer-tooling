/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnSecurityUpdate from '../../../../src/commands/ecdn/security/update.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

/**
 * Unit tests for eCDN security update command CLI logic.
 * Tests request body building, flag handling, and output formatting.
 */
describe('ecdn security update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnSecurityUpdate, hooks.getConfig(), flags, {});
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

  describe('request body building', () => {
    it('builds request with security-level flag', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
        async PATCH(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {
                securityLevel: 'high',
                alwaysUseHttps: false,
              },
            },
          };
        },
      });

      await command.run();

      expect(capturedBody.securityLevel).to.equal('high');
    });

    it('builds request with always-use-https flag', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'always-use-https': true,
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
        async PATCH(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {
                alwaysUseHttps: true,
              },
            },
          };
        },
      });

      await command.run();

      expect(capturedBody.alwaysUseHttps).to.be.true;
    });

    it('builds request with tls13 and waf flags', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        tls13: true,
        waf: true,
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
        async PATCH(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {
                tls13Enabled: true,
                wafEnabled: true,
              },
            },
          };
        },
      });

      await command.run();

      expect(capturedBody.tls13Enabled).to.be.true;
      expect(capturedBody.wafEnabled).to.be.true;
    });

    it('builds HSTS settings when HSTS flags provided', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'hsts-enabled': true,
        'hsts-include-subdomains': true,
        'hsts-max-age': 31_536_000,
        'hsts-preload': true,
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
        async PATCH(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {
                hsts: {
                  enabled: true,
                  includeSubdomains: true,
                  maxAge: 31_536_000,
                  preload: true,
                },
              },
            },
          };
        },
      });

      await command.run();

      expect(capturedBody.hsts).to.deep.include({
        enabled: true,
        includeSubdomains: true,
        maxAge: 31_536_000,
        preload: true,
      });
    });

    it('does not include HSTS when no HSTS flags provided', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'medium',
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
        async PATCH(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {securityLevel: 'medium'},
            },
          };
        },
      });

      await command.run();

      expect(capturedBody.hsts).to.be.undefined;
    });

    it('handles --no-always-use-https flag', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'always-use-https': false,
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
        async PATCH(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {alwaysUseHttps: false},
            },
          };
        },
      });

      await command.run();

      expect(capturedBody.alwaysUseHttps).to.be.false;
    });
  });

  describe('output formatting', () => {
    it('returns updated settings in JSON mode', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
        tls13: true,
      });
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
        PATCH: async () => ({
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

      const result = await command.run();

      expect(result).to.have.property('settings');
      expect(result.settings.securityLevel).to.equal('high');
      expect(result.settings.tls13Enabled).to.be.true;
    });
  });

  describe('error handling', () => {
    it('errors on API failure', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
      });
      stubCommon(command, {jsonEnabled: true});

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      stubCdnClient(command, {
        PATCH: async () => ({
          data: undefined,
          error: {title: 'Bad Request', detail: 'Invalid security level'},
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
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
      });
      stubCommon(command, {jsonEnabled: true});

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      stubCdnClient(command, {
        PATCH: async () => ({
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
