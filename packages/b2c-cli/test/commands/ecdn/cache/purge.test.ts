/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import EcdnCachePurge from '../../../../src/commands/ecdn/cache/purge.js';
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
 * Unit tests for eCDN cache purge command CLI logic.
 * Tests input validation, multiple purge modes, and output formatting.
 */
describe('ecdn cache purge', () => {
  describe('input validation', () => {
    it('should error when neither path nor tag is provided', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {'tenant-id': 'zzxy_prd', zone: 'my-zone'};
      stubCommandConfigAndLogger(command);
      stubRequireOAuthCredentials(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('--path or --tag must be specified');
      }
    });
  });

  describe('path purge mode', () => {
    it('should purge cache by path successfully', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/products',
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
        async POST(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {cachePurged: true},
            },
          };
        },
      });

      const result = await command.run();

      expect(result.success).to.be.true;
      expect(result.cachePurged).to.be.true;
      expect(result.purgedPath).to.equal('www.example.com/products');
      expect(capturedBody).to.deep.equal({path: 'www.example.com/products'});
    });
  });

  describe('tag purge mode', () => {
    it('should purge cache by tags successfully', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        tag: ['product-123', 'category-456'],
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
        async POST(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {
              data: {cachePurged: true},
            },
          };
        },
      });

      const result = await command.run();

      expect(result.success).to.be.true;
      expect(result.purgedTags).to.deep.equal(['product-123', 'category-456']);
      expect(capturedBody).to.deep.equal({tags: ['product-123', 'category-456']});
    });

    it('should handle single tag', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        tag: ['single-tag'],
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
        POST: async () => ({
          data: {data: {cachePurged: true}},
        }),
      });

      const result = await command.run();

      expect(result.purgedTags).to.deep.equal(['single-tag']);
    });
  });

  describe('combined mode', () => {
    it('should purge by both path and tags', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/products',
        tag: ['product-123'],
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      let capturedBody: any;
      stubEcdnClient(command, {
        async POST(_path: string, {body}: any) {
          capturedBody = body;
          return {
            data: {data: {cachePurged: true}},
          };
        },
      });

      const result = await command.run();

      expect(result.purgedPath).to.equal('www.example.com/products');
      expect(result.purgedTags).to.deep.equal(['product-123']);
      expect(capturedBody).to.deep.equal({
        path: 'www.example.com/products',
        tags: ['product-123'],
      });
    });
  });

  describe('output formatting', () => {
    it('should return structured output in JSON mode', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/test',
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
        POST: async () => ({
          data: {
            data: {
              cachePurged: true,
              details: 'Purge completed',
            },
          },
        }),
      });

      const result = await command.run();

      expect(result).to.have.property('success', true);
      expect(result).to.have.property('cachePurged', true);
      expect(result).to.have.property('details', 'Purge completed');
      expect(result).to.have.property('purgedPath', 'www.example.com/test');
    });

    it('should handle partial success', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/test',
      };
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);

      stubEcdnClient(command, {
        POST: async () => ({
          data: {
            data: {
              cachePurged: false,
              details: 'Path not found in cache',
            },
          },
        }),
      });

      const result = await command.run();

      expect(result.success).to.be.false;
      expect(result.cachePurged).to.be.false;
      expect(result.details).to.equal('Path not found in cache');
    });
  });

  describe('error handling', () => {
    it('should error on API failure', async () => {
      const command = new EcdnCachePurge([], {} as any);
      (command as any).flags = {
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/test',
      };
      stubCommandConfigAndLogger(command);
      stubOrganizationId(command);
      stubResolveZoneId(command, 'zone-abc123');
      stubRequireOAuthCredentials(command);
      makeCommandThrowOnError(command);

      stubEcdnClient(command, {
        POST: async () => ({
          data: undefined,
          error: {title: 'Bad Request', detail: 'Invalid path format'},
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Failed to purge cache');
      }
    });
  });
});
