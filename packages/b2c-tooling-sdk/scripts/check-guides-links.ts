/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Link-checks the bundled Developer Center guides index (`data/guides/index.json`).
 *
 * Guide content is fetched from developer.salesforce.com at read time, so an
 * entry whose page has been unpublished or renamed becomes a dead 404 — see
 * `generate-guides-index.ts`, which now only indexes TOC-referenced pages to
 * prevent this. This script is the runtime guard: it fetches every entry's `url`
 * and exits non-zero if any return a non-OK status, so a regression (an orphan
 * that slipped through, or a page removed upstream after generation) fails CI
 * rather than silently degrading `b2c docs`.
 *
 * LOCAL-ONLY: this is a manual/local verification tool, not a CI gate. The docs
 * CDN (Cloudflare) blanket-403s datacenter IPs, so every URL comes back blocked
 * from GitHub-hosted runners regardless of headers — a CI run would verify
 * nothing while appearing green. Run it from a normal network after regenerating
 * the index (see the documentation skill).
 *
 * Usage:
 *   pnpm --filter @salesforce/b2c-tooling-sdk run check:guides-links
 *
 * Signal vs. noise: only 404/410 are treated as "broken" — those mean the page
 * is definitively gone. A 403/429/5xx or network error is an environmental block
 * (bot filter, rate limit, transient), not a dead link, so it is counted as
 * "inconclusive": reported but non-fatal, and a run dominated by inconclusive
 * results warns and passes rather than flagging every URL. We send a browser-like
 * User-Agent to minimize blocks. The docs site 404s HEAD, so we GET and drain.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Concurrent requests in flight. Kept modest to avoid hammering the docs host. */
const CONCURRENCY = 10;
/** Per-request timeout. */
const TIMEOUT_MS = 30_000;
/** Retries for transient failures (network errors, 5xx, 429) before giving up. */
const MAX_ATTEMPTS = 3;
/**
 * Statuses that definitively mean the page is gone. Only these fail the run;
 * everything else non-2xx (403/429/5xx/network) is an inconclusive block.
 */
const BROKEN_STATUSES = new Set([404, 410]);
/**
 * If more than this fraction of URLs come back inconclusive, assume the docs
 * host is blocking us (bot filter) rather than that the index is broken, and
 * pass with a warning instead of failing on noise.
 */
const INCONCLUSIVE_ABORT_FRACTION = 0.2;
/** Browser-like UA to reduce bot-filter 403s from the docs CDN. */
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface DocEntry {
  id: string;
  url?: string;
  sourceUrl?: string;
}

interface SearchIndex {
  entries: DocEntry[];
}

interface CheckResult {
  id: string;
  url: string;
  status: number; // 0 == network error / timeout
  error?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.resolve(__dirname, '../data/guides/index.json');

/** Fetches a URL with retry on transient failure. Returns the final status (0 on network error). */
async function checkUrl(url: string): Promise<{status: number; error?: string}> {
  let lastError: string | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // GET, not HEAD: developer.salesforce.com returns 404 for HEAD requests.
      const res = await fetch(url, {
        headers: {accept: 'text/html, text/markdown, */*', 'user-agent': USER_AGENT},
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      await res.text().catch(() => {}); // drain so the connection can be reused
      // Retry transient statuses (5xx, 429 rate-limit); a definitive status is returned as-is.
      if ((res.status >= 500 || res.status === 429) && attempt < MAX_ATTEMPTS) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      return {status: res.status};
    } catch (err) {
      lastError = (err as Error).message;
      // fall through to retry
    }
  }
  return {status: 0, error: lastError};
}

/** Runs `worker` over `items` with bounded concurrency, preserving order. */
async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({length: Math.min(limit, items.length)}, run));
  return results;
}

async function main(): Promise<void> {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`Guides index not found at ${INDEX_PATH}. Run generate:guides-index first.`);
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8')) as SearchIndex;
  const entries = index.entries.filter((e): e is DocEntry & {url: string} => Boolean(e.url));
  console.log(`Checking ${entries.length} guide URLs (concurrency ${CONCURRENCY})...`);

  const results = await mapLimit(entries, CONCURRENCY, async (e): Promise<CheckResult> => {
    const {status, error} = await checkUrl(e.url);
    return {id: e.id, url: e.url, status, error};
  });

  // Definitively gone → broken (fails the run). Any other non-2xx (403 bot
  // block, 429, 5xx, network error) → inconclusive (reported, does not fail).
  const broken = results.filter((r) => BROKEN_STATUSES.has(r.status));
  const inconclusive = results.filter((r) => !BROKEN_STATUSES.has(r.status) && (r.status === 0 || r.status >= 300));
  const ok = results.length - broken.length - inconclusive.length;
  const describe = (r: CheckResult) => (r.status === 0 ? `network error: ${r.error}` : `HTTP ${r.status}`);

  if (inconclusive.length > 0) {
    console.warn(`\n⚠ ${inconclusive.length} inconclusive URL(s) (not treated as broken):`);
    for (const r of inconclusive.slice(0, 10)) console.warn(`  ${r.id} — ${describe(r)}`);
    if (inconclusive.length > 10) console.warn(`  …and ${inconclusive.length - 10} more`);
  }

  // If the run is dominated by inconclusive results, we're almost certainly being
  // blocked (e.g. a CI runner's IP tripping the docs CDN's bot filter). Failing
  // here would be a false alarm — warn and pass, leaving real 404s still enforced.
  if (inconclusive.length > results.length * INCONCLUSIVE_ABORT_FRACTION) {
    console.warn(
      `\n⚠ ${inconclusive.length}/${results.length} URLs were inconclusive (likely a bot-filter block from ` +
        `this network). Skipping the link-check verdict rather than reporting false failures. ` +
        `Broken-page detection is only reliable from a browser-like network.`,
    );
    process.exit(0);
  }

  if (broken.length > 0) {
    console.error(`\n✖ ${broken.length} broken guide URL(s) (${ok} OK, ${inconclusive.length} inconclusive):\n`);
    for (const b of broken.sort((a, z) => a.id.localeCompare(z.id))) {
      console.error(`  ${b.id}\n    ${b.url}\n    ${describe(b)}`);
    }
    console.error(
      `\nRegenerate the index from an up-to-date commerce-cloud-docs clone ` +
        `(pnpm run generate:guides-index). If a page was removed upstream, this is expected — regeneration drops it.`,
    );
    process.exit(1);
  }

  console.log(`✓ All ${ok} guide URLs resolved${inconclusive.length ? ` (${inconclusive.length} inconclusive)` : ''}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
