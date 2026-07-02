/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generates the bundled search index for B2C Commerce **Developer Center guides**
 * (conceptual / how-to prose) from a local clone of the `commerce-cloud-docs`
 * content repository.
 *
 * Unlike the Script API / job-step corpora, guide *content* is NOT bundled — the
 * index stores only lightweight metadata (title, section headings, category, and
 * the canonical published URL). `b2c docs read` fetches the full markdown from the
 * published URL on demand. This keeps the package small while still giving agents
 * content-aware search (title + headings + optional LLM-generated summary/keywords).
 *
 * The canonical URL is derived deterministically from the repo path:
 *   {category}/guides/<any/nested/dirs>/<basename>.md
 *     -> https://developer.salesforce.com/docs/commerce/{category}/guide/<basename>.md
 * (`guides` -> `guide`, nested dirs flattened, basename preserved verbatim). Basenames
 * are unique within each category, so flattening does not collide.
 *
 * Optional enrichment: if `data/guides/enrichment.json` exists (produced by
 * `enrich-docs.ts`), each entry is augmented with an LLM-generated `summary` and
 * `keywords` for better recall. Missing enrichment is simply omitted.
 *
 * Usage:
 *   COMMERCE_DOCS_REPO=/path/to/commerce-cloud-docs \
 *     pnpm --filter @salesforce/b2c-tooling-sdk run generate:guides-index
 *
 * Defaults to ~/code/commerce-cloud-docs when COMMERCE_DOCS_REPO is unset.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Developer Center projects (categories) whose guides we index. */
const CATEGORIES = ['commerce-api', 'pwa-kit-managed-runtime', 'sfnext', 'sfra', 'b2c-commerce'] as const;

interface DocEntry {
  id: string;
  title: string;
  category: string;
  url: string;
  headings?: string;
  summary?: string;
  keywords?: string[];
}

interface SearchIndex {
  version: string;
  generatedAt: string;
  entries: DocEntry[];
}

interface EnrichmentEntry {
  summary?: string;
  keywords?: string[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUIDES_DIR = path.resolve(__dirname, '../data/guides');
const ENRICHMENT_PATH = path.join(GUIDES_DIR, 'enrichment.json');

function resolveDocsRepo(): string {
  const env = process.env.COMMERCE_DOCS_REPO;
  const repo = env ? path.resolve(env) : path.join(os.homedir(), 'code', 'commerce-cloud-docs');
  const contentDir = path.join(repo, 'content', 'en-us');
  if (!fs.existsSync(contentDir)) {
    throw new Error(
      `commerce-cloud-docs content not found at ${contentDir}. ` +
        `Clone the repo and set COMMERCE_DOCS_REPO to its root (default: ~/code/commerce-cloud-docs).`,
    );
  }
  return contentDir;
}

/** Recursively lists every `.md` file under a directory. */
function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function extractTitle(md: string, fallback: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim() || fallback;
}

/** Collects section headings (h2-h4; skips the h1 title) into one string. */
function extractHeadings(md: string): string {
  const headings: string[] = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^#{2,4}\s+(.+)$/);
    if (m) headings.push(m[1].trim());
  }
  return headings.join(' • ');
}

function loadEnrichment(): Map<string, EnrichmentEntry> {
  const map = new Map<string, EnrichmentEntry>();
  if (!fs.existsSync(ENRICHMENT_PATH)) return map;
  try {
    const parsed = JSON.parse(fs.readFileSync(ENRICHMENT_PATH, 'utf-8')) as Record<string, EnrichmentEntry>;
    for (const [id, e] of Object.entries(parsed)) map.set(id, e);
  } catch (err) {
    console.warn(`Warning: could not read enrichment at ${ENRICHMENT_PATH}: ${(err as Error).message}`);
  }
  return map;
}

function main(): void {
  const contentDir = resolveDocsRepo();
  const enrichment = loadEnrichment();

  const entries: DocEntry[] = [];
  const seen = new Set<string>();

  for (const category of CATEGORIES) {
    const guidesDir = path.join(contentDir, category, 'guides');
    const files = walkMarkdown(guidesDir);

    for (const file of files) {
      const basename = path.basename(file, '.md');
      const id = `${category}/${basename}`;
      if (seen.has(id)) {
        console.warn(`Warning: duplicate basename within ${category}: ${basename} (skipping ${file})`);
        continue;
      }
      seen.add(id);

      const md = fs.readFileSync(file, 'utf-8');
      const title = extractTitle(md, basename);
      const headings = extractHeadings(md);
      const url = `https://developer.salesforce.com/docs/commerce/${category}/guide/${basename}.md`;
      const enr = enrichment.get(id);

      entries.push({
        id,
        title,
        category,
        url,
        ...(headings && {headings}),
        ...(enr?.summary && {summary: enr.summary}),
        ...(enr?.keywords?.length && {keywords: enr.keywords}),
      });
    }
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  const index: SearchIndex = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    entries,
  };

  fs.mkdirSync(GUIDES_DIR, {recursive: true});
  fs.writeFileSync(path.join(GUIDES_DIR, 'index.json'), JSON.stringify(index, null, 2));

  const enriched = entries.filter((e) => e.summary).length;
  console.log(
    `Generated guides index: ${entries.length} entries across ${CATEGORIES.length} categories ` +
      `(${enriched} enriched) at ${path.join(GUIDES_DIR, 'index.json')}`,
  );
}

main();
