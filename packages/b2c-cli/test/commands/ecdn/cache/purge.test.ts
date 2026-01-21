/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import EcdnCachePurge from '../../../../src/commands/ecdn/cache/purge.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

/**
 * Unit tests for eCDN cache purge command CLI logic.
 * Tests input validation, multiple purge modes, and output formatting.
 */
describe('ecdn cache purge', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}) {
    return createTestCommand(EcdnCachePurge, hooks.getConfig(), flags, {});
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

  describe('input validation', () => {
    it('errors when neither path nor tag is provided', async () => {
      const command: any = await createCommand({'tenant-id': 'zzxy_prd', zone: 'my-zone'});

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78'}, warnings: [], sources: []}));
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'warn').returns(void 0);
      Object.defineProperty(command, 'logger', {
        value: {info() {}, debug() {}, warn() {}, error() {}},
        configurable: true,
      });

      const errorStub = sinon.stub(command, 'error').throws(new Error('--path or --tag must be specified'));

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });
  });

  describe('path purge mode', () => {
    it('purges cache by path successfully', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/products',
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
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
    it('purges cache by tags successfully', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        tag: ['product-123', 'category-456'],
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
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

    it('handles single tag', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        tag: ['single-tag'],
      });
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
        POST: async () => ({
          data: {data: {cachePurged: true}},
        }),
      });

      const result = await command.run();

      expect(result.purgedTags).to.deep.equal(['single-tag']);
    });
  });

  describe('combined mode', () => {
    it('purges by both path and tags', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/products',
        tag: ['product-123'],
      });
      stubCommon(command, {jsonEnabled: true});

      let capturedBody: any;
      stubCdnClient(command, {
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
    it('returns structured output in JSON mode', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/test',
      });
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
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

    it('handles partial success', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/test',
      });
      stubCommon(command, {jsonEnabled: true});

      stubCdnClient(command, {
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
    it('errors on API failure', async () => {
      const command: any = await createCommand({
        'tenant-id': 'zzxy_prd',
        zone: 'my-zone',
        path: 'www.example.com/test',
      });
      stubCommon(command, {jsonEnabled: true});

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      stubCdnClient(command, {
        POST: async () => ({
          data: undefined,
          error: {title: 'Bad Request', detail: 'Invalid path format'},
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
