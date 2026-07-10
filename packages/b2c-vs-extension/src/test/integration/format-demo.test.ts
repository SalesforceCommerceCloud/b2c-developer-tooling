/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import {formatIsmlText} from '../../isml/formatting.js';
import type * as vscode from 'vscode';

const OPTS = {tabSize: 4, insertSpaces: true} as vscode.FormattingOptions;

// A deliberately-messy real-world-shaped ISML doc: bad indentation, bare
// <iselse>, mixed void tags, ${} with > operators, an <isscript> body, and a
// </iselse>-looking string inside the script that MUST survive.
const MESSY = [
  '<isdecorate template="common/layout/page">',
  '<isscript>',
  '    var marker = "</iselse>"; // must not be touched',
  '</isscript>',
  '<isif condition="${pdict.items.length > 0}">',
  '<isloop items="${pdict.items}" var="item">',
  '<isprint value="${item.name}" encoding="off" />',
  '</isloop>',
  '<iselse>',
  '<p>none</p>',
  '</isif>',
  '</isdecorate>',
].join('\n');

suite('ISML formatter — sample reformatting (demo)', () => {
  test('reformats a messy real-world-shaped document', () => {
    const out = formatIsmlText(MESSY, OPTS);
    console.log('\n===== BEFORE =====\n' + MESSY + '\n===== AFTER =====\n' + out + '\n==================\n');

    // Structural expectations:
    assert.ok(out.includes('\n    <isscript>'), 'isscript indented under isdecorate');
    assert.ok(out.includes('var marker = "</iselse>";'), 'script string literal preserved verbatim');
    assert.ok(/\n {4}<isif /.test(out), 'isif indented one level');
    assert.ok(/\n {8}<isloop /.test(out), 'isloop indented two levels');
    assert.ok(/\n {4}<iselse\/>/.test(out), 'bare <iselse> normalized + aligned to its <isif>');
    assert.ok(out.includes('encoding="off"/>'), 'void tag spacing normalized');
    assert.ok(out.includes('${pdict.items.length > 0}'), 'expression left verbatim');
  });

  test('is idempotent on already-well-formatted output', () => {
    const once = formatIsmlText(MESSY, OPTS);
    const twice = formatIsmlText(once, OPTS);
    assert.strictEqual(twice, once, 'formatting formatted output should be a no-op');
  });
});

// Larger, real-world-modeled document (shaped after account/order/orderItems.isml
// in b2c-commerce-industries): an <iselseif> chain, void control tags
// (<isbreak/>, <iscontinue/>), an <isscript> block whose body must stay verbatim
// and whose closer must align to its opener, and multi-level nesting. Asserts the
// EXACT formatted output so indentation nuances are locked down.
const ORDER_ITEMS_MESSY = [
  '<isloop items="${orderItems}" var="orderItem" status="s">',
  '<isif condition="${s.count > 5}">',
  '<isbreak/>',
  '</isif>',
  '<isif condition="${item.status === P.returned}">',
  '<isset name="qty" value="${item.qtyReturned}" scope="page"/>',
  '<iselseif condition="${item.status === P.cancelled}"/>',
  '<isset name="qty" value="${item.qtyCancelled}" scope="page"/>',
  '</isif>',
  '<isscript>',
  '    var url = null;',
  '    if (product) {',
  '        url = URLUtils.url("Product-Show", "pid", product.ID);',
  '    }',
  '</isscript>',
  '<isif condition="${empty(product)}">',
  '<iscontinue/>',
  '</isif>',
  '</isloop>',
].join('\n');

const ORDER_ITEMS_EXPECTED = [
  '<isloop items="${orderItems}" var="orderItem" status="s">',
  '    <isif condition="${s.count > 5}">',
  '        <isbreak/>',
  '    </isif>',
  '    <isif condition="${item.status === P.returned}">',
  '        <isset name="qty" value="${item.qtyReturned}" scope="page"/>',
  '    <iselseif condition="${item.status === P.cancelled}"/>',
  '        <isset name="qty" value="${item.qtyCancelled}" scope="page"/>',
  '    </isif>',
  '    <isscript>',
  '    var url = null;',
  '    if (product) {',
  '        url = URLUtils.url("Product-Show", "pid", product.ID);',
  '    }',
  '    </isscript>',
  '    <isif condition="${empty(product)}">',
  '        <iscontinue/>',
  '    </isif>',
  '</isloop>',
].join('\n');

suite('ISML formatter — larger document (indentation nuances)', () => {
  test('formats a nested loop with iselseif chain, void tags, and isscript', () => {
    const out = formatIsmlText(ORDER_ITEMS_MESSY, OPTS);
    assert.strictEqual(out, ORDER_ITEMS_EXPECTED);
  });

  test('the <isscript> body is preserved verbatim but its closer aligns to the opener', () => {
    const out = formatIsmlText(ORDER_ITEMS_MESSY, OPTS);
    // Opener and closer both at 4 spaces (inside the isloop):
    assert.ok(out.includes('\n    <isscript>\n'), 'isscript opener aligned');
    assert.ok(out.includes('\n    </isscript>\n'), 'isscript closer aligned to opener');
    // Body indentation is the author's, untouched (the `if` block keeps its shape):
    assert.ok(out.includes('\n    var url = null;\n'), 'script body line preserved verbatim');
    assert.ok(out.includes('\n        url = URLUtils.url'), 'nested script line preserved verbatim');
  });

  test('is idempotent (our ISML passes do not drift on a second format)', () => {
    const once = formatIsmlText(ORDER_ITEMS_MESSY, OPTS);
    const twice = formatIsmlText(once, OPTS);
    assert.strictEqual(twice, once, 'second format must be a no-op');
  });
});
