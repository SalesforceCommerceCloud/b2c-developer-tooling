/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {buildSql, quoteIdent} from '../../webview-ui/query-builder/buildSql.js';

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
    assert.equal(sql, 'SELECT *\nFROM ccdw_aggr_sales_summary');
  });

  test('joins selected fields with commas, no quoting for plain snake_case', () => {
    const sql = buildSql({
      currentTable: 'orders_fact',
      selectedFields: ['id', 'created_at'],
      filters: [],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.equal(sql, 'SELECT id, created_at\nFROM orders_fact');
  });

  test('quotes reserved-word identifiers in SELECT, FROM, WHERE, and ORDER BY', () => {
    // `method`, `value`, `time` are reserved on Avatica/Phoenix and surface
    // as column names on OCAPI/SCAPI fact tables. `order` is reserved as a
    // table name. Without quoting Avatica rejects the query.
    const sql = buildSql({
      currentTable: 'order',
      selectedFields: ['method', 'value', 'time'],
      filters: [{column: 'method', operator: '=', value: 'GET'}],
      filterLogic: 'AND',
      orderBy: [{column: 'time', direction: 'DESC'}],
      limit: null,
    });
    assert.match(sql, /SELECT "method", "value", "time"/);
    assert.match(sql, /FROM "order"/);
    assert.match(sql, /WHERE "method" = 'GET'/);
    assert.match(sql, /ORDER BY "time" DESC$/);
  });

  test('mixes plain and reserved identifiers in the same query', () => {
    const sql = buildSql({
      currentTable: 'ccdw_fact_ocapi_request',
      selectedFields: ['site_id', 'method', 'response_time_ms'],
      filters: [
        {column: 'site_id', operator: '=', value: 'RefArch'},
        {column: 'method', operator: '=', value: 'POST'},
      ],
      filterLogic: 'AND',
      orderBy: [],
      limit: 100,
    });
    assert.match(sql, /SELECT site_id, "method", response_time_ms/);
    assert.match(sql, /FROM ccdw_fact_ocapi_request/);
    assert.match(sql, /WHERE site_id = 'RefArch' AND "method" = 'POST'/);
    assert.match(sql, /LIMIT 100$/);
  });

  test('reserved-word matching is case-insensitive', () => {
    assert.equal(quoteIdent('METHOD'), '"METHOD"');
    assert.equal(quoteIdent('Method'), '"Method"');
    assert.equal(quoteIdent('method'), '"method"');
  });

  test('quotes identifiers that contain uppercase letters or special chars', () => {
    // Mixed-case isn't itself reserved, but Avatica folds unquoted identifiers
    // to a canonical case — quoting preserves the user's intent.
    assert.equal(quoteIdent('CustomerId'), '"CustomerId"');
    assert.equal(quoteIdent('order total'), '"order total"');
    assert.equal(quoteIdent('1stRow'), '"1stRow"');
  });

  test('escapes embedded double quotes in identifiers', () => {
    assert.equal(quoteIdent('weird"name'), '"weird""name"');
  });

  test('handles schema-qualified names per segment', () => {
    // Each dot-separated segment is checked independently — only segments
    // that need it get quoted.
    assert.equal(quoteIdent('myschema.customer_id'), 'myschema.customer_id');
    assert.equal(quoteIdent('myschema.method'), 'myschema."method"');
    assert.equal(quoteIdent('order.method'), '"order"."method"');
  });

  test('quotes string filter values and escapes embedded single quotes', () => {
    const sql = buildSql({
      currentTable: 'orders_fact',
      selectedFields: [],
      filters: [{column: 'site_id', operator: '=', value: "Mc'Donald"}],
      filterLogic: 'AND',
      orderBy: [],
      limit: null,
    });
    assert.match(sql, /WHERE site_id = 'Mc''Donald'/);
  });

  test('does not quote numeric filter values', () => {
    const sql = buildSql({
      currentTable: 'orders_fact',
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
      currentTable: 'orders_fact',
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
      currentTable: 'orders_fact',
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
      currentTable: 'orders_fact',
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
      currentTable: 'orders_fact',
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
      currentTable: 'orders_fact',
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
