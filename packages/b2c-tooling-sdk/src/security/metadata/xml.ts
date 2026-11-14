/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import sax from 'sax';

/** An XML element with its position. Names are local names (namespace prefixes removed). */
export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  /** Concatenated text content directly inside the element (trimmed). */
  text: string;
  /** 1-based line of the start tag. */
  line: number;
  /** 1-based column of the start tag. */
  column: number;
  children: XmlElement[];
}

/** A comment with the lines it spans. */
export interface XmlComment {
  value: string;
  loc: {start: {line: number}; end: {line: number}};
}

/** A parsed XML document. */
export interface XmlDocumentTree {
  root: XmlElement;
  comments: XmlComment[];
}

/** Parses XML into a tree with line numbers. Throws on malformed XML. */
export function parseXml(text: string): XmlDocumentTree {
  const parser = sax.parser(true, {position: true, trim: false});
  const stack: XmlElement[] = [];
  const comments: XmlComment[] = [];
  let root: XmlElement | undefined;
  let error: Error | undefined;
  let tagLine = 1;
  let tagColumn = 1;

  parser.onerror = (e) => {
    error ??= e;
    parser.resume();
  };
  parser.onopentagstart = () => {
    tagLine = parser.line + 1;
    tagColumn = parser.column;
  };
  parser.onopentag = (node) => {
    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(node.attributes)) {
      attributes[key.replace(/^.*:/, '')] = typeof value === 'string' ? value : value.value;
    }
    const element: XmlElement = {
      name: node.name.replace(/^.*:/, ''),
      attributes,
      text: '',
      line: tagLine,
      column: Math.max(1, tagColumn),
      children: [],
    };
    const parent = stack.at(-1);
    if (parent) parent.children.push(element);
    else root ??= element;
    stack.push(element);
  };
  parser.ontext = (t) => {
    const current = stack.at(-1);
    if (current) current.text += t;
  };
  parser.oncdata = (t) => {
    const current = stack.at(-1);
    if (current) current.text += t;
  };
  parser.onclosetag = () => {
    const element = stack.pop();
    if (element) element.text = element.text.trim();
  };
  parser.oncomment = (value) => {
    const endLine = parser.line + 1;
    const startLine = endLine - (value.match(/\n/g)?.length ?? 0);
    comments.push({value, loc: {start: {line: startLine}, end: {line: endLine}}});
  };

  parser.write(text).close();
  if (error) throw error;
  if (!root) throw new Error('No root element');
  return {root, comments};
}

/** Child elements of `element` with the given local name. */
export function childrenNamed(element: XmlElement, name: string): XmlElement[] {
  return element.children.filter((c) => c.name === name);
}

/** The first child element with the given local name. */
export function childNamed(element: XmlElement, name: string): XmlElement | undefined {
  return element.children.find((c) => c.name === name);
}

/** All descendants (depth-first) with the given local name. */
export function descendantsNamed(element: XmlElement, name: string): XmlElement[] {
  const found: XmlElement[] = [];
  const stack = [...element.children].reverse();
  while (stack.length > 0) {
    const el = stack.pop()!;
    if (el.name === name) found.push(el);
    stack.push(...[...el.children].reverse());
  }
  return found;
}
