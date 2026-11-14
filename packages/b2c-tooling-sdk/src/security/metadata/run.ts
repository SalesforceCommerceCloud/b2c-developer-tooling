/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

import type {ScriptComment, ScriptRuleReport} from '../script/runner.js';
import type {MetadataDocument, MetadataFileKind, MetadataRule} from './types.js';
import {parseXml} from './xml.js';

/** XML root elements (local names) the metadata analyzer reads. */
const XML_ROOTS: Readonly<Record<string, MetadataFileKind>> = {
  services: 'services',
  preferences: 'preferences',
  metadata: 'metadata',
  'csrf-whitelists': 'csrf-allowlist',
};

/** Files larger than this are not read for metadata checks (catalogs and price books can be huge and are never checked). */
const MAX_METADATA_BYTES = 20 * 1024 * 1024;

/** The root element's local name from the start of an XML document. */
export function xmlRootName(head: string): string | undefined {
  const re = /<([^?!/\s>][^\s>/]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(head)) !== null) {
    return match[1].replace(/^.*:/, '');
  }
  return undefined;
}

/**
 * The metadata kind of a file, from its name (OCAPI settings JSON) or, for
 * XML, its root element. `head` is the start of the file.
 */
export function detectMetadataKind(file: string, head: string): MetadataFileKind | undefined {
  const base = path.basename(file).toLowerCase();
  if (base.endsWith('.json')) {
    const inOcapiDir = path.basename(path.dirname(file)).toLowerCase() === 'ocapi-settings';
    return /^wapi_\w+_config\.json$/.test(base) || inOcapiDir ? 'ocapi-settings' : undefined;
  }
  if (!base.endsWith('.xml')) return undefined;
  const root = xmlRootName(head);
  return root ? XML_ROOTS[root] : undefined;
}

/** Reads the first `bytes` of a file. */
export function readHead(file: string, bytes = 4096): string {
  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.alloc(bytes);
    const read = fs.readSync(fd, buffer, 0, bytes, 0);
    return buffer.subarray(0, read).toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

/** Returns the metadata kind of a file on disk, or undefined when it isn't a metadata file the analyzer reads. */
export function metadataKindOfFile(file: string): MetadataFileKind | undefined {
  if (!/\.(xml|json)$/i.test(file)) return undefined;
  try {
    if (fs.statSync(file).size > MAX_METADATA_BYTES) return undefined;
    return detectMetadataKind(file, readHead(file));
  } catch {
    return undefined;
  }
}

/** The result of running metadata rules over one file. */
export interface MetadataRunResult {
  reports: ScriptRuleReport[];
  comments: ScriptComment[];
  parseError?: {message: string};
}

/** Parses a metadata file of a known kind. Throws on malformed XML or JSON. */
export function parseMetadataDocument(
  text: string,
  file: string,
  kind: MetadataFileKind,
): {document: MetadataDocument; comments: ScriptComment[]} {
  if (kind === 'ocapi-settings') {
    return {document: {kind, format: 'json', file, text, data: JSON.parse(text)}, comments: []};
  }
  const tree = parseXml(text);
  const comments: ScriptComment[] = tree.comments.map((c) => ({
    type: 'Block',
    value: c.value,
    loc: {start: {line: c.loc.start.line, column: 0}, end: {line: c.loc.end.line, column: 0}},
  }));
  return {document: {kind, format: 'xml', file, text, root: tree.root}, comments};
}

/** Runs metadata rules that apply to `kind` over one file's text. */
export function runMetadataRules(
  text: string,
  file: string,
  kind: MetadataFileKind,
  rules: readonly MetadataRule[],
): MetadataRunResult {
  let parsed: ReturnType<typeof parseMetadataDocument>;
  try {
    parsed = parseMetadataDocument(text, file, kind);
  } catch (error) {
    return {
      reports: [],
      comments: [],
      parseError: {message: error instanceof Error ? error.message.split('\n')[0] : String(error)},
    };
  }
  const reports: ScriptRuleReport[] = [];
  for (const rule of rules) {
    if (!rule.kinds.includes(kind)) continue;
    rule.check(parsed.document, (problem) => {
      reports.push({
        ruleId: rule.meta.b2c.id,
        message: problem.message,
        line: problem.line,
        column: problem.column ?? 1,
        endLine: problem.line,
        endColumn: problem.column ?? 1,
      });
    });
  }
  reports.sort((a, b) => a.line - b.line || a.column - b.column);
  return {reports, comments: parsed.comments};
}
