/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Focused ISML formatter behavior tests. The full before/after examples live as
 * vendored fixtures (src/test/fixtures/format/*.isml + .expected.isml, checked by
 * format-fixtures.test.ts) so they read as real ISML and are easy to extend. The
 * cases here assert *specific behaviors* on those same fixtures (things a plain
 * snapshot equality doesn't call out) plus a few small inline edge cases.
 *
 * ISML source is written as arrays-of-lines, not template literals: ISML is dense
 * with `${...}` expressions, which collide with JS template-literal interpolation
 * and would need `\${...}` escaping on nearly every line. Anything worth reading
 * as real ISML belongs in a fixture file instead.
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';
import {formatIsmlText} from '../../isml/formatting.js';
import type * as vscode from 'vscode';

const OPTS = {tabSize: 4, insertSpaces: true} as vscode.FormattingOptions;

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'src',
  'test',
  'fixtures',
  'format',
);
const readFixture = (name: string) => fs.readFileSync(path.join(fixturesDir, name), 'utf8');

suite('ISML formatter — key behaviors on vendored fixtures', () => {
  test('messy-mixed: bare <iselse> aligns to <isif>, void spacing normalized, script string preserved', () => {
    const out = formatIsmlText(readFixture('messy-mixed.isml'), OPTS);
    assert.ok(out.includes('var marker = "</iselse>";'), 'script string literal preserved verbatim');
    assert.ok(/\n {4}<iselse\/>/.test(out), 'bare <iselse> normalized + aligned to its <isif>');
    assert.ok(out.includes('encoding="off"/>'), 'void tag spacing normalized');
    assert.ok(out.includes('${pdict.items.length > 0}'), 'expression left verbatim');
  });

  test('order-items: <isscript> body is verbatim but its closer aligns to the opener', () => {
    const out = formatIsmlText(readFixture('order-items.isml'), OPTS);
    assert.ok(out.includes('\n    <isscript>\n'), 'isscript opener aligned');
    assert.ok(out.includes('\n    </isscript>\n'), 'isscript closer aligned to opener');
    assert.ok(out.includes('\n    var url = null;\n'), 'script body line preserved verbatim');
    assert.ok(out.includes('\n        url = URLUtils.url'), 'nested script line preserved verbatim');
  });

  test('order-items: <iselseif> divider aligns to its <isif>', () => {
    const out = formatIsmlText(readFixture('order-items.isml'), OPTS);
    assert.ok(/\n {4}<iselseif /.test(out), 'iselseif at the isif level, not the branch-body level');
  });
});

suite('ISML formatter — construct edge cases (from corpus analysis)', () => {
  test('nested <isloop> inside <isloop> indents each level', () => {
    const src = [
      '<isloop items="${cats}" var="cat">',
      '<isloop items="${cat.products}" var="p">',
      '<isprint value="${p.name}"/>',
      '</isloop>',
      '</isloop>',
    ].join('\n');
    const out = formatIsmlText(src, OPTS);
    assert.strictEqual(
      out,
      [
        '<isloop items="${cats}" var="cat">',
        '    <isloop items="${cat.products}" var="p">',
        '        <isprint value="${p.name}"/>',
        '    </isloop>',
        '</isloop>',
      ].join('\n'),
    );
  });

  test('a multi-line <isinclude> (attributes across lines) is preserved and idempotent', () => {
    const src = [
      '<div>',
      '<isinclude',
      "    url=\"${URLUtils.url('Tile-Show', 'pid', productId, 'swatches', false, 'ratings', true)}\" />",
      '</div>',
    ].join('\n');
    const once = formatIsmlText(src, OPTS);
    const twice = formatIsmlText(once, OPTS);
    assert.strictEqual(twice, once, 'multi-line isinclude must be idempotent');
    assert.ok(once.includes("URLUtils.url('Tile-Show'"), 'the include URL expression must be preserved');
  });

  test('<iscomment> block with markup inside is left untouched', () => {
    const src = ['<div>', '<iscomment>', '    <isslot id="old" /> disabled', '</iscomment>', '</div>'].join('\n');
    const out = formatIsmlText(src, OPTS);
    assert.ok(out.includes('<isslot id="old" /> disabled'), `iscomment body must be preserved, got:\n${out}`);
  });
});
