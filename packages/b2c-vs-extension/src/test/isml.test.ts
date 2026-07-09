/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {collectIsmlDiagnostics, getIsmlQuickFixes} from '../isml/diagnostics.js';
import {findTemplateLinks, resolveTemplate} from '../isml/document-links.js';
import {collectIsmlFoldingRanges} from '../isml/folding.js';
import {findIsmlHoverInfo} from '../isml/hover.js';
import {detectAutoCloseTag} from '../isml/index.js';
import {findIsmlLinkedEditingTagNameMatch, findIsmlTagNameMatch} from '../isml/matching.js';
import {
  detectSemanticCompletionContext,
  findIsmlDefinitionTarget,
  findIsmlReferenceRanges,
  getSemanticCompletionEntries,
} from '../isml/semantic.js';
import {detectCompletionContext} from '../isml/snippets.js';
import {collectIsmlSymbols} from '../isml/symbols.js';

suite('ISML: detectAutoCloseTag', () => {
  test('auto-closes <isif>', () => {
    const result = detectAutoCloseTag('<isif condition="true">');
    assert.deepStrictEqual(result, {tagName: 'isif'});
  });

  test('auto-closes <isloop>', () => {
    const result = detectAutoCloseTag('  <isloop items="x" var="y">');
    assert.deepStrictEqual(result, {tagName: 'isloop'});
  });

  test('auto-closes <isscript>', () => {
    assert.deepStrictEqual(detectAutoCloseTag('<isscript>'), {tagName: 'isscript'});
  });

  test('auto-closes <isdecorate>', () => {
    assert.deepStrictEqual(detectAutoCloseTag('<isdecorate template="common/layout/page">'), {
      tagName: 'isdecorate',
    });
  });

  test('auto-closes <isobject>', () => {
    assert.deepStrictEqual(detectAutoCloseTag('<isobject object="${product}" view="detail">'), {
      tagName: 'isobject',
    });
  });

  test('auto-closes <iscomment>', () => {
    assert.deepStrictEqual(detectAutoCloseTag('<iscomment>'), {tagName: 'iscomment'});
  });

  test('does not auto-close self-closing <isinclude/>', () => {
    assert.strictEqual(detectAutoCloseTag('<isinclude template="x"/>'), null);
  });

  test('does not auto-close known void tag <isset>', () => {
    assert.strictEqual(detectAutoCloseTag('<isset name="x" value="1"/>'), null);
  });

  test('does not auto-close <iselse/>', () => {
    assert.strictEqual(detectAutoCloseTag('<iselse/>'), null);
  });

  test('does not auto-close <isprint .../>', () => {
    assert.strictEqual(detectAutoCloseTag('<isprint value="${x}"/>'), null);
  });

  test('does not fire when typing > inside text content', () => {
    assert.strictEqual(detectAutoCloseTag('Hello world>'), null);
  });

  test('does not fire on closing tag', () => {
    assert.strictEqual(detectAutoCloseTag('</isif>'), null);
  });

  test('does not fire if line does not end with >', () => {
    assert.strictEqual(detectAutoCloseTag('<isif condition="true"'), null);
  });

  test('does not auto-close <iscontent/>', () => {
    assert.strictEqual(detectAutoCloseTag('<iscontent type="text/html"/>'), null);
  });

  test('handles attribute with > in expression by NOT being matched', () => {
    // Ensure parser logic is resilient when '>' appears inside quoted attribute content.
    const result = detectAutoCloseTag('<isif condition="${a>b}">');
    assert.deepStrictEqual(result, {tagName: 'isif'});
  });

  test('does not double-close when angle bracket appears in attribute string', () => {
    // After typing the closing > of <isif condition="x">, only one </isif> should be added.
    const result = detectAutoCloseTag('<isif condition="x">');
    assert.deepStrictEqual(result, {tagName: 'isif'});
  });
});

suite('ISML: folding', () => {
  test('collects folding ranges for nested block tags', () => {
    const text = [
      '<isif condition="${true}">',
      '  <isloop items="${x}" var="item">',
      '    <isprint value="${item}"/>',
      '  </isloop>',
      '</isif>',
    ].join('\n');

    const ranges = collectIsmlFoldingRanges(text);
    assert.strictEqual(ranges.length, 2);

    const folded = ranges.map((range) => text.slice(range.startOffset, range.endOffset));
    assert.ok(folded.some((value) => value.includes('<isif')));
    assert.ok(folded.some((value) => value.includes('<isloop')));
  });

  test('does not collect folding ranges for self-closing-only tags', () => {
    const text = ['<isprint value="${x}"/>', '<iselse/>', '<isinclude template="common/header"/>'].join('\n');
    const ranges = collectIsmlFoldingRanges(text);
    assert.deepStrictEqual(ranges, []);
  });
});

suite('ISML: semantic completions', () => {
  test('detects Resource completion context', () => {
    const ctx = detectSemanticCompletionContext('    ${Resource.m');
    assert.ok(ctx);
    assert.strictEqual(ctx?.kind, 'resource');
    assert.strictEqual(ctx?.partial, 'm');
  });

  test('detects URLUtils completion context', () => {
    const ctx = detectSemanticCompletionContext('URLUtils.ht');
    assert.ok(ctx);
    assert.strictEqual(ctx?.kind, 'urlutils');
    assert.strictEqual(ctx?.partial, 'ht');
  });

  test('returns semantic completion entries filtered by partial', () => {
    const entries = getSemanticCompletionEntries({kind: 'urlutils', partial: 'ht', startOffset: 0});
    assert.strictEqual(entries.length, 2);
    assert.strictEqual(entries[0].label, 'http');
    assert.strictEqual(entries[1].label, 'https');
  });

  test('detects require completion context', () => {
    const ctx = detectSemanticCompletionContext("const helper = require('*/cartridge/scripts/ut");
    assert.ok(ctx);
    assert.strictEqual(ctx?.kind, 'require');
    assert.strictEqual(ctx?.partial, '*/cartridge/scripts/ut');
  });

  test('detects Resource.msg key completion context', () => {
    const ctx = detectSemanticCompletionContext("${Resource.msg('wel");
    assert.ok(ctx);
    assert.strictEqual(ctx?.kind, 'resourceKey');
    assert.strictEqual(ctx?.partial, 'wel');
  });

  test('returns resource key completion entries from properties files', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'isml-semantic-resource-'));
    const cart = path.join(tmpRoot, 'app_a');
    fs.mkdirSync(path.join(cart, 'cartridge', 'templates', 'resources'), {recursive: true});
    fs.writeFileSync(
      path.join(cart, 'cartridge', 'templates', 'resources', 'messages.properties'),
      ['welcome=Hello', 'welcome_fmt=Hello {0}', 'other=Other'].join('\n'),
    );

    try {
      const entries = getSemanticCompletionEntries(
        {kind: 'resourceKey', partial: 'wel', startOffset: 0},
        [cart],
        path.join(cart, 'cartridge', 'templates', 'default', 'home', 'index.isml'),
      );

      const labels = entries.map((entry) => entry.label);
      assert.deepStrictEqual(labels, ['welcome', 'welcome_fmt']);
    } finally {
      fs.rmSync(tmpRoot, {recursive: true, force: true});
    }
  });
});

suite('ISML: semantic definitions', () => {
  let tmpRoot: string;
  let cartA: string;
  let cartB: string;

  setup(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'isml-semantic-'));
    cartA = path.join(tmpRoot, 'app_a');
    cartB = path.join(tmpRoot, 'app_b');

    fs.mkdirSync(path.join(cartA, 'cartridge', 'templates', 'default', 'common'), {recursive: true});
    fs.mkdirSync(path.join(cartA, 'cartridge', 'templates', 'resources'), {recursive: true});
    fs.mkdirSync(path.join(cartA, 'cartridge', 'controllers'), {recursive: true});
    fs.mkdirSync(path.join(cartA, 'cartridge', 'models'), {recursive: true});
    fs.mkdirSync(path.join(cartA, 'cartridge', 'scripts', 'util'), {recursive: true});
    fs.mkdirSync(path.join(cartB, 'cartridge', 'scripts', 'util'), {recursive: true});
    fs.mkdirSync(path.join(cartB, 'cartridge', 'scripts', 'shared'), {recursive: true});

    fs.writeFileSync(path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'), '<header/>');
    fs.writeFileSync(path.join(cartA, 'cartridge', 'templates', 'resources', 'messages.properties'), 'hello=Hello');
    fs.writeFileSync(path.join(cartA, 'cartridge', 'controllers', 'Home.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(cartA, 'cartridge', 'models', 'Product.ts'), 'export {};');
    fs.writeFileSync(path.join(cartA, 'cartridge', 'scripts', 'util', 'foo.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(cartB, 'cartridge', 'scripts', 'util', 'foo.ts'), 'export {};');
    fs.writeFileSync(path.join(cartB, 'cartridge', 'scripts', 'shared', 'index.ts'), 'export {};');
  });

  teardown(() => {
    fs.rmSync(tmpRoot, {recursive: true, force: true});
  });

  test('resolves template attribute definition target', () => {
    const text = '<isinclude template="common/header"/>';
    const offset = text.indexOf('common/header') + 2;
    const target = findIsmlDefinitionTarget(text, offset, [cartA]);
    assert.ok(target);
    assert.strictEqual(
      target?.targetPath,
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );
  });

  test('resolves template attribute definition target from template attribute name', () => {
    const text = '<isinclude template="common/header"/>';
    const offset = text.indexOf('template') + 2;
    const target = findIsmlDefinitionTarget(text, offset, [cartA]);
    assert.ok(target);
    assert.strictEqual(
      target?.targetPath,
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );
  });

  test('resolves template attribute definition target from template value quote', () => {
    const text = '<isinclude template="common/header"/>';
    const offset = text.indexOf('"common/header"');
    const target = findIsmlDefinitionTarget(text, offset, [cartA]);
    assert.ok(target);
    assert.strictEqual(
      target?.targetPath,
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );
  });

  test('resolves Resource.msg bundle definition target', () => {
    const text = "${Resource.msg('welcome', 'messages', null)}";
    const offset = text.indexOf('messages') + 2;
    const target = findIsmlDefinitionTarget(text, offset, [cartA]);
    assert.ok(target);
    assert.strictEqual(
      target?.targetPath,
      path.join(cartA, 'cartridge', 'templates', 'resources', 'messages.properties'),
    );
  });

  test('resolves URLUtils controller definition target', () => {
    const text = "${URLUtils.url('Home-Show')}";
    const offset = text.indexOf('Home-Show') + 2;
    const target = findIsmlDefinitionTarget(text, offset, [cartA]);
    assert.ok(target);
    assert.strictEqual(target?.targetPath, path.join(cartA, 'cartridge', 'controllers', 'Home.js'));
  });

  test('resolves res.render template definition target', () => {
    const text = "<isscript>\nres.render('common/header', {});\n</isscript>";
    const offset = text.indexOf('common/header') + 2;
    const target = findIsmlDefinitionTarget(text, offset, [cartA]);
    assert.ok(target);
    assert.strictEqual(
      target?.targetPath,
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );
  });

  test('returns require completion entries for current cartridge scripts', () => {
    const entries = getSemanticCompletionEntries(
      {kind: 'require', partial: '~/cartridge/scripts/u', startOffset: 0},
      [cartA, cartB],
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );

    const labels = entries.map((entry) => entry.label);
    assert.ok(labels.includes('~/cartridge/scripts/util/foo'));
  });

  test('keeps default require suggestions scripts-focused', () => {
    const entries = getSemanticCompletionEntries(
      {kind: 'require', partial: '*/cartridge/', startOffset: 0},
      [cartA, cartB],
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );

    const labels = entries.map((entry) => entry.label);
    assert.ok(labels.includes('*/cartridge/scripts/util/foo'));
    assert.ok(!labels.includes('*/cartridge/controllers/Home'));
    assert.ok(!labels.includes('*/cartridge/models/Product'));
  });

  test('returns require completion entries for non-scripts cartridge modules', () => {
    const entries = getSemanticCompletionEntries(
      {kind: 'require', partial: '*/cartridge/controllers/H', startOffset: 0},
      [cartA, cartB],
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );

    const labels = entries.map((entry) => entry.label);
    assert.ok(labels.includes('*/cartridge/controllers/Home'));
  });

  test('dedupes wildcard require completion by cartridge path order', () => {
    const entries = getSemanticCompletionEntries(
      {kind: 'require', partial: '*/cartridge/scripts/util/foo', startOffset: 0},
      [cartA, cartB],
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );

    const wildcardMatches = entries.filter((entry) => entry.label === '*/cartridge/scripts/util/foo');
    assert.strictEqual(wildcardMatches.length, 1);
    assert.ok(wildcardMatches[0].detail.includes('(app_a)'));
  });

  test('resolves require wildcard definition target', () => {
    const text = "<isscript>\nvar util = require('*/cartridge/scripts/util/foo');\n</isscript>";
    const offset = text.indexOf('util/foo') + 2;
    const target = findIsmlDefinitionTarget(text, offset, [cartA, cartB]);
    assert.ok(target);
    assert.strictEqual(target?.targetPath, path.join(cartA, 'cartridge', 'scripts', 'util', 'foo.js'));
  });

  test('resolves require current cartridge definition target', () => {
    const text = "<isscript>\nvar util = require('~/cartridge/scripts/util/foo');\n</isscript>";
    const offset = text.indexOf('util/foo') + 2;
    const target = findIsmlDefinitionTarget(
      text,
      offset,
      [cartA, cartB],
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );
    assert.ok(target);
    assert.strictEqual(target?.targetPath, path.join(cartA, 'cartridge', 'scripts', 'util', 'foo.js'));
  });

  test('resolves require explicit cartridge definition target', () => {
    const text = "<isscript>\nvar shared = require('app_b/cartridge/scripts/shared');\n</isscript>";
    const offset = text.indexOf('app_b') + 2;
    const target = findIsmlDefinitionTarget(text, offset, [cartA, cartB]);
    assert.ok(target);
    assert.strictEqual(target?.targetPath, path.join(cartB, 'cartridge', 'scripts', 'shared', 'index.ts'));
  });

  test('finds references for template links and res.render to same template target', () => {
    const text = [
      '<isinclude template="common/header"/>',
      '<isscript>',
      "res.render('common/header', {});",
      '</isscript>',
    ].join('\n');

    const offset = text.indexOf('common/header') + 2;
    const ranges = findIsmlReferenceRanges(
      text,
      offset,
      [cartA],
      path.join(cartA, 'cartridge', 'templates', 'default'),
    );
    assert.strictEqual(ranges.length, 2);

    const values = ranges.map((range) => text.slice(range.startOffset, range.endOffset));
    assert.deepStrictEqual(values, ['common/header', 'common/header']);
  });

  test('finds references for require calls resolving to same target module', () => {
    const text = [
      '<isscript>',
      "var a = require('*/cartridge/scripts/util/foo');",
      "var b = require('app_a/cartridge/scripts/util/foo');",
      '</isscript>',
    ].join('\n');

    const offset = text.indexOf('*/cartridge/scripts/util/foo') + 2;
    const ranges = findIsmlReferenceRanges(
      text,
      offset,
      [cartA, cartB],
      path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'),
    );

    assert.strictEqual(ranges.length, 2);
    const values = ranges.map((range) => text.slice(range.startOffset, range.endOffset));
    assert.deepStrictEqual(values, ['*/cartridge/scripts/util/foo', 'app_a/cartridge/scripts/util/foo']);
  });
});

suite('ISML: tag matching', () => {
  test('finds matching pair for opening tag name', () => {
    const text = '<isif condition="${x}"><isloop items="${y}" var="item"></isloop></isif>';
    const offset = text.indexOf('isloop') + 2;
    const match = findIsmlTagNameMatch(text, offset);
    assert.ok(match);
    assert.strictEqual(match?.name, 'isloop');

    const opening = text.slice(match?.openingNameStartOffset ?? 0, match?.openingNameEndOffset ?? 0);
    const closing = text.slice(match?.closingNameStartOffset ?? 0, match?.closingNameEndOffset ?? 0);
    assert.strictEqual(opening, 'isloop');
    assert.strictEqual(closing, 'isloop');
  });

  test('finds matching pair for closing tag name', () => {
    const text = '<isif></isif>';
    const offset = text.lastIndexOf('isif') + 2;
    const match = findIsmlTagNameMatch(text, offset);
    assert.ok(match);
    assert.strictEqual(match?.name, 'isif');
  });

  test('returns undefined for self-closing tags', () => {
    const text = '<isinclude template="common/header"/>';
    const offset = text.indexOf('isinclude') + 2;
    assert.strictEqual(findIsmlTagNameMatch(text, offset), undefined);
  });

  test('returns undefined when offset is outside tag names', () => {
    const text = '<isif condition="true"></isif>';
    const offset = text.indexOf('condition');
    assert.strictEqual(findIsmlTagNameMatch(text, offset), undefined);
  });

  test('linked editing match tolerates temporary mismatched names', () => {
    const text = '<isforeach></isif>';
    const offset = text.indexOf('isforeach') + 2;

    assert.strictEqual(findIsmlTagNameMatch(text, offset), undefined);

    const linkedMatch = findIsmlLinkedEditingTagNameMatch(text, offset);
    assert.ok(linkedMatch);

    const opening = text.slice(linkedMatch?.openingNameStartOffset ?? 0, linkedMatch?.openingNameEndOffset ?? 0);
    const closing = text.slice(linkedMatch?.closingNameStartOffset ?? 0, linkedMatch?.closingNameEndOffset ?? 0);
    assert.strictEqual(opening, 'isforeach');
    assert.strictEqual(closing, 'isif');
  });
});

suite('ISML: detectCompletionContext', () => {
  test('triggers on bare prefix `is`', () => {
    const ctx = detectCompletionContext('is');
    assert.ok(ctx);
    assert.strictEqual(ctx?.partial, 'is');
    assert.strictEqual(ctx?.hasLeadingBracket, false);
    assert.strictEqual(ctx?.startOffset, 0);
  });

  test('triggers on `isif`', () => {
    const ctx = detectCompletionContext('isif');
    assert.ok(ctx);
    assert.strictEqual(ctx?.partial, 'isif');
    assert.strictEqual(ctx?.hasLeadingBracket, false);
  });

  test('triggers on `<is` and reports leading bracket', () => {
    const ctx = detectCompletionContext('<is');
    assert.ok(ctx);
    assert.strictEqual(ctx?.partial, '<is');
    assert.strictEqual(ctx?.hasLeadingBracket, true);
    assert.strictEqual(ctx?.startOffset, 0);
  });

  test('triggers on `<isif`', () => {
    const ctx = detectCompletionContext('  <isif');
    assert.ok(ctx);
    assert.strictEqual(ctx?.partial, '<isif');
    assert.strictEqual(ctx?.hasLeadingBracket, true);
    assert.strictEqual(ctx?.startOffset, 2);
  });

  test('does not trigger inside arbitrary words', () => {
    assert.strictEqual(detectCompletionContext('hello'), null);
  });

  test('does not trigger after a space', () => {
    assert.strictEqual(detectCompletionContext('<is '), null);
  });

  test('does not trigger after closing >', () => {
    assert.strictEqual(detectCompletionContext('<isif>'), null);
  });

  test('captures partial name following <', () => {
    const ctx = detectCompletionContext('<isd');
    assert.ok(ctx);
    assert.strictEqual(ctx?.partial, '<isd');
    assert.strictEqual(ctx?.hasLeadingBracket, true);
  });
});

suite('ISML: findTemplateLinks', () => {
  test('finds isinclude template attribute', () => {
    const text = '<isinclude template="common/header"/>';
    const links = findTemplateLinks(text);
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].template, 'common/header');
    assert.strictEqual(text.slice(links[0].startOffset, links[0].endOffset), 'common/header');
  });

  test('finds isdecorate template attribute', () => {
    const links = findTemplateLinks('<isdecorate template="common/layout/page">');
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].template, 'common/layout/page');
  });

  test('finds ismodule template attribute', () => {
    const links = findTemplateLinks('<ismodule template="path/to/mod" name="m" attribute="x"/>');
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].template, 'path/to/mod');
  });

  test('handles single quotes', () => {
    const links = findTemplateLinks("<isinclude template='cart/miniCart'/>");
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].template, 'cart/miniCart');
  });

  test('finds multiple template attributes', () => {
    const text = '<isinclude template="a"/><isinclude template="b"/>';
    const links = findTemplateLinks(text);
    assert.strictEqual(links.length, 2);
    assert.strictEqual(links[0].template, 'a');
    assert.strictEqual(links[1].template, 'b');
  });

  test('ignores url attribute on isinclude', () => {
    const links = findTemplateLinks('<isinclude url="${URLUtils.url(\'Cart-MiniCart\')}"/>');
    assert.strictEqual(links.length, 0);
  });

  test('ignores template attribute on unknown tags', () => {
    const links = findTemplateLinks('<div template="not-an-isml-tag"></div>');
    assert.strictEqual(links.length, 0);
  });

  test('returns empty for empty input', () => {
    assert.deepStrictEqual(findTemplateLinks(''), []);
  });

  test('supports multiline attributes inside template tags', () => {
    const text = '<isinclude\n  template="common/header"\n  sf-toolkit="off"\n/>';
    const links = findTemplateLinks(text);
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].template, 'common/header');
  });

  test('ignores variable template attribute values', () => {
    const text = '<isinclude template="${pdict.templatePath}"/>';
    const links = findTemplateLinks(text);
    assert.strictEqual(links.length, 0);
  });

  test('supports unquoted template attribute values', () => {
    const text = '<isinclude template=common/header/>';
    const links = findTemplateLinks(text);
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].template, 'common/header');
  });
});

suite('ISML: resolveTemplate', () => {
  let tmpRoot: string;
  let cartA: string;
  let cartB: string;

  setup(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'isml-resolve-'));
    cartA = path.join(tmpRoot, 'app_a');
    cartB = path.join(tmpRoot, 'app_b');
    fs.mkdirSync(path.join(cartA, 'cartridge', 'templates', 'default', 'common'), {recursive: true});
    fs.mkdirSync(path.join(cartB, 'cartridge', 'templates', 'default', 'common'), {recursive: true});
    fs.mkdirSync(path.join(cartB, 'cartridge', 'templates', 'fr_FR', 'product'), {recursive: true});
    fs.writeFileSync(path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'), '<header/>');
    fs.writeFileSync(path.join(cartB, 'cartridge', 'templates', 'default', 'common', 'header.isml'), '<header2/>');
    fs.writeFileSync(path.join(cartB, 'cartridge', 'templates', 'fr_FR', 'product', 'detail.isml'), '<detail/>');
  });

  teardown(() => {
    fs.rmSync(tmpRoot, {recursive: true, force: true});
  });

  test('resolves to first cartridge in path order', () => {
    const resolved = resolveTemplate('common/header', [cartA, cartB]);
    assert.strictEqual(resolved, path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'));
  });

  test('falls through to next cartridge if first does not have it', () => {
    const resolved = resolveTemplate('product/detail', [cartA, cartB]);
    assert.ok(resolved && resolved.includes('app_b'));
  });

  test('falls through to non-default locale when needed', () => {
    fs.rmSync(path.join(cartB, 'cartridge', 'templates', 'default'), {recursive: true});
    const resolved = resolveTemplate('product/detail', [cartA, cartB]);
    assert.ok(resolved && resolved.includes('fr_FR'));
  });

  test('handles already-suffixed paths', () => {
    const resolved = resolveTemplate('common/header.isml', [cartA]);
    assert.strictEqual(resolved, path.join(cartA, 'cartridge', 'templates', 'default', 'common', 'header.isml'));
  });

  test('handles leading slash', () => {
    const resolved = resolveTemplate('/common/header', [cartA]);
    assert.ok(resolved);
  });

  test('returns undefined when not found anywhere', () => {
    const resolved = resolveTemplate('does/not/exist', [cartA, cartB]);
    assert.strictEqual(resolved, undefined);
  });

  test('returns undefined for empty cartridge list', () => {
    assert.strictEqual(resolveTemplate('common/header', []), undefined);
  });
});

suite('ISML: diagnostics', () => {
  test('returns empty diagnostics for valid markup', () => {
    const diagnostics = collectIsmlDiagnostics('<isif condition="true"><isprint value="${x}"/></isif>');
    assert.deepStrictEqual(diagnostics, []);
  });

  test('reports unexpected closing tag', () => {
    const diagnostics = collectIsmlDiagnostics('</isif>');
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, 'Unexpected closing tag </isif>.');
  });

  test('reports unclosed opening tag', () => {
    const diagnostics = collectIsmlDiagnostics('<isif condition="true">');
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, 'Tag <isif> is not closed.');
  });

  test('reports mismatched closing tag with expected closing tag', () => {
    const diagnostics = collectIsmlDiagnostics('<isif><isloop></isif></isloop>');
    assert.ok(diagnostics.some((d) => d.message === 'Mismatched closing tag </isif>. Expected </isloop>.'));
  });

  test('reports non-self-closing void tags as warning', () => {
    const diagnostics = collectIsmlDiagnostics('<iselse>');
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].severity, 'warning');
    assert.strictEqual(diagnostics[0].message, 'ISML void tag <iselse> should be self-closing.');
  });

  test('treats isslot/ismodule/iscomponent as void (no "not closed" diagnostic)', () => {
    // These are empty ISML elements — a non-self-closed form is a void-tag
    // warning, never an unclosed-container error.
    for (const tag of ['isslot', 'ismodule', 'iscomponent']) {
      const selfClosed = collectIsmlDiagnostics(`<${tag} id="x"/>`);
      assert.deepStrictEqual(selfClosed, [], `<${tag}/> should be clean`);

      const open = collectIsmlDiagnostics(`<${tag} id="x">`);
      assert.strictEqual(open.length, 1, `<${tag}> should yield one diagnostic`);
      assert.strictEqual(open[0].message, `ISML void tag <${tag}> should be self-closing.`);
    }
  });

  test('does not scan markup inside <iscomment> bodies', () => {
    // Commented-out ISML must not produce diagnostics.
    const diagnostics = collectIsmlDiagnostics('<iscomment><isif condition="x"></iscomment>');
    assert.deepStrictEqual(diagnostics, []);
  });

  test('does not scan "<" inside <isscript> bodies', () => {
    const diagnostics = collectIsmlDiagnostics('<isscript>var ok = a < b && c<d;</isscript>');
    assert.deepStrictEqual(diagnostics, []);
  });

  test('resumes scanning after a raw-content element', () => {
    // An unclosed <isif> after the </iscomment> must still be reported.
    const diagnostics = collectIsmlDiagnostics('<iscomment><isloop></iscomment><isif condition="x">');
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, 'Tag <isif> is not closed.');
  });
});

suite('ISML: diagnostic quick fixes', () => {
  test('returns self-closing quick fix for non-self-closing void tag', () => {
    const text = '<iselse>';
    const diagnostic = collectIsmlDiagnostics(text)[0];
    const fixes = getIsmlQuickFixes(text, diagnostic);

    assert.strictEqual(fixes.length, 1);
    assert.strictEqual(fixes[0].title, 'Make <iselse> self-closing');
    assert.strictEqual(fixes[0].edits.length, 1);
    assert.strictEqual(fixes[0].edits[0].newText, '<iselse/>');
  });

  test('returns replacement quick fix for invalid void closing tag', () => {
    const text = '</iselse>';
    const diagnostic = collectIsmlDiagnostics(text)[0];
    const fixes = getIsmlQuickFixes(text, diagnostic);

    assert.strictEqual(fixes.length, 1);
    assert.strictEqual(fixes[0].title, 'Replace </iselse> with <iselse/>');
    assert.strictEqual(fixes[0].edits.length, 1);
    assert.strictEqual(fixes[0].edits[0].newText, '<iselse/>');
  });
});

suite('ISML: hover', () => {
  test('returns hover info for known ISML tag', () => {
    const text = '<isinclude template="common/header"/>';
    const offset = text.indexOf('isinclude') + 2;
    const info = findIsmlHoverInfo(text, offset);
    assert.ok(info);
    assert.strictEqual(info?.tagName, 'isinclude');
    assert.ok(info?.summary.includes('Includes another template'));
    assert.strictEqual(info?.syntax, '<isinclude template="common/header"/>');
    assert.ok(info?.attributes.includes('template'));
    assert.strictEqual(info?.isClosing, false);
    assert.strictEqual(info?.isSelfClosing, true);
  });

  test('returns hover info for isslot tag', () => {
    const text = '<isslot id="hero-slot" context="global"/>';
    const offset = text.indexOf('isslot') + 2;
    const info = findIsmlHoverInfo(text, offset);
    assert.ok(info);
    assert.strictEqual(info?.tagName, 'isslot');
    assert.strictEqual(info?.isSelfClosing, true);
    assert.ok(info?.attributes.includes('id'));
  });

  test('returns hover info for closing tags with closing context', () => {
    const text = '<isif condition="${true}"></isif>';
    const offset = text.lastIndexOf('isif') + 2;
    const info = findIsmlHoverInfo(text, offset);
    assert.ok(info);
    assert.strictEqual(info?.tagName, 'isif');
    assert.strictEqual(info?.isClosing, true);
    assert.strictEqual(info?.isSelfClosing, false);
  });

  test('returns undefined for unknown tag names', () => {
    const text = '<isunknown attr="x">';
    const offset = text.indexOf('isunknown') + 2;
    const info = findIsmlHoverInfo(text, offset);
    assert.strictEqual(info, undefined);
  });
});

suite('ISML: symbols', () => {
  test('collects nested symbols', () => {
    const text = '<isif condition="true"><isloop items="${x}" var="item"><isprint value="${item}"/></isloop></isif>';
    const symbols = collectIsmlSymbols(text);
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].name, 'isif');
    assert.strictEqual(symbols[0].children.length, 1);
    assert.strictEqual(symbols[0].children[0].name, 'isloop');
    assert.strictEqual(symbols[0].children[0].children.length, 1);
    assert.strictEqual(symbols[0].children[0].children[0].name, 'isprint');
  });

  test('keeps self-closing tags at current nesting level', () => {
    const text = '<isif condition="true"><isprint value="${x}"/></isif>';
    const symbols = collectIsmlSymbols(text);
    assert.strictEqual(symbols.length, 1);
    assert.strictEqual(symbols[0].children.length, 1);
    assert.strictEqual(symbols[0].children[0].name, 'isprint');
  });
});
