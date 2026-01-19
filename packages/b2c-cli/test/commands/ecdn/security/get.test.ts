/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import EcdnSecurityGet from '../../../../src/commands/ecdn/security/get.js';
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
 * Unit tests for eCDN security get command CLI logic.
 * Tests output formatting and error handling.
 */
describe('ecdn security get', () => {
  describe('output formatting', () => {
    it('should return security settings in JSON mode', async () => {
      const command = new EcdnSecurityGet([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd', zone: 'my-zone'};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
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

    it('should return data in non-JSON mode', async () => {
      const command = new EcdnSecurityGet([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd', zone: 'my-zone'};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
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

      const result = await command.run();

      expect(result.settings.securityLevel).to.equal('high');
      expect(result.settings.wafEnabled).to.be.true;
    });

    it('should handle settings without HSTS', async () => {
      const command = new EcdnSecurityGet([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd', zone: 'my-zone'};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
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
    it('should error on API failure', async () => {
      const command = new EcdnSecurityGet([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd', zone: 'my-zone'};
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);
      makeCommandThrowOnError(command);

      stubEcdnClient(command, {
        GET: async () => ({
          data: undefined,
          error: {title: 'Not Found', detail: 'Zone not found'},
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to fetch security settings');
      }
    });

    it('should error when no data returned', async () => {
      const command = new EcdnSecurityGet([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd', zone: 'my-zone'};
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);
      makeCommandThrowOnError(command);

      stubEcdnClient(command, {
        GET: async () => ({
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
