/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ReplicationsList from '../../../../src/commands/scapi/replications/list.js';
import {stubParse} from '../../../helpers/stub-parse.js';
import {createIsolatedEnvHooks, runSilent} from '../../../helpers/test-setup.js';

describe('scapi replications list', () => {
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

    it('returns processes in JSON mode', async () => {
      const command: any = new ReplicationsList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            total: 2,
            data: [
              {
                id: 'proc-1',
                status: 'completed',
                startTime: '2025-01-01T00:00:00Z',
                initiatedBy: 'user@example.com',
                productItem: {productId: 'PROD-1'},
              },
              {
                id: 'proc-2',
                status: 'in_progress',
                startTime: '2025-01-01T01:00:00Z',
                initiatedBy: 'user@example.com',
                priceTableItem: {priceTableId: 'table-1'},
              },
            ],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = await command.run();
      expect(result.total).to.equal(2);
      expect(result.data).to.have.lengthOf(2);
      expect(result.data[0].id).to.equal('proc-1');
    });

    it('displays processes in non-JSON mode', async () => {
      const command: any = new ReplicationsList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(
          JSON.stringify({
            total: 1,
            data: [
              {
                id: 'proc-1',
                status: 'completed',
                startTime: '2025-01-01T00:00:00Z',
                initiatedBy: 'user@example.com',
                productItem: {productId: 'PROD-1'},
              },
            ],
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      );

      const result = (await runSilent(() => command.run())) as {total: number};
      expect(result.total).to.equal(1);
    });

    it('handles empty result set', async () => {
      const command: any = new ReplicationsList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
      await command.init();

      sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'}}));
      sinon.stub(command, 'getOAuthStrategy').returns({getAuthorizationHeader: async () => 'Bearer test'});

      sinon.stub(globalThis, 'fetch').resolves(
        new Response(JSON.stringify({total: 0, data: []}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      );

      const result = await command.run();
      expect(result.total).to.equal(0);
      expect(result.data).to.have.lengthOf(0);
    });

    it('handles API errors', async () => {
      const command: any = new ReplicationsList([], config);
      stubParse(command, {'tenant-id': 'zzxy_prd'}, {});
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
