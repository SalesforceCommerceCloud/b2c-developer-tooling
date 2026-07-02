/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * OPTIONAL build-time enrichment of the Developer Center guides corpus.
 *
 * For each guide it generates, via a fast/cheap LLM (Claude Haiku by default), a
 * one-line `summary` and a set of search `keywords`/synonyms. Merged into the
 * guides search index by `generate-guides-index.ts`, these measurably improve
 * recall for natural-language / agentic queries (a doc titled "Multiple Sites"
 * becomes findable via "configure sites.js locale currency", etc.) and give a
 * useful triage snippet in search results.
 *
 * This step is entirely optional and non-blocking:
 *   - If no API key is configured it prints a notice and exits 0 (no-op), so the
 *     normal build never depends on an LLM.
 *   - Output is a committed sidecar (`data/guides/enrichment.json`, id -> {summary,
 *     keywords}); the index build merges whatever exists.
 *
 * Modes:
 *   (default)   enrich only guides MISSING from the existing enrichment.json
 *   --full      re-enrich every guide (overwrites existing enrichment)
 *
 * Env:
 *   ANTHROPIC_API_KEY      required to run (else no-op). Bearer token.
 *   ANTHROPIC_BASE_URL     default https://api.anthropic.com
 *   DOCS_ENRICH_MODEL      default claude-haiku-4-5
 *   COMMERCE_DOCS_REPO     local commerce-cloud-docs clone (default ~/code/commerce-cloud-docs)
 *   DOCS_ENRICH_CONCURRENCY default 6
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... pnpm --filter @salesforce/b2c-tooling-sdk run enrich:docs
 *   ANTHROPIC_API_KEY=... pnpm --filter @salesforce/b2c-tooling-sdk run enrich:docs -- --full
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

const CATEGORIES = ['commerce-api', 'pwa-kit-managed-runtime', 'sfnext', 'sfra', 'b2c-commerce'] as const;

interface EnrichmentEntry {
  summary: string;
  keywords: string[];
}

interface GuideSource {
  id: string;
  category: string;
  title: string;
  excerpt: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUIDES_DIR = path.resolve(__dirname, '../data/guides');
const ENRICHMENT_PATH = path.join(GUIDES_DIR, 'enrichment.json');

const MODEL = process.env.DOCS_ENRICH_MODEL || 'claude-haiku-4-5';
const BASE_URL = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const API_KEY = process.env.ANTHROPIC_API_KEY;
const CONCURRENCY = Number(process.env.DOCS_ENRICH_CONCURRENCY || 6);

function resolveContentDir(): string {
  const env = process.env.COMMERCE_DOCS_REPO;
  const repo = env ? path.resolve(env) : path.join(os.homedir(), 'code', 'commerce-cloud-docs');
  const contentDir = path.join(repo, 'content', 'en-us');
  if (!fs.existsSync(contentDir)) {
    throw new Error(`commerce-cloud-docs content not found at ${contentDir}. Set COMMERCE_DOCS_REPO.`);
  }
  return contentDir;
}

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

/** Cleans markdown to a compact plain-text excerpt for the model. */
function toExcerpt(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1800);
}

function collectSources(contentDir: string): GuideSource[] {
  const sources: GuideSource[] = [];
  const seen = new Set<string>();
  for (const category of CATEGORIES) {
    for (const file of walkMarkdown(path.join(contentDir, category, 'guides'))) {
      const basename = path.basename(file, '.md');
      const id = `${category}/${basename}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const md = fs.readFileSync(file, 'utf-8');
      const title = md.match(/^#\s+(.+)$/m)?.[1]?.trim() || basename;
      sources.push({id, category, title, excerpt: toExcerpt(md)});
    }
  }
  return sources;
}

function loadExisting(): Record<string, EnrichmentEntry> {
  if (!fs.existsSync(ENRICHMENT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(ENRICHMENT_PATH, 'utf-8')) as Record<string, EnrichmentEntry>;
  } catch {
    return {};
  }
}

const SYSTEM_PROMPT =
  'You enrich B2C Commerce developer documentation for a search index. Given one doc (title + text ' +
  'excerpt), return a JSON object with exactly two fields: "summary" (ONE dense sentence, <=160 chars, ' +
  'stating what task/topic the doc helps a developer accomplish) and "keywords" (5-12 short search ' +
  'terms/synonyms/acronyms a developer or AI coding agent would type to find this doc, including common ' +
  'alternate phrasings). Base everything ONLY on the provided content; do not invent APIs. Respond with ' +
  'ONLY the JSON object, no prose, no code fences.';

/** Calls the Anthropic Messages API for one doc; returns null on failure. */
async function enrichOne(src: GuideSource): Promise<EnrichmentEntry | null> {
  const body = {
    model: MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{role: 'user', content: `Title: ${src.title}\nCategory: ${src.category}\n\nExcerpt:\n${src.excerpt}`}],
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status >= 500) {
        if (attempt === 2) {
          console.warn(`  ! ${src.id}: gave up after retries (last HTTP ${res.status})`);
          return null;
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        console.warn(`  ! ${src.id}: HTTP ${res.status} ${await res.text().catch(() => '')}`.slice(0, 200));
        return null;
      }
      const json = (await res.json()) as {content?: {type: string; text?: string}[]};
      const text = json.content?.find((c) => c.type === 'text')?.text ?? '';
      const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as EnrichmentEntry;
      if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.keywords)) return null;
      return {summary: parsed.summary.slice(0, 200), keywords: parsed.keywords.slice(0, 12).map(String)};
    } catch (err) {
      if (attempt === 2) {
        console.warn(`  ! ${src.id}: ${(err as Error).message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

/** Runs `worker` over `items` with a fixed concurrency pool. */
async function pool<T>(items: T[], concurrency: number, worker: (item: T, i: number) => Promise<void>): Promise<void> {
  let next = 0;
  const runners = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

async function main(): Promise<void> {
  const full = process.argv.includes('--full');

  if (!API_KEY) {
    console.log(
      'enrich:docs — no ANTHROPIC_API_KEY set; skipping LLM enrichment (this is optional).\n' +
        '  The guides index will build without summaries/keywords. Set ANTHROPIC_API_KEY to enable.',
    );
    return;
  }

  const contentDir = resolveContentDir();
  const sources = collectSources(contentDir);
  const existing = loadExisting();

  const todo = full ? sources : sources.filter((s) => !existing[s.id]);
  console.log(
    `enrich:docs — ${sources.length} guides total; ${todo.length} to enrich ` +
      `(${full ? 'full re-run' : 'missing only'}); model=${MODEL}, concurrency=${CONCURRENCY}`,
  );
  if (todo.length === 0) {
    console.log('Nothing to enrich. Existing enrichment is complete.');
    return;
  }

  const result: Record<string, EnrichmentEntry> = full ? {} : {...existing};
  let done = 0;
  let failed = 0;
  await pool(todo, CONCURRENCY, async (src) => {
    const e = await enrichOne(src);
    if (e) result[src.id] = e;
    else failed++;
    done++;
    if (done % 25 === 0 || done === todo.length) {
      console.log(`  … ${done}/${todo.length} (${failed} failed)`);
    }
  });

  // Keep the sidecar sorted by id for stable, reviewable diffs.
  const sorted: Record<string, EnrichmentEntry> = {};
  for (const id of Object.keys(result).sort()) sorted[id] = result[id];

  fs.mkdirSync(GUIDES_DIR, {recursive: true});
  fs.writeFileSync(ENRICHMENT_PATH, JSON.stringify(sorted, null, 2));
  console.log(
    `Wrote ${Object.keys(sorted).length} enrichment entries to ${ENRICHMENT_PATH} (${failed} failed this run).\n` +
      '  Re-run `generate:guides-index` to merge into the search index.',
  );
}

main().catch((err) => {
  console.error('Failed to enrich docs:', err);
  process.exit(1);
});
