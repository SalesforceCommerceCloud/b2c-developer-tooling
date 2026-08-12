/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {friendlyIdFromHostname} from '../sandbox-tree/active-sandbox.js';

suite('friendlyIdFromHostname', () => {
  test('parses dx.commercecloud hostname', () => {
    assert.strictEqual(friendlyIdFromHostname('zzzz-001.dx.commercecloud.salesforce.com'), 'zzzz-001');
  });

  test('parses unified demandware hostname', () => {
    assert.strictEqual(friendlyIdFromHostname('zzzz-005.test01.dx.unified.demandware.net'), 'zzzz-005');
  });

  test('returns undefined for staging-like non-friendly host', () => {
    assert.strictEqual(friendlyIdFromHostname('staging.demandware.net'), undefined);
  });

  test('returns undefined for production-like host without instance suffix', () => {
    assert.strictEqual(friendlyIdFromHostname('www.example.com'), undefined);
  });

  test('returns undefined for empty or missing hostname', () => {
    assert.strictEqual(friendlyIdFromHostname(undefined), undefined);
    assert.strictEqual(friendlyIdFromHostname(''), undefined);
    assert.strictEqual(friendlyIdFromHostname('   '), undefined);
  });
});
