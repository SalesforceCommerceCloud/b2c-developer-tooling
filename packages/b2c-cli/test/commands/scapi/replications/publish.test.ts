/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ReplicationsPublish from '../../../../src/commands/scapi/replications/publish.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks} from '../../../helpers/test-setup.js';

describe('scapi replications publish', () => {
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

    it('publishes product in JSON mode', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', 'product-id': 'PROD-123'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({id: 'proc-123'}), {
          status: 201,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('proc-123');
    });

    it('publishes price table', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', 'price-table-id': 'usd-list-prices'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({id: 'proc-456'}), {
          status: 201,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('proc-456');
    });

    it('publishes private content asset', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(
        command,
        {'tenant-id': 'zzxy_prd', 'content-id': 'hero-banner', 'content-type': 'private', 'site-id': 'RefArch'},
        {},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({id: 'proc-789'}), {
          status: 201,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('proc-789');
    });

    it('publishes shared content asset', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(
        command,
        {
          'tenant-id': 'zzxy_prd',
          'content-id': 'footer-links',
          'content-type': 'shared',
          'library-id': 'SharedLibrary',
        },
        {},
      );
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({id: 'proc-abc'}), {
          status: 201,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = await command.run();
      expect(result.id).to.equal('proc-abc');
    });

    it('displays success message in non-JSON mode', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', 'product-id': 'PROD-123'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      const logStub = sinon.stub(command, 'log');
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({id: 'proc-xyz'}), {
          status: 201,
          headers: {'content-type': 'application/json'},
        }),
      );

      await command.run();
      expect(logStub.calledOnce).to.equal(true);
      expect(logStub.firstCall.args[0]).to.include('proc-xyz');
    });

    it('requires site-id for private content assets', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', 'content-id': 'hero', 'content-type': 'private'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('site-id');
      }
    });

    it('requires library-id for shared content assets', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', 'content-id': 'footer', 'content-type': 'shared'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        expect(errorStub.firstCall.args[0]).to.include('library-id');
      }
    });

    it('handles 422 error when not on staging', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', 'product-id': 'PROD-123'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            title: 'Unprocessable Entity',
            detail: 'Granular replication can only be initiated from staging instances',
          }),
          {status: 422, headers: {'content-type': 'application/json'}},
        ),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });

    it('handles 409 conflict during replication', async () => {
      const command: any = new ReplicationsPublish([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', 'product-id': 'PROD-123'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon
        .stub(globalThis, 'fetch')
        .resolves(
          new Response(
            JSON.stringify({title: 'Conflict', detail: 'Cannot queue items while full replication is running'}),
            {status: 409, headers: {'content-type': 'application/json'}},
          ),
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
