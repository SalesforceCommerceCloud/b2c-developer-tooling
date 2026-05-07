/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnZonesList from '../../../../src/commands/ecdn/zones/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

/**
 * Unit tests for eCDN zones list command CLI logic.
 * Tests output formatting, column selection, and error handling.
 */
describe('ecdn zones list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnZonesList, hooks.getConfig(), flags, {});
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

  function stubCdnClient(command: any, client: Partial<{GET: any; POST: any; PUT: any; PATCH: any; DELETE: any}>) {
    Object.defineProperty(command, '_cdnZonesClient', {value: client, configurable: true, writable: true});
    Object.defineProperty(command, '_cdnZonesRwClient', {value: client, configurable: true, writable: true});
  }

  describe('output formatting', () => {
    it('returns zones in JSON mode', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
        GET: async () => ({
          data: {
            data: [
              {zoneId: 'zone1', name: 'my-zone', status: 'active'},
              {zoneId: 'zone2', name: 'another-zone', status: 'pending'},
            ],
          },
        }),
      });

      const result = await command.run();

      expect(result).to.have.property('zones');
      expect(result).to.have.property('total', 2);
      expect(result.zones).to.have.lengthOf(2);
      expect(result.zones[0].name).to.equal('my-zone');
      expect(result.zones[1].status).to.equal('pending');
    });

    it('handles empty zones list', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
        GET: async () => ({
          data: {data: []},
        }),
      });

      const result = await command.run();

      expect(result.total).to.equal(0);
      expect(result.zones).to.deep.equal([]);
    });

    it('returns data in non-JSON mode', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
      stubCommon(command, {jsonEnabled: false});

      stubCdnClient(command, {
        GET: async () => ({
          data: {
            data: [{zoneId: 'zone1', name: 'test-zone', status: 'active'}],
          },
        }),
      });

      const result = (await runSilent(() => command.run())) as {
        total: number;
        zones: Array<{name: string}>;
      };

      expect(result).to.have.property('total', 1);
      expect(result.zones).to.have.lengthOf(1);
      expect(result.zones[0].name).to.equal('test-zone');
    });
  });

  describe('error handling', () => {
    it('errors on API failure', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
      stubCommon(command, {jsonEnabled: true});

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      stubCdnClient(command, {
        GET: async () => ({
          data: undefined,
          error: {title: 'Not Found', detail: 'Organization not found'},
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });

    it('handles undefined data as empty list', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd'});
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
        GET: async () => ({
          data: {data: undefined as any},
        }),
      });

      const result = await command.run();

      expect(result.total).to.equal(0);
      expect(result.zones).to.deep.equal([]);
    });
  });
});
