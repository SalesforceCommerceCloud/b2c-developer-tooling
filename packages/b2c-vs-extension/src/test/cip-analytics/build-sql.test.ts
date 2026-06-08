/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {buildSql} from '../../webview-ui/query-builder/buildSql.js';

suite('buildSql', () => {
  test('returns placeholder when no table is chosen', () => {
    const sql = buildSql({
      currentTable: null,
      selectedFields: [],
      filters: [],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.ok(sql.startsWith('--'), 'placeholder should start with comment');
  });

  test('uses SELECT * when no fields selected', () => {
    const sql = buildSql({
      currentTable: 'ccdw_aggr_sales_summary',
      selectedFields: [],
      filters: [],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /^SELECT \*\nFROM ccdw_aggr_sales_summary$/);
  });

  test('joins selected fields with commas', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: ['id', 'created_at'],
      filters: [],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.equal(sql, 'SELECT id, created_at\nFROM orders');
  });

  test('quotes string values and escapes embedded quotes', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: [],
      filters: [{column: 'site_id', operator: '=', value: "Mc'Donald"}],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /WHERE site_id = 'Mc''Donald'/);
  });

  test('does not quote numeric values', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: [],
      filters: [{column: 'qty', operator: '>', value: '5'}],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /WHERE qty > 5$/);
  });

  test('IS NULL operator emits no value', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: [],
      filters: [{column: 'shipped_at', operator: 'IS NULL', value: ''}],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /WHERE shipped_at IS NULL$/);
  });

  test('IN operator wraps the raw value in parens', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: [],
      filters: [{column: 'status', operator: 'IN', value: "'open','paid'"}],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /WHERE status IN \('open','paid'\)$/);
  });

  test('joins multiple filters with the chosen logic', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: [],
      filters: [
        {column: 'a', operator: '=', value: '1'},
        {column: 'b', operator: '=', value: '2'},
      ],
      filterLogic: 'OR',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /WHERE a = 1 OR b = 2$/);
  });

  test('drops filter rows with empty column', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: [],
      filters: [
        {column: '', operator: '=', value: '1'},
        {column: 'a', operator: '=', value: '2'},
      ],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /WHERE a = 2$/);
  });

  test('emits ORDER BY and LIMIT when supplied', () => {
    const sql = buildSql({
      currentTable: 'orders',
      selectedFields: [],
      filters: [],
      filterLogic: 'AND',
      orderBy: [
        {column: 'created_at', direction: 'DESC'},
        {column: 'id', direction: 'ASC'},
      ],
      limit: 50,
    });
    assert.match(sql, /ORDER BY created_at DESC, id ASC\nLIMIT 50$/);
  });
});
