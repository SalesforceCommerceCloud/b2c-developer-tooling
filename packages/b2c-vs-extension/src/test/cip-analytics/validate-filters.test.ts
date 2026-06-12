/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {findIncompleteFilter} from '../../webview-ui/query-builder/validateFilters.js';

suite('findIncompleteFilter', () => {
  test('returns null when there are no filters', () => {
    assert.equal(findIncompleteFilter([]), null);
  });

  test('returns null for a fully-formed filter', () => {
    assert.equal(findIncompleteFilter([{column: 'site_id', operator: '=', value: 'RefArch'}]), null);
  });

  test('ignores rows with no column (buildSql drops them too)', () => {
    assert.equal(findIncompleteFilter([{column: '', operator: '=', value: ''}]), null);
  });

  test('flags an empty value on a normal operator', () => {
    const msg = findIncompleteFilter([{column: 'is_active', operator: '=', value: ''}]);
    assert.match(msg ?? '', /"is_active".*missing a value/);
  });

  test('IS NULL / IS NOT NULL never need a value', () => {
    assert.equal(findIncompleteFilter([{column: 'shipped_at', operator: 'IS NULL', value: ''}]), null);
    assert.equal(findIncompleteFilter([{column: 'shipped_at', operator: 'IS NOT NULL', value: ''}]), null);
  });

  test('BETWEEN requires both bounds', () => {
    const a = findIncompleteFilter([{column: 'submit_date', operator: 'BETWEEN', value: '2026-01-01'}]);
    assert.match(a ?? '', /"submit_date".*both.*from.*to/);
    const b = findIncompleteFilter([{column: 'submit_date', operator: 'BETWEEN', value: '', valueTo: '2026-01-31'}]);
    assert.match(b ?? '', /"submit_date".*both.*from.*to/);
    const ok = findIncompleteFilter([
      {column: 'submit_date', operator: 'BETWEEN', value: '2026-01-01', valueTo: '2026-01-31'},
    ]);
    assert.equal(ok, null);
  });

  test('returns the FIRST incomplete row when multiple are bad', () => {
    const msg = findIncompleteFilter([
      {column: 'site_id', operator: '=', value: 'RefArch'},
      {column: 'is_active', operator: '=', value: ''},
      {column: 'qty', operator: '>', value: ''},
    ]);
    assert.match(msg ?? '', /"is_active"/);
  });
});
