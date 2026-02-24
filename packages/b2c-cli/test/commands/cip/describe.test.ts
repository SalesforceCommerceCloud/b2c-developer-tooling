/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import CipDescribe from '../../../src/commands/cip/describe.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('cip describe', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>): Promise<any> {
    return createTestCommand(CipDescribe, hooks.getConfig(), flags, args);
  }

  it('describes a table and returns data in JSON mode', async () => {
    const command = await createCommand({json: true}, {table: 'orders'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockQueryResult = {
      rows: [
        {
          tableSchem: 'warehouse',
          tableName: 'orders',
          columnName: 'order_id',
          typeName: 'VARCHAR',
          isNullable: 'NO',
          ordinalPosition: 1,
        },
        {
          tableSchem: 'warehouse',
          tableName: 'orders',
          columnName: 'total',
          typeName: 'DECIMAL',
          isNullable: 'YES',
          ordinalPosition: 2,
        },
      ],
      columns: [],
      rowCount: 2,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };
    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.tableName).to.equal('orders');
    expect(result.columnCount).to.equal(2);
    expect(result.columns).to.have.lengthOf(2);
    expect(result.columns[0]).to.deep.include({
      column: 'order_id',
      dataType: 'VARCHAR',
    });
  });

  it('throws error when no columns are found', async () => {
    const command = await createCommand({}, {table: 'nonexistent'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);

    const mockQueryResult = {
      rows: [],
      columns: [],
      rowCount: 0,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };
    sinon.stub(command, 'getCipClient').returns(mockClient);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('No columns found');
    }
  });

  it('outputs JSON format when format flag is json', async () => {
    const command = await createCommand({format: 'json'}, {table: 'products'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(process.stdout, 'write');

    const mockQueryResult = {
      rows: [
        {
          tableSchem: 'warehouse',
          tableName: 'products',
          columnName: 'product_id',
          typeName: 'VARCHAR',
          isNullable: 'NO',
          ordinalPosition: 1,
        },
      ],
      columns: [],
      rowCount: 1,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };
    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.tableName).to.equal('products');
  });

  it('outputs CSV format when format flag is csv', async () => {
    const command = await createCommand({format: 'csv'}, {table: 'customers'});

    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(process.stdout, 'write');

    const mockQueryResult = {
      rows: [
        {
          tableSchem: 'warehouse',
          tableName: 'customers',
          columnName: 'customer_id',
          typeName: 'VARCHAR',
          isNullable: 'NO',
          ordinalPosition: 1,
        },
      ],
      columns: [],
      rowCount: 1,
    };

    const mockClient = {
      query: sinon.stub().resolves(mockQueryResult),
    };
    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.tableName).to.equal('customers');
  });
});
