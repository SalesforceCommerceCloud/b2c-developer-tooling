/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import EcdnZonesList from '../../../../src/commands/ecdn/zones/list.js';
import {
  stubEcdnClient,
  stubCommandConfigAndLogger,
  stubJsonEnabled,
  stubOrganizationId,
  stubRequireOAuthCredentials,
  makeCommandThrowOnError,
} from '../../../helpers/ecdn.js';

/**
 * Unit tests for eCDN zones list command CLI logic.
 * Tests output formatting, column selection, and error handling.
 */
describe('ecdn zones list', () => {
  describe('getSelectedColumns', () => {
    it('should return default columns when no flags provided', () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal(['name', 'status']);
    });

    it('should return all columns when --extended flag is set', () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {extended: true};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.include('name');
      expect(columns).to.include('status');
      expect(columns).to.include('zoneId');
    });

    it('should return custom columns when --columns flag is set', () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {columns: 'zoneId,name'};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal(['zoneId', 'name']);
    });

    it('should ignore invalid column names', () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {columns: 'name,invalidColumn,status'};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.not.include('invalidColumn');
      expect(columns).to.include('name');
      expect(columns).to.include('status');
    });
  });

  describe('output formatting', () => {
    it('should return zones in JSON mode', async () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd'};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
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

    it('should handle empty zones list', async () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd'};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
        GET: async () => ({
          data: {data: []},
        }),
      });

      const result = await command.run();

      expect(result.total).to.equal(0);
      expect(result.zones).to.deep.equal([]);
    });

    it('should return data in non-JSON mode', async () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd'};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
        GET: async () => ({
          data: {
            data: [{zoneId: 'zone1', name: 'test-zone', status: 'active'}],
          },
        }),
      });

      const result = await command.run();

      expect(result).to.have.property('total', 1);
      expect(result.zones).to.have.lengthOf(1);
      expect(result.zones[0].name).to.equal('test-zone');
    });
  });

  describe('error handling', () => {
    it('should error on API failure', async () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd'};
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubRequireOAuthCredentials(command);
      makeCommandThrowOnError(command);

      stubEcdnClient(command, {
        GET: async () => ({
          data: undefined,
          error: {title: 'Not Found', detail: 'Organization not found'},
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to fetch eCDN zones');
      }
    });

    it('should handle undefined data as empty list', async () => {
      const command = new EcdnZonesList([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd'};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
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
