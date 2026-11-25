/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  closest,
  firstTextOf,
  matches,
  parseHtml,
  parseSelector,
  querySelector,
  querySelectorAll,
  querySelectorAllByPriority,
  textOf,
  type HtmlElement,
} from '../../../src/operations/search/html.js';

const ids = (elements: HtmlElement[]) => elements.map((element) => element.attributes.id);

describe('operations/search html', () => {
  describe('parseHtml', () => {
    it('builds an element tree with lowercase names and decoded attribute values', () => {
      const root = parseHtml('<DIV Class="a b" data-URL="/x?a=1&amp;b=2"><SPAN>Hi</SPAN></DIV>');
      const div = querySelector(root, 'div')!;

      expect(div.tag).to.equal('div');
      expect(div.attributes).to.deep.equal({class: 'a b', 'data-url': '/x?a=1&b=2'});
      expect(textOf(div)).to.equal('Hi');
      expect(querySelector(root, 'span')!.parent).to.equal(div);
    });

    it('does not nest content in void elements', () => {
      const root = parseHtml('<div id="a"><img src="x.png"><input type=checkbox checked><span id="b">x</span></div>');

      expect(querySelector(root, 'img')!.children).to.deep.equal([]);
      expect(querySelector(root, '#b')!.parent!.attributes.id).to.equal('a');
      expect(querySelector(root, 'input')!.attributes.checked).to.equal('checked');
    });

    it('keeps markup inside scripts out of the tree', () => {
      const root = parseHtml(
        '<div id="a"><script>var tile = "<div class=\\"product\\" data-pid=\\"x\\"></div>";</script></div><div class="product" id="b"></div>',
      );

      expect(ids(querySelectorAll(root, '.product'))).to.deep.equal(['b']);
    });

    it('reads malformed markup', () => {
      const root = parseHtml('<ul><li id="a">One<li id="b">Two</p></ul><p id="c">after</div>');

      expect(ids(querySelectorAll(root, 'li'))).to.deep.equal(['a', 'b']);
      expect(textOf(root)).to.equal('One Two after');
      expect(querySelector(root, '#c')).to.not.equal(undefined);
    });
  });

  describe('text', () => {
    it('collapses whitespace, separates blocks and leaves out hidden and skipped elements', () => {
      const root = parseHtml(
        '<div id="x"><span>Red</span><span>dish</span><div>Blue</div><noscript>no</noscript><style>.a{}</style><span class="sr-only">Refine by Color</span>\n  </div>',
      );
      const div = querySelector(root, '#x')!;

      expect(textOf(div, {skip: (element) => matches(element, '.sr-only')})).to.equal('Reddish Blue');
      expect(textOf(div)).to.equal('Reddish Blue Refine by Color');
    });

    it('returns the first non-blank text', () => {
      const root = parseHtml(
        '<div id="x"> <i></i> <span class="sr-only">hidden</span><span>Color</span><h2>Color</h2></div>',
      );
      const div = querySelector(root, '#x')!;

      expect(firstTextOf(div, {skip: (element) => matches(element, '.sr-only')})).to.equal('Color');
      expect(firstTextOf(parseHtml('<div> </div>'))).to.equal(undefined);
    });
  });

  describe('selectors', () => {
    const root = parseHtml(`
      <main id="m" class="page search">
        <div id="grid" class="product-grid">
          <div id="t1" class="product" data-pid="p1" lang="en-US"><a id="l1" class="link" href="/p1.html">One</a></div>
          <section id="s"><div id="t2" class="product" data-pid="p2" title="Big shoe"></div></section>
        </div>
        <div id="other" class="product other" data-pid="p3"></div>
      </main>`);

    it('matches type, class, ID and attribute selectors', () => {
      expect(ids(querySelectorAll(root, 'div.product'))).to.deep.equal(['t1', 't2', 'other']);
      expect(ids(querySelectorAll(root, '#t2'))).to.deep.equal(['t2']);
      expect(ids(querySelectorAll(root, '.product.other'))).to.deep.equal(['other']);
      expect(ids(querySelectorAll(root, '[data-pid=p1]'))).to.deep.equal(['t1']);
      expect(ids(querySelectorAll(root, '[title~="shoe"]'))).to.deep.equal(['t2']);
      expect(ids(querySelectorAll(root, '[lang|=en]'))).to.deep.equal(['t1']);
      expect(ids(querySelectorAll(root, "[href^='/p']"))).to.deep.equal(['l1']);
      expect(ids(querySelectorAll(root, '[href$=".html"]'))).to.deep.equal(['l1']);
      expect(ids(querySelectorAll(root, '[data-pid*=p]'))).to.deep.equal(['t1', 't2', 'other']);
      expect(ids(querySelectorAll(root, '*[data-pid]'))).to.deep.equal(['t1', 't2', 'other']);
    });

    it('matches descendant and child combinators and selector lists in document order', () => {
      expect(ids(querySelectorAll(root, '.product-grid .product'))).to.deep.equal(['t1', 't2']);
      expect(ids(querySelectorAll(root, '.product-grid > .product'))).to.deep.equal(['t1']);
      expect(ids(querySelectorAll(root, '#other, #t1'))).to.deep.equal(['t1', 'other']);
    });

    it('lets ancestors outside the root satisfy descendant combinators', () => {
      const section = querySelector(root, '#s')!;

      expect(ids(querySelectorAll(section, '.product-grid .product'))).to.deep.equal(['t2']);
    });

    it('tries selector list entries in order of preference', () => {
      expect(ids(querySelectorAllByPriority(root, '.missing, #other, .product'))).to.deep.equal(['other']);
      expect(querySelectorAllByPriority(root, '.missing')).to.deep.equal([]);
    });

    it('finds the closest matching ancestor', () => {
      const link = querySelector(root, '#l1')!;

      expect(closest(link, '.product')!.attributes.id).to.equal('t1');
      expect(closest(link, 'a')).to.equal(link);
      expect(closest(link, '.missing')).to.equal(undefined);
    });

    it('rejects unsupported selector syntax', () => {
      expect(() => parseSelector('.product:first-child')).to.throw('Unsupported selector syntax');
      expect(() => parseSelector('.a + .b')).to.throw('Unsupported selector syntax');
      expect(() => parseSelector('.a >')).to.throw('Unsupported selector syntax');
      expect(() => parseSelector('.a,')).to.throw('Unsupported selector syntax');
      expect(() => parseSelector('')).to.throw('Unsupported selector syntax');
    });
  });
});
