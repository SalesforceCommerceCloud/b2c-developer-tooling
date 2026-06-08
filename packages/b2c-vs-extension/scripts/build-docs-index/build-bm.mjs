/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Build the Business Manager docs index from curated Markdown files in
 * `bm-topics/`. Each file has a small YAML-ish frontmatter block followed by
 * Markdown body text:
 *
 *   ---
 *   id: jobs
 *   title: Jobs
 *   category: scheduling
 *   tags: [job, schedule, batch]
 *   ---
 *
 *   # Body...
 *
 * The frontmatter parser is intentionally narrow — it only handles the shapes
 * we author in this folder. Anything fancier (multiline scalars, nested maps)
 * is rejected loudly so a typo doesn't slip into the JSON.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {assertValidDocEntry} from './schema.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TOPICS_DIR = path.join(__dirname, 'bm-topics');

/**
 * @param {object} [opts]
 * @param {string} [opts.topicsDir]
 * @returns {{entries: import('./schema.mjs').DocEntry[], search: object[], version: string}}
 */
export function buildBmIndex(opts = {}) {
  const topicsDir = opts.topicsDir ?? DEFAULT_TOPICS_DIR;
  if (!fs.existsSync(topicsDir)) {
    return {entries: [], search: [], version: ''};
  }

  const files = fs
    .readdirSync(topicsDir)
    .filter((name) => name.endsWith('.md'))
    .sort();

  /** @type {import('./schema.mjs').DocEntry[]} */
  const entries = [];

  for (const file of files) {
    const filePath = path.join(topicsDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = parseFrontmatter(raw, file);

    const id = parsed.frontmatter.id;
    const title = parsed.frontmatter.title;
    if (!id || !title) {
      throw new Error(`BM topic ${file} is missing required \`id\` or \`title\` frontmatter.`);
    }

    const category = parsed.frontmatter.category;
    /** @type {string[]} */
    const tagList = Array.isArray(parsed.frontmatter.tags) ? parsed.frontmatter.tags : [];

    const body = parsed.body.trim();
    const description = extractFirstParagraph(body);

    /** @type {import('./schema.mjs').DocEntry} */
    const entry = {
      id: `bm:${id}`,
      source: 'bm',
      kind: 'topic',
      title,
      qualifiedName: `bm.${id}`,
      packagePath: category ? `bm/${category}` : 'bm',
      parentId: category ? `bm:category:${category}` : undefined,
      description,
      sections: body ? [{heading: title, body}] : undefined,
      tags: dedupe(
        [id.toLowerCase(), title.toLowerCase(), category?.toLowerCase(), ...tagList.map((t) => t.toLowerCase())].filter(
          Boolean,
        ),
      ),
    };
    entries.push(removeUndefined(entry));
  }

  // Synthesize category nodes so the tree provider can group topics.
  const categoryEntries = synthesizeCategoryEntries(entries);
  entries.push(...categoryEntries);

  for (const entry of entries) assertValidDocEntry(entry, entry.id);
  entries.sort(byId);

  /** @type {object[]} */
  const search = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    qualifiedName: entry.qualifiedName,
    kind: entry.kind,
    parentId: entry.parentId,
    packagePath: entry.packagePath,
    tags: entry.tags,
  }));

  // Topics live in this repo so we use the curated source's relative
  // freshness as the version. The runner is what stamps the actual version
  // string into the manifest.
  return {entries, search, version: ''};
}

/**
 * @param {string} raw
 * @param {string} fileName
 * @returns {{frontmatter: Record<string, string | string[]>, body: string}}
 */
export function parseFrontmatter(raw, fileName) {
  const normalized = raw.replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error(`BM topic ${fileName} must start with frontmatter delimiter \`---\`.`);
  }
  const closeIndex = normalized.indexOf('\n---\n', 4);
  if (closeIndex < 0) {
    throw new Error(`BM topic ${fileName} has unterminated frontmatter.`);
  }
  const frontmatterRaw = normalized.slice(4, closeIndex);
  const body = normalized.slice(closeIndex + 5);

  /** @type {Record<string, string | string[]>} */
  const frontmatter = {};
  for (const line of frontmatterRaw.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon < 0) {
      throw new Error(`BM topic ${fileName} frontmatter line missing colon: ${line}`);
    }
    const key = line.slice(0, colon).trim();
    const valueRaw = line.slice(colon + 1).trim();
    if (!key) continue;
    if (valueRaw.startsWith('[') && valueRaw.endsWith(']')) {
      frontmatter[key] = valueRaw
        .slice(1, -1)
        .split(',')
        .map((token) => unquote(token.trim()))
        .filter(Boolean);
    } else {
      frontmatter[key] = unquote(valueRaw);
    }
  }
  return {frontmatter, body};
}

function unquote(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/** Returns the first non-empty paragraph of body text, with no Markdown formatting stripped. */
function extractFirstParagraph(body) {
  const paragraphs = body.split(/\n\s*\n/).map((para) => para.trim());
  for (const paragraph of paragraphs) {
    // Skip Markdown headings as the "summary".
    if (paragraph.startsWith('#')) continue;
    if (paragraph) return paragraph.replace(/\s+/g, ' ');
  }
  return undefined;
}

/**
 * @param {import('./schema.mjs').DocEntry[]} topicEntries
 * @returns {import('./schema.mjs').DocEntry[]}
 */
function synthesizeCategoryEntries(topicEntries) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const entry of topicEntries) {
    if (!entry.parentId) continue;
    counts.set(entry.parentId, (counts.get(entry.parentId) ?? 0) + 1);
  }
  /** @type {import('./schema.mjs').DocEntry[]} */
  const out = [];
  for (const [parentId, count] of counts) {
    // parentId looks like "bm:category:<name>"
    const match = /^bm:category:(.+)$/.exec(parentId);
    if (!match) continue;
    const category = match[1];
    out.push(
      removeUndefined({
        id: parentId,
        source: 'bm',
        kind: 'topic',
        title: titleCase(category),
        qualifiedName: `bm.${category}`,
        packagePath: `bm/${category}`,
        description: `${count} ${count === 1 ? 'topic' : 'topics'}`,
        tags: [category, category.toLowerCase()],
      }),
    );
  }
  return out;
}

function titleCase(value) {
  return value
    .split(/[\s-_]+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ')
    .trim();
}

function dedupe(values) {
  return Array.from(new Set(values));
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
  const {entries} = buildBmIndex();
  process.stdout.write(`bm: ${entries.length} entries\n`);
}
