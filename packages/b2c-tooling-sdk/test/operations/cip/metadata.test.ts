/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describeCipTable, listCipTables} from '@salesforce/b2c-tooling-sdk/operations/cip';
import type {CipClient} from '../../../src/clients/cip.js';

describe('operations/cip metadata', () => {
  it('lists tables from metadata catalog', async () => {
    const calls: Array<{options: unknown; sql: string}> = [];
    const client = {
      query: async (sql: string, options: unknown) => {
        calls.push({sql, options});
        return {
          columns: ['tableSchem', 'tableName', 'tableType'],
          rowCount: 2,
          rows: [
            {tableName: 'ccdw_aggr_sales_summary', tableSchem: 'warehouse', tableType: 'TABLE'},
            {tableName: 'ccdw_dim_site', tableSchem: 'warehouse', tableType: 'TABLE'},
          ],
        };
      },
    } as unknown as CipClient;

    const result = await listCipTables(client, {
      fetchSize: 500,
      schema: 'warehouse',
      tableNamePattern: 'ccdw_%',
      tableType: 'TABLE',
    });

    expect(result.tableCount).to.equal(2);
    expect(result.tables[0]?.tableSchema).to.equal('warehouse');
    expect(result.tables[0]?.tableName).to.equal('ccdw_aggr_sales_summary');
    expect(calls).to.have.length(1);
    expect(calls[0]?.sql).to.include('FROM metadata.TABLES');
    expect(calls[0]?.sql).to.include("tableSchem = 'warehouse'");
    expect(calls[0]?.sql).to.include("tableName LIKE 'ccdw_%'");
    expect(calls[0]?.sql).to.include("tableType = 'TABLE'");
    expect((calls[0]?.options as {fetchSize?: number})?.fetchSize).to.equal(500);
  });

  it('describes table columns from metadata catalog', async () => {
    const calls: Array<{options: unknown; sql: string}> = [];
    const client = {
      query: async (sql: string, options: unknown) => {
        calls.push({sql, options});
        return {
          columns: ['columnName', 'typeName', 'isNullable', 'ordinalPosition', 'tableName', 'tableSchem'],
          rowCount: 2,
          rows: [
            {
              columnName: 'request_date',
              isNullable: 'NO',
              ordinalPosition: 1,
              tableName: 'ccdw_aggr_ocapi_request',
              tableSchem: 'warehouse',
              typeName: 'TIMESTAMP(3) NOT NULL',
            },
            {
              columnName: 'api_name',
              isNullable: 'YES',
              ordinalPosition: 2,
              tableName: 'ccdw_aggr_ocapi_request',
              tableSchem: 'warehouse',
              typeName: 'VARCHAR(8)',
            },
          ],
        };
      },
    } as unknown as CipClient;

    const result = await describeCipTable(client, 'ccdw_aggr_ocapi_request', {
      fetchSize: 250,
      schema: 'warehouse',
    });

    expect(result.columnCount).to.equal(2);
    expect(result.columns[0]?.columnName).to.equal('request_date');
    expect(result.columns[0]?.isNullable).to.equal(false);
    expect(result.columns[1]?.isNullable).to.equal(true);
    expect(calls).to.have.length(1);
    expect(calls[0]?.sql).to.include('FROM metadata.COLUMNS');
    expect(calls[0]?.sql).to.include("tableSchem = 'warehouse'");
    expect(calls[0]?.sql).to.include("tableName = 'ccdw_aggr_ocapi_request'");
    expect((calls[0]?.options as {fetchSize?: number})?.fetchSize).to.equal(250);
  });
});
