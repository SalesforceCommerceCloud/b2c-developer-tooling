/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import EcdnSecurityUpdate from '../../../../src/commands/ecdn/security/update.js';
import {
  stubEcdnClient,
  stubCommandConfigAndLogger,
  stubJsonEnabled,
  stubOrganizationId,
  stubResolveZoneId,
  stubRequireOAuthCredentials,
  makeCommandThrowOnError,
} from '../../../helpers/ecdn.js';

/**
 * Unit tests for eCDN security update command CLI logic.
 * Tests request body building, flag handling, and output formatting.
 */
describe('ecdn security update', () => {
  describe('request body building', () => {
    it('should build request with security-level flag', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
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

    it('should build request with always-use-https flag', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'always-use-https': true,
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
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

    it('should build request with tls13 and waf flags', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        tls13: true,
        waf: true,
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
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

    it('should build HSTS settings when HSTS flags provided', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'hsts-enabled': true,
        'hsts-include-subdomains': true,
        'hsts-max-age': 31_536_000,
        'hsts-preload': true,
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
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

    it('should not include HSTS when no HSTS flags provided', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'medium',
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
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

    it('should handle --no-always-use-https flag', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'always-use-https': false,
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
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
    it('should return updated settings in JSON mode', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
        tls13: true,
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
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
    it('should error on API failure', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
      };
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);
      makeCommandThrowOnError(command);

      stubEcdnClient(command, {
        PATCH: async () => ({
          data: undefined,
          error: {title: 'Bad Request', detail: 'Invalid security level'},
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to update security settings');
      }
    });

    it('should error when no data returned', async () => {
      const command = new EcdnSecurityUpdate([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        'security-level': 'high',
      };
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);
      makeCommandThrowOnError(command);

      stubEcdnClient(command, {
        PATCH: async () => ({
          data: {data: undefined},
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('No security settings returned');
      }
    });
  });
});
