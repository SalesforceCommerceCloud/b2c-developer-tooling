/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';

import {matchGlob} from '../xml-validation/index.js';

// Verifies the minimal glob matcher used to decide whether an opened file is a
// B2C metadata XML (and therefore worth suggesting the Red Hat XML extension).
// The patterns tested mirror the real shapes contributed in xsd-mappings.json.
suite('xml-validation glob matcher', () => {
  test('`*` matches within a single path segment only', () => {
    assert.ok(matchGlob('sites/RefArch/promotions.xml', '**/sites/*/promotions.xml'));
    // `*` must not cross a path separator.
    assert.ok(!matchGlob('sites/RefArch/nested/promotions.xml', '**/sites/*/promotions.xml'));
  });

  test('`**` matches any number of leading path segments (including none)', () => {
    assert.ok(matchGlob('promotions.xml', '**/promotions.xml'));
    assert.ok(matchGlob('a/b/c/promotions.xml', '**/promotions.xml'));
  });

  test('`**` in the middle spans directories', () => {
    assert.ok(matchGlob('metadata/meta/system-objecttype-extensions.xml', '**/metadata/**/*.xml'));
    assert.ok(matchGlob('metadata/x/y/z/anything.xml', '**/metadata/**/*.xml'));
  });

  test('non-matching filenames are rejected', () => {
    assert.ok(!matchGlob('sites/RefArch/inventory.xml', '**/sites/*/promotions.xml'));
    assert.ok(!matchGlob('promotions.json', '**/promotions.xml'));
  });

  test('literal dots are escaped (not treated as regex wildcards)', () => {
    assert.ok(!matchGlob('promotionsxxml', '**/promotions.xml'));
  });

  test('backslash path separators are normalized to forward slashes', () => {
    assert.ok(matchGlob('sites\\RefArch\\promotions.xml', '**/sites/*/promotions.xml'));
  });
});
