/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * A small, forgiving HTML reader for storefront pages: an element tree and a
 * subset of CSS selectors. It is not a browser DOM. It runs no scripts, applies
 * no styles and only knows the HTML parsing rules a search page needs: void
 * elements, implicitly closed elements and raw script text.
 *
 * @module operations/search/html
 * @internal
 */
import sax from 'sax';

/** An element in the tree built by {@link parseHtml}. */
export interface HtmlElement {
  /** Lowercase tag name. The root is `#document`. */
  tag: string;
  /** Attributes with lowercase names and decoded values. */
  attributes: Record<string, string>;
  children: HtmlNode[];
  parent?: HtmlElement;
}

/** An element or a run of text. */
export type HtmlNode = HtmlElement | string;

/** Elements that never have content or a closing tag. */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** Elements whose text a shopper never sees. */
const NON_RENDERED_ELEMENTS = new Set(['noscript', 'script', 'style', 'template']);

/** Elements that start a new line, so their text is kept apart from the text around them. */
const BLOCK_ELEMENTS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'dd',
  'div',
  'dl',
  'dt',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'section',
  'table',
  'td',
  'th',
  'tr',
  'ul',
]);

/** Closing tags that matched no open element; the loose parser hands them over as text. */
const STRAY_CLOSING_TAG = /<\/[a-z][^>]*>/gi;

/** Name of the element {@link parseHtml} wraps the page in. */
const WRAPPER = 'b2c-tooling-document';

/**
 * Parses an HTML document into an element tree. Never throws: malformed markup
 * is read the way a browser would read most of it.
 */
export function parseHtml(html: string): HtmlElement {
  const root: HtmlElement = {tag: '#document', attributes: {}, children: []};
  const stack: HtmlElement[] = [root];
  const parser = sax.parser(false, {lowercase: true, position: false});
  let wrapped = false;

  // Loose mode only reports states it cannot read; skip past them and carry on.
  parser.onerror = () => {
    parser.resume();
  };
  parser.onopentag = (tag) => {
    if (!wrapped) {
      // The wrapper written below; it stays out of the tree.
      wrapped = true;
      return;
    }
    const parent = stack.at(-1)!;
    const attributes: Record<string, string> = {};
    for (const [name, value] of Object.entries(tag.attributes)) {
      attributes[name] = typeof value === 'string' ? value : value.value;
    }
    const element: HtmlElement = {tag: tag.name, attributes, children: [], parent};
    parent.children.push(element);
    // The parser does not know void elements and closes them late; they never hold content.
    if (!VOID_ELEMENTS.has(tag.name)) stack.push(element);
  };
  parser.onclosetag = (name) => {
    if (VOID_ELEMENTS.has(name)) return;
    for (let index = stack.length - 1; index > 0; index--) {
      if (stack[index].tag === name) {
        stack.length = index;
        return;
      }
    }
  };
  parser.ontext = (text) => {
    const cleaned = text.replaceAll(STRAY_CLOSING_TAG, ' ');
    if (cleaned) stack.at(-1)!.children.push(cleaned);
  };

  // The parser reads everything after its first top-level element as text, so
  // the page goes inside one wrapper element that closes only at the end.
  parser.write(`<${WRAPPER}>`).write(html).write(`</${WRAPPER}>`).close();
  return root;
}

/** Collapses runs of whitespace to one space and trims. */
export function normalizeSpace(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}

/** Options for {@link textOf} and {@link firstTextOf}. */
export interface TextOptions {
  /** Elements to leave out, with everything inside them. */
  skip?: (element: HtmlElement) => boolean;
  /**
   * Returns the text without collapsing whitespace, for reading numbers whose
   * digit groups are separated by no-break spaces (`1 234`).
   */
  raw?: boolean;
}

function collectText(node: HtmlNode, skip: TextOptions['skip'], parts: string[]): void {
  if (typeof node === 'string') {
    parts.push(node);
    return;
  }
  if (NON_RENDERED_ELEMENTS.has(node.tag) || skip?.(node)) return;
  const block = BLOCK_ELEMENTS.has(node.tag);
  if (block) parts.push(' ');
  for (const child of node.children) collectText(child, skip, parts);
  if (block) parts.push(' ');
}

/** The text inside a node, with whitespace collapsed unless `raw` is set. */
export function textOf(node: HtmlNode, options: TextOptions = {}): string {
  const parts: string[] = [];
  collectText(node, options.skip, parts);
  const text = parts.join('');
  return options.raw ? text : normalizeSpace(text);
}

/** The first non-blank run of text inside a node, with whitespace collapsed unless `raw` is set. */
export function firstTextOf(node: HtmlNode, options: TextOptions = {}): string | undefined {
  if (typeof node === 'string') {
    const text = normalizeSpace(node);
    if (!text) return undefined;
    return options.raw ? node : text;
  }
  if (NON_RENDERED_ELEMENTS.has(node.tag) || options.skip?.(node)) return undefined;
  for (const child of node.children) {
    const text = firstTextOf(child, options);
    if (text) return text;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

type AttributeOperator = '*=' | '$=' | '^=' | '|=' | '~=' | '=';

interface AttributeTest {
  name: string;
  operator?: AttributeOperator;
  value?: string;
}

interface CompoundSelector {
  tag?: string;
  id?: string;
  classes: string[];
  attributes: AttributeTest[];
}

/** A selector without commas: compound selectors joined by combinators. */
export interface ComplexSelector {
  /** The selector text, for messages. */
  source: string;
  compounds: CompoundSelector[];
  /** `combinators[i]` joins `compounds[i]` and `compounds[i + 1]`. */
  combinators: Array<' ' | '>'>;
}

const IDENTIFIER = /^-?[A-Za-z_\u00A0-\uFFFF][\w\-\u00A0-\uFFFF]*/;
const ATTRIBUTE = /^\[\s*([^\s~|^$*=\]]+)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))\s*)?\]/;

const selectorCache = new Map<string, ComplexSelector[]>();

function emptyCompound(): CompoundSelector {
  return {classes: [], attributes: []};
}

function isEmptyCompound(compound: CompoundSelector): boolean {
  return !compound.tag && !compound.id && compound.classes.length === 0 && compound.attributes.length === 0;
}

/**
 * Parses a selector list. Supports type, universal, class, ID and attribute
 * selectors (`[a]`, `[a=v]`, `[a~=v]`, `[a|=v]`, `[a^=v]`, `[a$=v]`, `[a*=v]`),
 * the descendant and child (`>`) combinators, and comma-separated lists.
 *
 * @throws Error when the selector uses anything else
 */
export function parseSelector(selector: string): ComplexSelector[] {
  const cached = selectorCache.get(selector);
  if (cached) return cached;

  const fail = (rest: string): never => {
    throw new Error(`Unsupported selector syntax at "${rest.slice(0, 20)}" in "${selector}"`);
  };

  const list: ComplexSelector[] = [];
  let compounds: CompoundSelector[] = [];
  let combinators: Array<' ' | '>'> = [];
  let compound = emptyCompound();
  let pending: ' ' | '>' | undefined;
  let start = 0;
  let rest = selector;

  const closeCompound = () => {
    if (isEmptyCompound(compound)) return;
    if (compounds.length > 0) combinators.push(pending ?? ' ');
    compounds.push(compound);
    compound = emptyCompound();
    pending = undefined;
  };
  const closeComplex = (end: number) => {
    closeCompound();
    if (compounds.length === 0 || pending === '>') fail(selector.slice(start));
    list.push({source: selector.slice(start, end).trim(), compounds, combinators});
    compounds = [];
    combinators = [];
    pending = undefined;
  };

  while (rest.length > 0) {
    const position = selector.length - rest.length;
    const char = rest[0];
    if (/\s/.test(char)) {
      closeCompound();
      rest = rest.slice(1);
      continue;
    }
    if (char === '>') {
      closeCompound();
      if (compounds.length === 0 || pending === '>') fail(rest);
      pending = '>';
      rest = rest.slice(1);
      continue;
    }
    if (char === ',') {
      closeComplex(position);
      start = position + 1;
      rest = rest.slice(1);
      continue;
    }
    if (char === '*') {
      if (!isEmptyCompound(compound)) fail(rest);
      compound.tag = '*';
      rest = rest.slice(1);
      continue;
    }
    if (char === '.' || char === '#') {
      const name = IDENTIFIER.exec(rest.slice(1))?.[0];
      if (!name) fail(rest);
      if (char === '.') compound.classes.push(name!);
      else compound.id = name;
      rest = rest.slice(1 + name!.length);
      continue;
    }
    if (char === '[') {
      const match = ATTRIBUTE.exec(rest);
      if (!match) fail(rest);
      const [text, name, operator, doubleQuoted, singleQuoted, bare] = match!;
      compound.attributes.push({
        name: name.toLowerCase(),
        ...(operator && {operator: operator as AttributeOperator, value: doubleQuoted ?? singleQuoted ?? bare}),
      });
      rest = rest.slice(text.length);
      continue;
    }
    const tag = IDENTIFIER.exec(rest)?.[0];
    if (!tag || !isEmptyCompound(compound)) fail(rest);
    compound.tag = tag!.toLowerCase();
    rest = rest.slice(tag!.length);
  }
  closeComplex(selector.length);

  selectorCache.set(selector, list);
  return list;
}

function classesOf(element: HtmlElement): Set<string> {
  return new Set((element.attributes.class ?? '').split(/\s+/).filter(Boolean));
}

/** True when the element has the class. */
export function hasClass(element: HtmlElement, className: string): boolean {
  return classesOf(element).has(className);
}

function matchesAttribute(element: HtmlElement, test: AttributeTest): boolean {
  const actual = element.attributes[test.name];
  if (actual === undefined) return false;
  if (test.operator === undefined || test.value === undefined) return true;
  const expected = test.value;
  switch (test.operator) {
    case '*=': {
      return expected !== '' && actual.includes(expected);
    }
    case '$=': {
      return expected !== '' && actual.endsWith(expected);
    }
    case '^=': {
      return expected !== '' && actual.startsWith(expected);
    }
    case '|=': {
      return actual === expected || actual.startsWith(`${expected}-`);
    }
    case '~=': {
      return actual.split(/\s+/).includes(expected);
    }
    default: {
      return actual === expected;
    }
  }
}

function matchesCompound(element: HtmlElement, compound: CompoundSelector): boolean {
  if (element.tag === '#document') return false;
  if (compound.tag && compound.tag !== '*' && element.tag !== compound.tag) return false;
  if (compound.id !== undefined && element.attributes.id !== compound.id) return false;
  if (compound.classes.length > 0) {
    const classes = classesOf(element);
    if (!compound.classes.every((name) => classes.has(name))) return false;
  }
  return compound.attributes.every((test) => matchesAttribute(element, test));
}

function matchesFrom(element: HtmlElement, selector: ComplexSelector, index: number): boolean {
  if (!matchesCompound(element, selector.compounds[index])) return false;
  if (index === 0) return true;
  if (selector.combinators[index - 1] === '>') {
    return element.parent !== undefined && matchesFrom(element.parent, selector, index - 1);
  }
  for (let ancestor = element.parent; ancestor; ancestor = ancestor.parent) {
    if (matchesFrom(ancestor, selector, index - 1)) return true;
  }
  return false;
}

/** True when the element matches any selector in the list. */
export function matches(element: HtmlElement, selector: ComplexSelector[] | string): boolean {
  const list = typeof selector === 'string' ? parseSelector(selector) : selector;
  return list.some((complex) => matchesFrom(element, complex, complex.compounds.length - 1));
}

function* descendants(root: HtmlElement): Generator<HtmlElement> {
  for (const child of root.children) {
    if (typeof child === 'string') continue;
    yield child;
    yield* descendants(child);
  }
}

/**
 * The elements inside `root` that match the selector list, in document order.
 * As in the browser, ancestors outside `root` count for descendant combinators.
 */
export function querySelectorAll(root: HtmlElement, selector: ComplexSelector[] | string): HtmlElement[] {
  const list = typeof selector === 'string' ? parseSelector(selector) : selector;
  const found: HtmlElement[] = [];
  for (const element of descendants(root)) {
    if (matches(element, list)) found.push(element);
  }
  return found;
}

/** The first element inside `root` that matches the selector list, in document order. */
export function querySelector(root: HtmlElement, selector: ComplexSelector[] | string): HtmlElement | undefined {
  const list = typeof selector === 'string' ? parseSelector(selector) : selector;
  for (const element of descendants(root)) {
    if (matches(element, list)) return element;
  }
  return undefined;
}

/**
 * Tries each selector of a comma-separated list in turn and returns the
 * elements of the first one that matches anything, so earlier selectors win.
 */
export function querySelectorAllByPriority(root: HtmlElement, selector: string): HtmlElement[] {
  for (const complex of parseSelector(selector)) {
    const found = querySelectorAll(root, [complex]);
    if (found.length > 0) return found;
  }
  return [];
}

/** The element itself or its nearest ancestor that matches the selector list. */
export function closest(element: HtmlElement, selector: ComplexSelector[] | string): HtmlElement | undefined {
  const list = typeof selector === 'string' ? parseSelector(selector) : selector;
  for (let current: HtmlElement | undefined = element; current; current = current.parent) {
    if (matches(current, list)) return current;
  }
  return undefined;
}
