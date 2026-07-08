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
 * context alongside the platform docs. Only hand-written conceptual guides are
 * indexed; the auto-generated CLI reference (`docs/cli/*`), the MCP tool
 * reference, the changelog, and landing pages are intentionally excluded (they
 * are redundant with `--help` / MCP introspection or carry no teaching content).
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

/** Conceptual guide files to index, relative to the repo `docs/` directory. */
const INCLUDE: readonly string[] = [
  'guide/authentication.md',
  'guide/configuration.md',
  'guide/installation.md',
  'guide/ci-cd.md',
  'guide/account-manager.md',
  'guide/agent-skills.md',
  'guide/analytics-reports-cip-ccac.md',
  'guide/commerce-apps.md',
  'guide/extending.md',
  'guide/ide-integration.md',
  'guide/mrt-utilities.md',
  'guide/safety.md',
  'guide/scaffolding.md',
  'guide/script-debugger.md',
  'guide/sdk-migration.md',
  'guide/security.md',
  'guide/sfcc-ci-migration.md',
  'guide/storefront-next.md',
  'guide/third-party-plugins.md',
  'mcp/index.md',
  'mcp/installation.md',
  'mcp/configuration.md',
  'mcp/toolsets.md',
  'mcp/figma-tools-setup.md',
];

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

/** Strips YAML frontmatter and returns {frontmatter, body}. */
function splitFrontmatter(md: string): {description?: string; body: string} {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return {body: md};
  const descMatch = m[1].match(/^description:\s*(.+)$/m);
  const description = descMatch?.[1]?.trim().replace(/^["']|["']$/g, '');
  return {description, body: m[2]};
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

function main(): void {
  fs.mkdirSync(TOOLING_DIR, {recursive: true});
  // Remove any previously bundled markdown — tooling content is now fetched
  // online (like the guides corpus), so only index.json ships in data/tooling/.
  for (const existing of fs.readdirSync(TOOLING_DIR)) {
    if (existing.endsWith('.md')) fs.rmSync(path.join(TOOLING_DIR, existing));
  }

  const entries: DocEntry[] = [];

  for (const rel of INCLUDE) {
    const srcPath = path.join(DOCS_ROOT, rel);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Warning: tooling doc not found, skipping: ${rel}`);
      continue;
    }
    const raw = fs.readFileSync(srcPath, 'utf-8');
    const {description, body} = splitFrontmatter(raw);

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

  const index: SearchIndex = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(path.join(TOOLING_DIR, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`Generated tooling index: ${entries.length} entries at ${path.join(TOOLING_DIR, 'index.json')}`);
}

main();
