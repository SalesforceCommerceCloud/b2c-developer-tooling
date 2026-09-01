/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generates the bundled markdown + search index for the **`tooling` corpus** —
 * this project's own conceptual guides (how to use the B2C CLI, MCP server, and
 * SDK: authentication, configuration, CI/CD, safety, scaffolding, etc.).
 *
 * These teach an agent how to drive the tooling itself, which is high-value
 * context alongside the platform docs. Because these docs are maintained in
 * this repository, every searchable Markdown page in the published tooling
 * sections is discovered automatically. This keeps the search corpus in sync
 * when a new guide, CLI reference page, MCP page, or VS Code extension page is
 * added. Asset README files and redirect stubs are ignored.
 *
 * Like the Developer Center guides corpus, tooling *content* is NOT bundled — the
 * index stores only lightweight metadata (title, section headings, preview, and
 * the canonical published URL). `docs read` fetches the full markdown from the
 * docs site's raw `.md` (`sourceUrl`) on demand, with an offline fallback to the
 * indexed summary. This avoids duplicating every doc page into the SDK: editing a
 * tooling doc only changes `index.json` when its title/headings/preview change,
 * not on every content edit.
 *
 * Run with: pnpm --filter @salesforce/b2c-tooling-sdk run generate:tooling-index
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Published internal documentation sections, relative to `docs/`. */
const TOOLING_DOC_ROOTS: readonly string[] = ['guide', 'cli', 'mcp', 'vscode-extension'];

const DOCS_SITE_BASE = 'https://salesforcecommercecloud.github.io/b2c-developer-tooling';

interface DocEntry {
  id: string;
  title: string;
  category: string;
  url?: string;
  sourceUrl?: string;
  headings?: string;
  preview?: string;
}

interface SearchIndex {
  version: string;
  generatedAt: string;
  entries: DocEntry[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SDK_ROOT, '../..');
const DOCS_ROOT = path.join(REPO_ROOT, 'docs');
const TOOLING_DIR = path.join(SDK_ROOT, 'data', 'tooling');

/** Strips YAML frontmatter and returns the searchable metadata and body. */
function splitFrontmatter(md: string): {description?: string; body: string; isRedirect: boolean} {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return {body: md, isRedirect: false};
  const descMatch = m[1].match(/^description:\s*(.+)$/m);
  const description = descMatch?.[1]?.trim().replace(/^["']|["']$/g, '');
  const isRedirect = /http-equiv['"]?\s*:\s*['"]?refresh/i.test(m[1]);
  return {description, body: m[2], isRedirect};
}

function extractTitle(md: string, fallback: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim() || fallback;
}

function extractHeadings(md: string): string {
  const headings: string[] = [];
  for (const line of md.split('\n')) {
    const h = line.match(/^#{2,4}\s+(.+)$/);
    if (h) headings.push(h[1].trim());
  }
  return headings.join(' • ');
}

function firstParagraph(body: string): string | undefined {
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && !t.startsWith('-') && !t.startsWith('>') && !t.startsWith('|')) {
      return t.length > 200 ? t.slice(0, 200).replace(/\s+\S*$/, '') + '...' : t;
    }
  }
  return undefined;
}

/** Recursively discovers published Markdown pages in a documentation section. */
function discoverMarkdownPages(relativeRoot: string): string[] {
  const absoluteRoot = path.join(DOCS_ROOT, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) throw new Error(`Tooling docs root not found: ${relativeRoot}`);

  const pages: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name.toLowerCase() !== 'readme.md') {
        pages.push(path.relative(DOCS_ROOT, absolutePath).split(path.sep).join('/'));
      }
    }
  };

  visit(absoluteRoot);
  return pages;
}

function sameIndexContent(left: SearchIndex, right: SearchIndex): boolean {
  return left.version === right.version && JSON.stringify(left.entries) === JSON.stringify(right.entries);
}

function readExistingIndex(indexPath: string): SearchIndex | undefined {
  if (!fs.existsSync(indexPath)) return undefined;
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SearchIndex;
}

function main(): void {
  fs.mkdirSync(TOOLING_DIR, {recursive: true});
  // Remove any previously bundled markdown — tooling content is now fetched
  // online (like the guides corpus), so only index.json ships in data/tooling/.
  for (const existing of fs.readdirSync(TOOLING_DIR)) {
    if (existing.endsWith('.md')) fs.rmSync(path.join(TOOLING_DIR, existing));
  }

  const entries: DocEntry[] = [];
  const pages = TOOLING_DOC_ROOTS.flatMap((root) => discoverMarkdownPages(root));

  for (const rel of pages) {
    const srcPath = path.join(DOCS_ROOT, rel);
    const raw = fs.readFileSync(srcPath, 'utf-8');
    const {description, body, isRedirect} = splitFrontmatter(raw);
    if (isRedirect) continue;

    // Flat id: "guide/authentication.md" -> "guide-authentication"
    const id = rel.replace(/\.md$/, '').replace(/\//g, '-');
    const title = extractTitle(body, id);
    const headings = extractHeadings(body);
    const preview = description || firstParagraph(body);
    // `url` = human-facing .html page; `sourceUrl` = raw .md fetched at read time.
    // Both are served by the docs site at the same path. No `filePath`: content
    // is not bundled, so readEntryContent fetches sourceUrl online (with an
    // offline fallback to the indexed summary).
    const pageBase = `${DOCS_SITE_BASE}/${rel.replace(/\.md$/, '')}`;

    entries.push({
      id,
      title,
      category: 'tooling',
      url: `${pageBase}.html`,
      sourceUrl: `${pageBase}.md`,
      ...(headings && {headings}),
      ...(preview && {preview}),
    });
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  const indexPath = path.join(TOOLING_DIR, 'index.json');
  const existing = readExistingIndex(indexPath);
  const candidate: SearchIndex = {
    version: '2.0.0',
    generatedAt: existing?.generatedAt ?? new Date().toISOString(),
    entries,
  };

  if (process.argv.includes('--check')) {
    if (!existing || !sameIndexContent(existing, candidate)) {
      console.error('Tooling documentation index is stale. Run `pnpm generate:tooling-index`.');
      process.exitCode = 1;
      return;
    }
    console.log(`Tooling documentation index is current (${entries.length} entries).`);
    return;
  }

  if (existing && sameIndexContent(existing, candidate)) {
    console.log(`Tooling documentation index is already current (${entries.length} entries).`);
    return;
  }

  candidate.generatedAt = new Date().toISOString();
  fs.writeFileSync(indexPath, JSON.stringify(candidate, null, 2) + '\n');

  console.log(`Generated tooling index: ${entries.length} entries at ${indexPath}`);
}

main();
