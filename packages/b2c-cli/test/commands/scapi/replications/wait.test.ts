/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ReplicationsWait from '../../../../src/commands/scapi/replications/wait.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../../helpers/test-setup.js';

describe('scapi replications wait', () => {
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

    it('waits for process to complete', async () => {
      const command: any = new ReplicationsWait([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', timeout: 10, interval: 1}, {'process-id': 'proc-123'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      let callCount = 0;
      sinon.stub(globalThis, 'fetch').callsFake(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              id: 'proc-123',
              status: 'in_progress',
              startTime: '2025-01-01T00:00:00Z',
              initiatedBy: 'user@example.com',
              productItem: {productId: 'PROD-1'},
            }),
            {status: 200, headers: {'content-type': 'application/json'}},
          );
        }
        return new Response(
          JSON.stringify({
            id: 'proc-123',
            status: 'completed',
            startTime: '2025-01-01T00:00:00Z',
            endTime: '2025-01-01T00:05:00Z',
            initiatedBy: 'user@example.com',
            productItem: {productId: 'PROD-1'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        );
      });

      const result = await command.run();
      expect(result.id).to.equal('proc-123');
      expect(result.status).to.equal('completed');
      expect(callCount).to.be.greaterThan(1);
    });

    it('returns failed status', async () => {
      const command: any = new ReplicationsWait([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', timeout: 10, interval: 1}, {'process-id': 'proc-456'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            id: 'proc-456',
            status: 'failed',
            startTime: '2025-01-01T01:00:00Z',
            endTime: '2025-01-01T01:02:00Z',
            initiatedBy: 'user@example.com',
            productItem: {productId: 'PROD-2'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = await command.run();
      expect(result.status).to.equal('failed');
    });

    it('logs status updates in non-JSON mode', async () => {
      const command: any = new ReplicationsWait([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', timeout: 10, interval: 1}, {'process-id': 'proc-789'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      const logStub = sinon.stub(command, 'log');
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            id: 'proc-789',
            status: 'completed',
            startTime: '2025-01-01T02:00:00Z',
            endTime: '2025-01-01T02:05:00Z',
            initiatedBy: 'user@example.com',
            productItem: {productId: 'PROD-3'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      await runSilent(() => command.run());
      expect(logStub.called).to.equal(true);
    });

    it('times out if process does not complete', async () => {
      const command: any = new ReplicationsWait([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', timeout: 0.1, interval: 0.05}, {'process-id': 'proc-timeout'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Timeout error'));

      sinon.stub(globalThis, 'fetch').callsFake(async () => {
        return new Response(
          JSON.stringify({
            id: 'proc-timeout',
            status: 'in_progress',
            startTime: '2025-01-01T03:00:00Z',
            initiatedBy: 'user@example.com',
            productItem: {productId: 'PROD-4'},
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        );
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });

    it('handles API errors during polling', async () => {
      const command: any = new ReplicationsWait([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd', timeout: 10, interval: 1}, {'process-id': 'proc-error'});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});
      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({title: 'Not Found', detail: 'Process not found'}),
          {status: 404, headers: {'content-type': 'application/json'}},
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
