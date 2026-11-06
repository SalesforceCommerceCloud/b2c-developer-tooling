/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import {owningPageId, pageDesignerUrl, type PageLookupNode} from '../content-tree/page-designer-link.js';

suite('Page Designer link', () => {
  test('builds the Business Manager editor URL', () => {
    assert.strictEqual(
      pageDesignerUrl('my-sandbox.example.com', 'RefArch', 'homepage'),
      'https://my-sandbox.example.com/on/demandware.store/Sites-Site/default%3bapp%3d__bm_merchant%3bsite%3dRefArch' +
        '/ViewLdsBusinessManagerScreen-PageDesigner?SelectedMenuItem=content_pages' +
        '&ModulePipeline=ViewLdsBusinessManagerScreen&ModulePipelineStart=PageDesigner#/edit/page/homepage',
    );
  });

  test('accepts a hostname with scheme and trailing slash, and encodes IDs', () => {
    const url = pageDesignerUrl('https://my-sandbox.example.com/', 'Ref Arch', 'summer sale');
    assert.ok(url.startsWith('https://my-sandbox.example.com/on/'));
    assert.ok(url.includes('site%3dRef%20Arch/'));
    assert.ok(url.endsWith('#/edit/page/summer%20sale'));
  });

  test('finds the page of a page or nested component', () => {
    const page: PageLookupNode = {id: 'homepage', type: 'PAGE', parent: null};
    const outer: PageLookupNode = {id: 'c1', type: 'COMPONENT', parent: page};
    const inner: PageLookupNode = {id: 'c2', type: 'COMPONENT', parent: outer};
    assert.strictEqual(owningPageId(page), 'homepage');
    assert.strictEqual(owningPageId(inner), 'homepage');
    assert.strictEqual(owningPageId({id: 'c3', type: 'COMPONENT', parent: null}), undefined);
    assert.strictEqual(owningPageId({id: 'a', type: 'CONTENT', parent: null}), undefined);
    assert.strictEqual(owningPageId(undefined), undefined);
  });
});
