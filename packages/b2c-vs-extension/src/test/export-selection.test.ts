/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {ExportSelection, SITE_FLAGS} from '../export-tree/export-selection.js';

suite('ExportSelection', () => {
  test('starts empty and toDataUnits returns an empty object', () => {
    const sel = new ExportSelection();
    assert.strictEqual(sel.isEmpty(), true);
    assert.deepStrictEqual(sel.toDataUnits(), {});
  });

  test('simple categories produce Record<id, true>', () => {
    const sel = new ExportSelection();
    sel.toggleSimple('catalogs', 'storefront-catalog', true);
    sel.toggleSimple('catalogs', 'master-catalog', true);
    sel.toggleSimple('libraries', 'SiteGenesisSharedLibrary', true);

    assert.strictEqual(sel.isEmpty(), false);
    assert.deepStrictEqual(sel.toDataUnits(), {
      catalogs: {'master-catalog': true, 'storefront-catalog': true},
      libraries: {SiteGenesisSharedLibrary: true},
    });
  });

  test('unchecking a simple id removes it; emptying a category omits the group', () => {
    const sel = new ExportSelection();
    sel.toggleSimple('catalogs', 'c1', true);
    sel.toggleSimple('catalogs', 'c1', false);

    assert.strictEqual(sel.isSimpleChecked('catalogs', 'c1'), false);
    assert.deepStrictEqual(sel.toDataUnits(), {});
  });

  test('checking a site selects all of its data', () => {
    const sel = new ExportSelection();
    sel.toggleSite('RefArch', true);

    assert.strictEqual(sel.isSiteChecked('RefArch'), true);
    assert.strictEqual(sel.isSiteFlagChecked('RefArch', 'content'), true);
    assert.deepStrictEqual(sel.toDataUnits(), {sites: {RefArch: {all: true}}});
  });

  test('unchecking a flag on an all-selected site expands to all-except-that-flag', () => {
    const sel = new ExportSelection();
    sel.toggleSite('RefArch', true);
    sel.toggleSiteFlag('RefArch', 'content', false);

    assert.strictEqual(sel.isSiteFlagChecked('RefArch', 'content'), false);
    assert.strictEqual(sel.isSiteFlagChecked('RefArch', 'coupons'), true);

    const units = sel.toDataUnits();
    const refarch = units.sites?.RefArch as Record<string, boolean>;
    assert.strictEqual(refarch.all, undefined);
    assert.strictEqual(refarch.content, undefined);
    assert.strictEqual(refarch.coupons, true);
    // All flags except the one removed.
    assert.strictEqual(Object.keys(refarch).length, SITE_FLAGS.length - 1);
  });

  test('selecting individual site flags builds a partial site config', () => {
    const sel = new ExportSelection();
    sel.toggleSiteFlag('RefArch', 'content', true);
    sel.toggleSiteFlag('RefArch', 'site_preferences', true);

    assert.strictEqual(sel.isSiteChecked('RefArch'), true);
    assert.deepStrictEqual(sel.toDataUnits(), {
      sites: {RefArch: {content: true, site_preferences: true}},
    });
  });

  test('unchecking the last site flag removes the site entirely', () => {
    const sel = new ExportSelection();
    sel.toggleSiteFlag('RefArch', 'content', true);
    sel.toggleSiteFlag('RefArch', 'content', false);

    assert.strictEqual(sel.isSiteChecked('RefArch'), false);
    assert.deepStrictEqual(sel.toDataUnits(), {});
  });

  test('global data: whole-group and per-flag selection', () => {
    const all = new ExportSelection();
    all.toggleGlobal(true);
    assert.strictEqual(all.isGlobalFlagChecked('meta_data'), true);
    assert.deepStrictEqual(all.toDataUnits(), {global_data: {all: true}});

    const partial = new ExportSelection();
    partial.toggleGlobalFlag('meta_data', true);
    partial.toggleGlobalFlag('custom_types', true);
    assert.deepStrictEqual(partial.toDataUnits(), {
      global_data: {custom_types: true, meta_data: true},
    });
  });

  test('setSimpleAll toggles a whole list of ids', () => {
    const sel = new ExportSelection();
    sel.setSimpleAll('catalogs', ['a', 'b', 'c'], true);
    assert.deepStrictEqual(sel.toDataUnits(), {catalogs: {a: true, b: true, c: true}});

    sel.setSimpleAll('catalogs', ['a', 'b', 'c'], false);
    assert.strictEqual(sel.isEmpty(), true);
  });

  test('clear() resets everything', () => {
    const sel = new ExportSelection();
    sel.toggleSimple('catalogs', 'c1', true);
    sel.toggleSite('RefArch', true);
    sel.toggleGlobal(true);

    sel.clear();
    assert.strictEqual(sel.isEmpty(), true);
    assert.deepStrictEqual(sel.toDataUnits(), {});
  });
});
