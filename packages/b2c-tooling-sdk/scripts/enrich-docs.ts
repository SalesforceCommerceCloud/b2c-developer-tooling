/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * OPTIONAL build-time enrichment of a docs corpus: the Developer Center guides
 * (default) or the Salesforce Help Knowledge Articles (`--corpus help-kb`).
 *
 * For each doc it generates, via a fast/cheap LLM (Claude Haiku by default), a
 * one-line `summary` and a set of search `keywords`/synonyms. Merged into the
 * guides search index by `generate-guides-index.ts`, these measurably improve
 * recall for natural-language / agentic queries (a doc titled "Multiple Sites"
 * becomes findable via "configure sites.js locale currency", etc.) and give a
 * useful triage snippet in search results.
 *
 * This step is entirely optional and non-blocking:
 *   - If no API key is configured it prints a notice and exits 0 (no-op), so the
 *     normal build never depends on an LLM.
 *   - Output is a committed sidecar (`data/<corpus>/enrichment.json`, id -> {summary,
 *     keywords}); the index build merges whatever exists.
 *
 * Modes:
 *   (default)          enrich only docs MISSING from the existing enrichment.json
 *   --full             re-enrich every doc (overwrites existing enrichment)
 *   --corpus help-kb   enrich the Knowledge Articles in HELP_KB_CONTENT instead of the guides
 *   --sample <n|ids>   dry run: enrich <n> random docs (or a comma-separated list of doc ids) and
 *                      print the results; writes nothing to the sidecar
 *   --out <file>       with --sample, also write the sampled enrichment (id -> entry) to <file>
 *                      (use to iterate on the prompt without a full run)
 *
 * Env:
 *   ANTHROPIC_API_KEY      required to run (else no-op). Bearer token.
 *   ANTHROPIC_BASE_URL     default https://api.anthropic.com
 *   DOCS_ENRICH_MODEL      default claude-haiku-5-5
 *   GUIDES_CONTENT_DIR    local Developer Center source directory (required for guides)
 *   HELP_KB_CONTENT       help-kb article directory or tarball (default docs/help-kb-content.tar.gz)
 *   DOCS_ENRICH_CONCURRENCY default 3
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... pnpm --filter @salesforce/b2c-tooling-sdk run enrich:docs
 *   ANTHROPIC_API_KEY=... pnpm --filter @salesforce/b2c-tooling-sdk run enrich:docs -- --full
 *   ANTHROPIC_API_KEY=... pnpm --filter @salesforce/b2c-tooling-sdk run enrich:docs -- --corpus help-kb
 */

import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

import {GUIDES_SOURCES} from './guides-sources.js';

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
const corpusArg = process.argv.indexOf('--corpus');
const CORPUS = corpusArg > 0 ? process.argv[corpusArg + 1] : 'guides';
if (CORPUS !== 'guides' && CORPUS !== 'help-kb') throw new Error(`Unknown --corpus "${CORPUS}" (guides | help-kb)`);
const DATA_DIR = path.resolve(__dirname, '../data', CORPUS);
const ENRICHMENT_PATH = path.join(DATA_DIR, 'enrichment.json');

const MODEL = process.env.DOCS_ENRICH_MODEL || 'claude-haiku-5-5';
const BASE_URL = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const API_KEY = process.env.ANTHROPIC_API_KEY;
const CONCURRENCY = Number(process.env.DOCS_ENRICH_CONCURRENCY || 3);
const MAX_ATTEMPTS = 6;
const SUMMARY_MAX = 200;

function resolveContentDir(): string {
  const configured = process.env.GUIDES_CONTENT_DIR;
  if (!configured) throw new Error('Set GUIDES_CONTENT_DIR to the local Developer Center source directory.');
  const contentDir = path.resolve(configured);
  if (!GUIDES_SOURCES.some((source) => fs.existsSync(path.join(contentDir, source.dir)))) {
    throw new Error(`Developer Center guide content not found at ${contentDir}. Check GUIDES_CONTENT_DIR.`);
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
  for (const {category, dir} of GUIDES_SOURCES) {
    for (const file of walkMarkdown(path.join(contentDir, dir))) {
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

/**
 * Collects the Knowledge Articles (`help-kb/<ArticleNumber>.md`) from the
 * extracted content directory or the committed `help-kb-content.tar.gz`.
 */
function collectHelpKbSources(): GuideSource[] {
  let dir = path.resolve(
    process.env.HELP_KB_CONTENT || path.resolve(__dirname, '../../../docs/help-kb-content.tar.gz'),
  );
  if (!fs.existsSync(dir)) throw new Error(`help-kb content not found at ${dir}. Check HELP_KB_CONTENT.`);
  if (dir.endsWith('.tar.gz')) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'help-kb-enrich-'));
    execFileSync('tar', ['-xzf', dir, '-C', tmp]);
    dir = path.join(tmp, 'help/help-kb');
  }
  return walkMarkdown(dir)
    .sort()
    .map((file) => {
      const basename = path.basename(file, '.md');
      // Drop the "> Salesforce Help Knowledge Article N · Last published …" provenance line.
      const md = fs.readFileSync(file, 'utf-8').replace(/^> Salesforce Help Knowledge Article.*$/m, '');
      const title = md.match(/^#\s+(.+)$/m)?.[1]?.trim() || basename;
      return {id: `help-kb/${basename}`, category: 'help-kb', title, excerpt: toExcerpt(md)};
    });
}

function loadExisting(): Record<string, EnrichmentEntry> {
  if (!fs.existsSync(ENRICHMENT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(ENRICHMENT_PATH, 'utf-8')) as Record<string, EnrichmentEntry>;
  } catch {
    return {};
  }
}

const PURPOSE =
  'Your output powers `b2c docs search`, a lexical (BM25) search used mostly by AI coding agents. ' +
  "Only each doc's title, id, section headings, and the two fields you write are indexed; the body " +
  'text is NOT. So:\n' +
  '- "keywords" are the only way terms that appear in the body (but not the title or headings) become ' +
  'searchable. Supply the words someone would actually type to land on this doc.\n' +
  '- "summary" is shown under the title in a ranked result list; an agent reads it to decide whether ' +
  'this doc is worth fetching. Every word should help that decision.\n';

const SHARED_RULES =
  'Rules:\n' +
  '- "summary": ONE sentence of 18-30 words (never more than 30). The first clause must state the ' +
  "doc's main purpose; add caveats, limits, or secondary details only if room remains (the keywords " +
  'can carry the rest). Lead with the task or topic as an imperative or noun ' +
  'phrase (e.g. "Configure Hybrid Auth so…", "Custom object instances in Business Manager: …"). Never ' +
  'open with a meta phrase such as "Explains", "Describes", "Shows", "Covers", "Learn", "Learn that", ' +
  'or "This article"; the reader already knows it is a doc.\n' +
  '- "keywords": 8-15 short search terms (1-5 words each). Include (a) API, class, endpoint, setting, ' +
  'field, and error names from the body, plus synonyms and acronyms, and (b) 2-3 plain-language ' +
  'phrasings of the goal or problem as someone would ask it (e.g. "reset forgotten password", "sign ' +
  'JWT instead of shared secret"). Favor terms NOT already in the title; skip generic terms like "B2C ' +
  'Commerce" or "documentation" and near-duplicates.\n' +
  '- Use ONLY facts in the provided content; do not invent APIs or features.\n' +
  '- Output ONLY the JSON object {"summary": string, "keywords": string[]}: no prose, no code fences.';

const GUIDES_SYSTEM_PROMPT =
  'You write search-index metadata for Salesforce B2C Commerce developer documentation (Developer ' +
  'Center guides). Given one doc (title + text excerpt), write a summary of what it lets a developer ' +
  'do and the search keywords for it.\n' +
  PURPOSE +
  SHARED_RULES;

const HELP_KB_SYSTEM_PROMPT =
  'You write search-index metadata for Salesforce B2C Commerce Help knowledge articles, read by ' +
  'developers, administrators, and AI coding agents. Given one article (title + text excerpt), write a ' +
  'summary of the problem, question, or task it addresses (with its key answer when short) and the ' +
  'search keywords for it; include exact error strings when present.\n' +
  PURPOSE +
  SHARED_RULES;

const SYSTEM_PROMPT = CORPUS === 'help-kb' ? HELP_KB_SYSTEM_PROMPT : GUIDES_SYSTEM_PROMPT;

/** Trims to SUMMARY_MAX at a word boundary (models occasionally overshoot the length rule). */
function clampSummary(summary: string): string {
  const text = summary.trim();
  if (text.length <= SUMMARY_MAX) return text;
  const cut = text.slice(0, SUMMARY_MAX - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:]+$/, '')}…`;
}

/** Backoff for a retryable response: honors `retry-after`, else exponential with jitter. */
function retryDelayMs(res: Response | null, attempt: number): number {
  const retryAfter = Number(res?.headers.get('retry-after'));
  if (retryAfter > 0) return retryAfter * 1000;
  return Math.min(60_000, 2000 * 2 ** attempt) + Math.random() * 1000;
}

type ChatMessage = {role: 'assistant' | 'user'; content: string};

/** Summary openers the prompt forbids; responses that use one get a correction turn. */
const META_OPENER = /^(explains|describes|shows|covers|walks|learn|this (doc|article|guide|page))\b/i;

/** Returns why a summary breaks the length/style rules, or null when it is acceptable. */
function summaryProblem(summary: string): null | string {
  if (META_OPENER.test(summary)) return 'it opens with a meta phrase; lead with the task or topic itself';
  if (summary.length > SUMMARY_MAX) return `it is ${summary.length} characters; the limit is ${SUMMARY_MAX}`;
  return null;
}

/** Calls the Anthropic Messages API, retrying rate limits/server errors; returns the text or null. */
async function callModel(id: string, messages: ChatMessage[]): Promise<null | string> {
  const body = {
    model: MODEL,
    // Headroom for adaptive thinking, which counts toward max_tokens on Haiku 5.5.
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
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
        if (attempt === MAX_ATTEMPTS - 1) {
          console.warn(`  ! ${id}: gave up after retries (last HTTP ${res.status})`);
          return null;
        }
        await new Promise((r) => setTimeout(r, retryDelayMs(res, attempt)));
        continue;
      }
      if (!res.ok) {
        console.warn(`  ! ${id}: HTTP ${res.status} ${await res.text().catch(() => '')}`.slice(0, 200));
        return null;
      }
      const json = (await res.json()) as {content?: {type: string; text?: string}[]};
      return json.content?.find((c) => c.type === 'text')?.text ?? '';
    } catch (err) {
      if (attempt === MAX_ATTEMPTS - 1) {
        console.warn(`  ! ${id}: ${(err as Error).message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, retryDelayMs(null, attempt)));
    }
  }
  return null;
}

function parseEnrichment(text: string): EnrichmentEntry | null {
  try {
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as EnrichmentEntry;
    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.keywords) || parsed.keywords.length === 0) {
      return null;
    }
    return {summary: parsed.summary.trim(), keywords: parsed.keywords.slice(0, 15).map(String)};
  } catch {
    return null;
  }
}

/**
 * Enriches one doc; returns null on failure. A response that breaks the summary
 * rules gets one correction turn (models follow "fix this" more reliably than
 * up-front length limits); anything still over length is trimmed as a last resort.
 */
async function enrichOne(src: GuideSource): Promise<EnrichmentEntry | null> {
  const messages: ChatMessage[] = [
    {role: 'user', content: `Title: ${src.title}\nCategory: ${src.category}\n\nExcerpt:\n${src.excerpt}`},
  ];
  let entry: EnrichmentEntry | null = null;
  for (let turn = 0; turn < 2; turn++) {
    const text = await callModel(src.id, messages);
    if (text === null) break;
    const parsed = parseEnrichment(text);
    if (parsed) entry = parsed;
    const problem = parsed ? summaryProblem(parsed.summary) : 'it was not a JSON object with summary and keywords';
    if (!problem) break;
    messages.push(
      {role: 'assistant', content: text},
      {role: 'user', content: `Rewrite: ${problem}. Return the full corrected JSON object only.`},
    );
  }
  if (!entry) {
    console.warn(`  ! ${src.id}: no valid enrichment in response`);
    return null;
  }
  return {...entry, summary: clampSummary(entry.summary)};
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
  const sampleArg = process.argv.indexOf('--sample');
  const sample = sampleArg > 0 ? process.argv[sampleArg + 1] : undefined;
  const outArg = process.argv.indexOf('--out');
  const sampleOut = outArg > 0 ? process.argv[outArg + 1] : undefined;

  if (!API_KEY) {
    console.log(
      'enrich:docs — no ANTHROPIC_API_KEY set; skipping LLM enrichment (this is optional).\n' +
        '  The guides index will build without summaries/keywords. Set ANTHROPIC_API_KEY to enable.',
    );
    return;
  }

  const sources = CORPUS === 'help-kb' ? collectHelpKbSources() : collectSources(resolveContentDir());
  const existing = loadExisting();

  if (sample) {
    // Dry run: shuffle and enrich a few docs, printing them next to any existing enrichment.
    const picked = /^\d+$/.test(sample)
      ? [...sources].sort(() => Math.random() - 0.5).slice(0, Number(sample))
      : sources.filter((s) => sample.split(',').includes(s.id));
    console.log(`enrich:docs — sampling ${picked.length} ${CORPUS} docs (dry run); model=${MODEL}`);
    const sampled: Record<string, EnrichmentEntry> = {};
    await pool(picked, CONCURRENCY, async (src) => {
      const e = await enrichOne(src);
      if (e) sampled[src.id] = e;
      const prior = existing[src.id];
      console.log(
        `\n### ${src.id} (${src.title})\n` +
          (prior ? `  old: ${prior.summary}\n       [${prior.keywords.join(', ')}]\n` : '') +
          (e ? `  new: ${e.summary} (${e.summary.length})\n       [${e.keywords.join(', ')}]` : '  new: FAILED'),
      );
    });
    if (sampleOut) fs.writeFileSync(sampleOut, JSON.stringify(sampled, null, 2));
    return;
  }

  const todo = full ? sources : sources.filter((s) => !existing[s.id]);
  console.log(
    `enrich:docs — ${sources.length} ${CORPUS} docs total; ${todo.length} to enrich ` +
      `(${full ? 'full re-run' : 'missing only'}); model=${MODEL}, concurrency=${CONCURRENCY}`,
  );
  if (todo.length === 0) {
    console.log('Nothing to enrich. Existing enrichment is complete.');
    return;
  }

  // Always seed from the existing sidecar: in `--full` mode every entry is
  // re-attempted and successes overwrite, but a transient failure then falls
  // back to the prior enrichment instead of dropping it from the sidecar.
  const result: Record<string, EnrichmentEntry> = {...existing};
  let done = 0;
  let failed = 0;
  await pool(todo, CONCURRENCY, async (src) => {
    const e = await enrichOne(src);
    if (e) result[src.id] = e;
    else if (!result[src.id]) failed++; // only a real gap if there was no prior enrichment
    done++;
    if (done % 25 === 0 || done === todo.length) {
      console.log(`  … ${done}/${todo.length} (${failed} failed)`);
    }
  });

  // Keep the sidecar sorted by id for stable, reviewable diffs.
  const sorted: Record<string, EnrichmentEntry> = {};
  for (const id of Object.keys(result).sort()) sorted[id] = result[id];

  fs.mkdirSync(DATA_DIR, {recursive: true});
  fs.writeFileSync(ENRICHMENT_PATH, JSON.stringify(sorted, null, 2));
  console.log(
    `Wrote ${Object.keys(sorted).length} enrichment entries to ${ENRICHMENT_PATH} (${failed} failed this run).\n` +
      (CORPUS === 'help-kb'
        ? '  Regenerate the help-kb index to merge into the search index.'
        : '  Re-run `generate:guides-index` to merge into the search index.'),
  );
}

main().catch((err) => {
  console.error('Failed to enrich docs:', err);
  process.exit(1);
});
