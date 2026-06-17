#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Guard for the agent-skills / install-skills page split (and docs anchors in
 * general): verify every internal markdown link of the form `/path#anchor`
 * resolves to a real heading slug or explicit {#id} / <a id> in the target
 * page. VitePress fails the build on dead anchors, but this runs without a full
 * build so the `skills` CI job catches a broken anchor fast and with a clear
 * message. Scans docs/**.md.
 */

import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = join(repoRoot, 'docs');

const errors = [];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, {withFileTypes: true})) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'public' || e.name === 'api') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** GitHub-style heading slug (lowercase, spaces→-, drop non-word except -). */
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/** All anchor ids a page exposes: heading slugs, explicit {#id}, and <a id>. */
function anchorsFor(content) {
  const ids = new Set();
  for (const line of content.split('\n')) {
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      let text = h[1];
      const explicit = text.match(/\{#([A-Za-z0-9_-]+)\}\s*$/);
      if (explicit) {
        ids.add(explicit[1]);
        text = text.replace(/\{#[A-Za-z0-9_-]+\}\s*$/, '');
      }
      ids.add(slugify(text));
    }
    for (const m of line.matchAll(/<a\s+id=["']([A-Za-z0-9_-]+)["']/g)) ids.add(m[1]);
    for (const m of line.matchAll(/\{#([A-Za-z0-9_-]+)\}/g)) ids.add(m[1]);
  }
  return ids;
}

function resolvePage(linkPath) {
  // linkPath is like /guide/install-skills → docs/guide/install-skills.md
  // or /guide/ → docs/guide/index.md
  const clean = linkPath.replace(/^\//, '');
  const candidates = clean.endsWith('/')
    ? [join(docsRoot, clean, 'index.md')]
    : [join(docsRoot, `${clean}.md`), join(docsRoot, clean, 'index.md')];
  return candidates.find((c) => existsSync(c)) ?? null;
}

const files = walk(docsRoot);
const anchorCache = new Map();

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const m of content.matchAll(/\]\((\/[^)#\s]+)#([A-Za-z0-9_-]+)\)/g)) {
    const [, pagePath, anchor] = m;
    const target = resolvePage(pagePath);
    if (!target) {
      errors.push(`${file.replace(repoRoot + '/', '')}: link to "${pagePath}#${anchor}" — page not found`);
      continue;
    }
    if (!anchorCache.has(target)) anchorCache.set(target, anchorsFor(readFileSync(target, 'utf8')));
    if (!anchorCache.get(target).has(anchor)) {
      errors.push(`${file.replace(repoRoot + '/', '')}: anchor "#${anchor}" not found in ${pagePath}`);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\ncheck-doc-anchors: ${errors.length} broken anchor link(s).`);
  process.exit(1);
}
console.log(`check-doc-anchors: OK (scanned ${files.length} docs).`);
