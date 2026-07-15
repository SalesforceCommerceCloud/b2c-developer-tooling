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
 * The canonical URLs are derived deterministically from the repo path:
 *   {category}/guides/<any/nested/dirs>/<basename>.md
 *     -> url:       https://developer.salesforce.com/docs/commerce/{category}/guide/<basename>.html
 *     -> sourceUrl: https://developer.salesforce.com/docs/commerce/{category}/guide/<basename>.md
 * (`guides` -> `guide`, nested dirs flattened, basename preserved verbatim). `url` is the
 * human-facing .html page; `sourceUrl` is the raw .md fetched for content. Basenames are
 * unique within each category, so flattening does not collide.
 *
 * IMPORTANT — only TOC-referenced files are indexed. The docs site publishes a
 * page only if it is linked from a guide table-of-contents YAML (e.g.
 * `b2c-commerce/guides/index.yml`, `sfra/guides/sfra-toc.yml`). Many `.md` files
 * live in the repo as orphans (old pages whose content was consolidated
 * elsewhere, drafts, etc.) and are NOT published — deriving a URL for them yields
 * a dead 404. We therefore gather the set of `.md` basenames referenced (via
 * uncommented `link:`/`source:` entries) by every guide TOC and skip any file
 * whose basename is not in that set. Basename matching (not full path) is used
 * deliberately: it mirrors the flattened URL scheme and tolerates a file being
 * referenced from a sibling category's TOC via a relative `../../` link.
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
  sourceUrl: string;
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

/** Recursively lists every file matching `predicate` under a directory. */
function walkFiles(dir: string, predicate: (name: string) => boolean): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, predicate));
    else if (entry.isFile() && predicate(entry.name)) out.push(full);
  }
  return out;
}

/** Recursively lists every `.md` file under a directory. */
function walkMarkdown(dir: string): string[] {
  return walkFiles(dir, (name) => name.endsWith('.md'));
}

/**
 * Matches a `link:` or `source:` YAML entry pointing at a `.md` file, capturing
 * the referenced path. Commented-out lines are excluded by the caller.
 */
const TOC_MD_LINK = /^\s*(?:link|source):\s*"?([^"\s]+\.md)"?\s*$/;

/**
 * Scans every guide table-of-contents YAML under `contentDir` and returns the
 * set of `.md` basenames (without extension) that are actually referenced — i.e.
 * the pages the docs site publishes. A page not in this set has no live URL.
 *
 * We match on basename rather than full path because URLs flatten nested dirs and
 * a page may be referenced from a sibling category's TOC via a relative link.
 * Lines that are commented out (`# link: ...`) are ignored so removed pages don't
 * leak back in.
 */
function collectTocBasenames(contentDir: string): Set<string> {
  const basenames = new Set<string>();
  const tocFiles = walkFiles(contentDir, (name) => name.endsWith('.yml')).filter((f) =>
    f.includes(`${path.sep}guides${path.sep}`),
  );
  for (const toc of tocFiles) {
    for (const rawLine of fs.readFileSync(toc, 'utf-8').split('\n')) {
      if (rawLine.trimStart().startsWith('#')) continue;
      const m = rawLine.match(TOC_MD_LINK);
      if (m) basenames.add(path.basename(m[1], '.md'));
    }
  }
  return basenames;
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
  const published = collectTocBasenames(contentDir);

  const entries: DocEntry[] = [];
  // Maps an id to the file that first claimed it, so a duplicate warning can
  // name both the kept and the skipped file (walk order is filesystem-dependent).
  const seen = new Map<string, string>();
  let skippedOrphans = 0;

  for (const category of CATEGORIES) {
    const guidesDir = path.join(contentDir, category, 'guides');
    const files = walkMarkdown(guidesDir);

    for (const file of files) {
      const basename = path.basename(file, '.md');
      // Skip files not referenced by any guide TOC — the docs site never
      // publishes them, so their derived URL would be a dead 404.
      if (!published.has(basename)) {
        skippedOrphans++;
        continue;
      }
      const id = `${category}/${basename}`;
      const keptFile = seen.get(id);
      if (keptFile) {
        console.warn(
          `Warning: duplicate basename within ${category}: ${basename}. Kept ${keptFile}, skipping ${file}.`,
        );
        continue;
      }
      seen.set(id, file);

      const md = fs.readFileSync(file, 'utf-8');
      const title = extractTitle(md, basename);
      const headings = extractHeadings(md);
      // `url` is the human-facing .html page (durable link); `sourceUrl` is the
      // raw .md that readEntryContent fetches at read time. Both are served at
      // the same path by developer.salesforce.com.
      const pageBase = `https://developer.salesforce.com/docs/commerce/${category}/guide/${basename}`;
      const enr = enrichment.get(id);

      entries.push({
        id,
        title,
        category,
        url: `${pageBase}.html`,
        sourceUrl: `${pageBase}.md`,
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
      `(${enriched} enriched, ${skippedOrphans} orphan files skipped as not TOC-referenced) ` +
      `at ${path.join(GUIDES_DIR, 'index.json')}`,
  );
}

main();
