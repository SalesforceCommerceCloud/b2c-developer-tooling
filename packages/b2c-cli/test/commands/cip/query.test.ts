/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import CipQuery from '../../../src/commands/cip/query.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('cip query', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>): Promise<any> {
    return createTestCommand(CipQuery, hooks.getConfig(), flags, args);
  }

  it('executes SQL query and returns data in JSON mode', async () => {
    const command = await createCommand({json: true}, {sql: 'SELECT 1 as num'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockClient = {
      query: sinon.stub().resolves({
        columns: ['num'],
        rows: [{num: 1}],
        rowCount: 1,
      }),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.sql).to.equal('SELECT 1 as num');
    expect(result.columns).to.deep.equal(['num']);
    expect(result.rowCount).to.equal(1);
  });

  it('throws error when no SQL is provided', async () => {
    const command = await createCommand({}, {});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('No SQL provided');
    }
  });

  it('throws error when multiple SQL sources are provided', async () => {
    const command = await createCommand({file: 'query.sql'}, {sql: 'SELECT 1'});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('exactly one source');
    }
  });

  it('replaces FROM and TO placeholders in SQL', async () => {
    const command = await createCommand(
      {json: true, from: '2025-01-01', to: '2025-01-31'},
      {sql: 'SELECT * FROM orders WHERE date BETWEEN <FROM> AND <TO>'},
    );

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockClient = {
      query: sinon.stub().resolves({
        columns: ['order_id'],
        rows: [{order_id: 1}],
        rowCount: 1,
      }),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.sql).to.include('2025-01-01');
    expect(result.sql).to.include('2025-01-31');
    expect(result.sql).to.not.include('<FROM>');
    expect(result.sql).to.not.include('<TO>');
  });

  it('outputs JSON format when format flag is json', async () => {
    const command = await createCommand({format: 'json'}, {sql: 'SELECT 1'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(process.stdout, 'write');

    const mockClient = {
      query: sinon.stub().resolves({
        columns: ['num'],
        rows: [{num: 1}],
        rowCount: 1,
      }),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.sql).to.equal('SELECT 1');
  });

  it('outputs CSV format when format flag is csv', async () => {
    const command = await createCommand({format: 'csv'}, {sql: 'SELECT 1'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(process.stdout, 'write');

    const mockClient = {
      query: sinon.stub().resolves({
        columns: ['num'],
        rows: [{num: 1}],
        rowCount: 1,
      }),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.sql).to.equal('SELECT 1');
  });
});
