/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Schema selection: maps the root element namespace of a document to a bundled B2C Commerce XSD.
 */
import fs from 'node:fs';
import path from 'node:path';
import {listSchemas} from '../docs/schema.js';
import {XSD_DATA_DIR} from '../docs/types.js';

/** Number of bytes read from the start of a document to find its root element. */
const HEADER_WINDOW = 64 * 1024;

/** Bundled schemas that are only imported by others and never describe a document. */
const IMPORT_ONLY_SCHEMAS = new Set(['xml']);

/** A bundled schema that can validate documents. */
export interface BundledXmlSchema {
  /** Schema ID, as shown by `b2c docs schema --list` (for example `catalog`). */
  id: string;
  /** Absolute path to the `.xsd` file. */
  path: string;
  /** Names of the global elements the schema declares, any of which can be a document root. */
  rootElements: string[];
  targetNamespace: string;
}

/** Root element of a document, as found by {@link readRootElement}. */
export interface XmlRootElement {
  localName: string;
  namespace?: string;
}

let catalog: BundledXmlSchema[] | undefined;

/** Names of the elements declared directly under `<xs:schema>`. */
function globalElementNames(xsd: string): string[] {
  const names: string[] = [];
  let depth = 0;
  for (const [, close, tagName, attrs, selfClosing] of xsd
    .replaceAll(/<!--[\s\S]*?-->/g, '')
    .matchAll(/<(\/?)([\w.:-]+)([^>]*?)(\/?)>/g)) {
    if (close) {
      depth--;
      continue;
    }
    if (depth === 1 && /(?:^|:)element$/.test(tagName)) {
      const name = /\sname\s*=\s*"([^"]+)"/.exec(attrs)?.[1];
      if (name) names.push(name);
    }
    if (!selfClosing) depth++;
  }
  return names;
}

/**
 * Bundled schemas that can validate documents, with their target namespace and global elements.
 */
export function getBundledXmlSchemas(): BundledXmlSchema[] {
  if (catalog) return catalog;
  const schemas: BundledXmlSchema[] = [];
  for (const entry of listSchemas()) {
    if (IMPORT_ONLY_SCHEMAS.has(entry.id)) continue;
    const schemaPath = path.join(XSD_DATA_DIR, entry.filePath);
    const xsd = fs.readFileSync(schemaPath, 'utf8');
    const targetNamespace = /targetNamespace\s*=\s*"([^"]+)"/.exec(xsd)?.[1];
    if (targetNamespace) {
      schemas.push({id: entry.id, path: schemaPath, rootElements: globalElementNames(xsd), targetNamespace});
    }
  }
  catalog = schemas;
  return catalog;
}

/**
 * Find the bundled schema for a document. Some namespaces are shared by several schemas (for example
 * `customer` and `customerlist2`), so the root element name picks between them.
 */
export function findBundledXmlSchema(namespace: string, rootElement?: string): BundledXmlSchema | undefined {
  const candidates = getBundledXmlSchemas().filter((schema) => schema.targetNamespace === namespace);
  return (rootElement && candidates.find((schema) => schema.rootElements.includes(rootElement))) || candidates[0];
}

/**
 * Resolve a `schema` option: a bundled schema ID, or a path to an `.xsd` file.
 *
 * @returns The schema label (ID or path as given) and the absolute path of the `.xsd` file
 * @throws Error when the value is neither a bundled schema ID nor an existing file
 */
export function resolveXmlSchema(schema: string, cwd = process.cwd()): {label: string; path: string} {
  for (const bundled of getBundledXmlSchemas()) {
    if (bundled.id === schema) return {label: bundled.id, path: bundled.path};
  }
  const schemaPath = path.resolve(cwd, schema);
  if (fs.existsSync(schemaPath) && fs.statSync(schemaPath).isFile()) return {label: schema, path: schemaPath};
  throw new Error(
    `Unknown schema "${schema}". Use a bundled schema ID (see "b2c docs schema --list") or a path to an .xsd file.`,
  );
}

/** Index of the `>` that ends the tag starting at `start`, skipping quoted attribute values. */
function findTagEnd(text: string, start: number): number {
  let quote: string | undefined;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = undefined;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return i;
    }
  }
  return -1;
}

function attributeValue(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name.replaceAll('.', '\\.')}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tag);
  return match ? (match[1] ?? match[2]) : undefined;
}

/**
 * Find the root element and its namespace from the start of a document, skipping the XML declaration,
 * comments, processing instructions, and a DOCTYPE. Returns undefined when no root start tag is found in the
 * first 64 KB.
 */
export function readRootElement(contents: Uint8Array): undefined | XmlRootElement {
  const text = Buffer.from(contents.buffer, contents.byteOffset, Math.min(contents.byteLength, HEADER_WINDOW)).toString(
    'utf8',
  );
  let index = text.charCodeAt(0) === 0xfe_ff ? 1 : 0;
  while (index < text.length) {
    const next = text.indexOf('<', index);
    if (next === -1) return undefined;
    index = next;
    let end: number;
    if (text.startsWith('<!--', index)) {
      end = text.indexOf('-->', index + 4);
      if (end === -1) return undefined;
      index = end + 3;
    } else if (text.startsWith('<?', index)) {
      end = text.indexOf('?>', index + 2);
      if (end === -1) return undefined;
      index = end + 2;
    } else if (text.startsWith('<!', index)) {
      // DOCTYPE, possibly with an internal subset in brackets.
      const bracket = text.indexOf('[', index);
      const close = text.indexOf('>', index);
      end = bracket !== -1 && bracket < close ? text.indexOf(']', bracket) : close;
      end = end === -1 ? -1 : text.indexOf('>', end);
      if (end === -1) return undefined;
      index = end + 1;
    } else {
      end = findTagEnd(text, index);
      if (end === -1) return undefined;
      const tag = text.slice(index, end + 1);
      const name = /^<(?:([A-Za-z_][\w.-]*):)?([A-Za-z_][\w.-]*)/.exec(tag);
      if (!name) return undefined;
      const [, prefix, localName] = name;
      const namespace = attributeValue(tag, prefix ? `xmlns:${prefix}` : 'xmlns');
      return namespace ? {localName, namespace} : {localName};
    }
  }
  return undefined;
}
