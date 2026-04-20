/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ReplicationsGet from '../../../../src/commands/scapi/replications/get.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../../helpers/test-setup.js';

describe('scapi replications get', () => {
  const hooks = createIsolatedEnvHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  describe('run', () => {
    let config: Config;

    beforeEach(async () => {
      config = await Config.load();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('returns process details in JSON mode', async () => {
      const command: any = new ReplicationsGet([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {'process-id': 'proc-123'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            id: 'proc-123',
            status: 'completed',
            startTime: '2025-01-01T00:00:00Z',
            endTime: '2025-01-01T00:05:00Z',
            initiatedBy: 'user@example.com',
            productItem: {productId: 'PROD-1'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = await command.run();
      expect(result.id).to.equal('proc-123');
      expect(result.status).to.equal('completed');
      expect(result.productItem?.productId).to.equal('PROD-1');
    });

    it('displays process details in non-JSON mode', async () => {
      const command: any = new ReplicationsGet([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {'process-id': 'proc-456'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            id: 'proc-456',
            status: 'in_progress',
            startTime: '2025-01-01T01:00:00Z',
            initiatedBy: 'admin@example.com',
            priceTableItem: {priceTableId: 'usd-list-prices'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = (await runSilent(() => command.run())) as {id: string; status: string};
      expect(result.id).to.equal('proc-456');
      expect(result.status).to.equal('in_progress');
    });

    it('displays private content asset details', async () => {
      const command: any = new ReplicationsGet([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {'process-id': 'proc-789'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            id: 'proc-789',
            status: 'completed',
            startTime: '2025-01-01T02:00:00Z',
            endTime: '2025-01-01T02:03:00Z',
            initiatedBy: 'user@example.com',
            contentAssetItem: {contentId: 'hero-banner', type: 'private', siteId: 'RefArch'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = (await runSilent(() => command.run())) as any;
      expect(result.contentAssetItem?.contentId).to.equal('hero-banner');
      expect(result.contentAssetItem?.type).to.equal('private');
      expect(result.contentAssetItem?.siteId).to.equal('RefArch');
    });

    it('displays shared content asset details', async () => {
      const command: any = new ReplicationsGet([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {'process-id': 'proc-abc'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            id: 'proc-abc',
            status: 'completed',
            startTime: '2025-01-01T03:00:00Z',
            endTime: '2025-01-01T03:02:00Z',
            initiatedBy: 'user@example.com',
            contentAssetItem: {contentId: 'footer-links', type: 'shared', libraryId: 'SharedLibrary'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = (await runSilent(() => command.run())) as any;
      expect(result.contentAssetItem?.contentId).to.equal('footer-links');
      expect(result.contentAssetItem?.type).to.equal('shared');
      expect(result.contentAssetItem?.libraryId).to.equal('SharedLibrary');
    });

    it('handles 404 for nonexistent process', async () => {
      const command: any = new ReplicationsGet([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {'process-id': 'invalid'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({title: 'Not Found', detail: 'Process not found'}), {
          status: 404,
          headers: {'content-type': 'application/json'},
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });

    it('handles API errors', async () => {
      const command: any = new ReplicationsGet([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {'process-id': 'proc-123'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({title: 'Forbidden', detail: 'Feature not enabled'}), {
          status: 403,
          headers: {'content-type': 'application/json'},
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });
  });
});
