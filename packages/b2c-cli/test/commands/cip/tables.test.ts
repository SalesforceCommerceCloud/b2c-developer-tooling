/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import CipTables from '../../../src/commands/cip/tables.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('cip tables', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(CipTables, hooks.getConfig(), flags, {});
  }

  it('lists tables and returns data in JSON mode', async () => {
    const command = await createCommand({json: true, schema: 'warehouse'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockQueryResult = {
      rows: [
        {tableSchem: 'warehouse', tableName: 'orders', tableType: 'TABLE'},
        {tableSchem: 'warehouse', tableName: 'products', tableType: 'TABLE'},
      ],
      columns: [],
      rowCount: 2,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.schema).to.equal('warehouse');
    expect(result.tableCount).to.equal(2);
    expect(result.tables).to.have.lengthOf(2);
    expect(result.tables[0]).to.deep.include({
      table: 'orders',
      type: 'TABLE',
    });
  });

  it('filters tables by pattern', async () => {
    const command = await createCommand({json: true, pattern: 'order%', schema: 'warehouse'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockQueryResult = {
      rows: [{tableSchem: 'warehouse', tableName: 'orders', tableType: 'TABLE'}],
      columns: [],
      rowCount: 1,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.tableCount).to.equal(1);
    expect(result.tables[0].table).to.equal('orders');
  });

  it('includes all table types when --all flag is set', async () => {
    const command = await createCommand({json: true, all: true, schema: 'warehouse'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockQueryResult = {
      rows: [
        {tableSchem: 'warehouse', tableName: 'orders', tableType: 'TABLE'},
        {tableSchem: 'warehouse', tableName: 'orders_view', tableType: 'VIEW'},
      ],
      columns: [],
      rowCount: 2,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.tableCount).to.equal(2);
    const types = result.tables.map((t: any) => t.type);
    expect(types).to.include('TABLE');
    expect(types).to.include('VIEW');
  });

  it('outputs JSON format when format flag is json', async () => {
    const command = await createCommand({format: 'json', schema: 'warehouse'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(process.stdout, 'write');

    const mockQueryResult = {
      rows: [{tableSchem: 'warehouse', tableName: 'orders', tableType: 'TABLE'}],
      columns: [],
      rowCount: 1,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.tableCount).to.equal(1);
  });

  it('outputs CSV format when format flag is csv', async () => {
    const command = await createCommand({format: 'csv', schema: 'warehouse'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(process.stdout, 'write');

    const mockQueryResult = {
      rows: [{tableSchem: 'warehouse', tableName: 'orders', tableType: 'TABLE'}],
      columns: [],
      rowCount: 1,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.tableCount).to.equal(1);
  });
});
