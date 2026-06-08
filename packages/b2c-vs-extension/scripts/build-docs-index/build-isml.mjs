/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Convert the curated `isml-tags.json` source into the docs-index DocEntry shape.
 *
 * Output is two files:
 *   - isml.json        full DocEntry[] (loaded lazily on first lookup)
 *   - isml-search.json lightweight {id,title,qualifiedName,kind,parentId,tags}[]
 *
 * The curated source is the canonical place to evolve ISML docs — the runtime
 * hover provider in `src/isml/hover.ts` will be migrated to read from the same
 * source in a follow-up PR so the two never drift.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {assertValidDocEntry} from './schema.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SOURCE = path.join(__dirname, 'isml-tags.json');

/**
 * @param {object} [opts]
 * @param {string} [opts.sourcePath] override the curated source location
 * @returns {{entries: import('./schema.mjs').DocEntry[], search: object[], version: string}}
 */
export function buildIsmlIndex(opts = {}) {
  const sourcePath = opts.sourcePath ?? DEFAULT_SOURCE;
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`ISML curated source not found at ${sourcePath}`);
  }

  const raw = fs.readFileSync(sourcePath, 'utf8');
  const parsed = /** @type {{version?: string, tags?: unknown}} */ (JSON.parse(raw));
  if (!Array.isArray(parsed.tags)) {
    throw new Error(`ISML curated source must contain a top-level "tags" array.`);
  }
  const version = typeof parsed.version === 'string' ? parsed.version : '';

  /** @type {import('./schema.mjs').DocEntry[]} */
  const entries = [];

  for (const tag of parsed.tags) {
    if (!tag || typeof tag !== 'object') continue;
    const t = /** @type {Record<string, unknown>} */ (tag);
    const name = typeof t.name === 'string' ? t.name : '';
    if (!name) continue;

    const summary = typeof t.summary === 'string' ? t.summary : undefined;
    const syntax = typeof t.syntax === 'string' ? t.syntax : undefined;
    const tips = Array.isArray(t.tips) ? t.tips.filter((x) => typeof x === 'string') : undefined;
    const examples = Array.isArray(t.examples) ? t.examples.filter((x) => typeof x === 'string') : undefined;
    const attributes = Array.isArray(t.attributes)
      ? t.attributes
          .map((attr) => {
            if (!attr || typeof attr !== 'object') return undefined;
            const a = /** @type {Record<string, unknown>} */ (attr);
            const attrName = typeof a.name === 'string' ? a.name : '';
            if (!attrName) return undefined;
            return removeUndefined({
              name: attrName,
              required: typeof a.required === 'boolean' ? a.required : undefined,
              description: typeof a.description === 'string' ? a.description : undefined,
            });
          })
          .filter(Boolean)
      : undefined;

    const sections = [];
    if (syntax) {
      sections.push({heading: 'Syntax', body: '```isml\n' + syntax + '\n```'});
    }
    if (tips && tips.length > 0) {
      sections.push({heading: 'Tips', body: tips.map((tip) => '- ' + tip).join('\n')});
    }

    /** @type {import('./schema.mjs').DocEntry} */
    const entry = {
      id: `isml:${name}`,
      source: 'isml',
      kind: 'tag',
      title: `<${name}>`,
      qualifiedName: `isml.${name}`,
      description: summary,
      sections: sections.length > 0 ? sections : undefined,
      examples: examples && examples.length > 0 ? examples : undefined,
      tags: [name.toLowerCase(), `<${name.toLowerCase()}>`, 'isml'],
      attributes: attributes && attributes.length > 0 ? attributes : undefined,
    };
    entries.push(removeUndefined(entry));
  }

  for (const entry of entries) assertValidDocEntry(entry, entry.id);
  entries.sort(byId);

  /** @type {object[]} */
  const search = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    qualifiedName: entry.qualifiedName,
    kind: entry.kind,
    parentId: entry.parentId,
    tags: entry.tags,
  }));

  return {entries, search, version};
}

/**
 * @template {object} T
 * @param {T} obj
 * @returns {T}
 */
function removeUndefined(obj) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) delete obj[key];
  }
  return obj;
}

/**
 * @param {import('./schema.mjs').DocEntry} a
 * @param {import('./schema.mjs').DocEntry} b
 */
function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

if (process.argv[1] === __filename) {
  const {entries, version} = buildIsmlIndex();
  process.stdout.write(`isml v${version || '(no version)'}: ${entries.length} entries\n`);
}
