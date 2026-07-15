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
 * It is intentionally standalone (no SDK imports) and network-bound, so CI runs
 * it only when the index changes (see `.github/workflows/guides-link-check.yml`).
 *
 * Usage:
 *   pnpm --filter @salesforce/b2c-tooling-sdk run check:guides-links
 *
 * The docs site 404s HEAD requests, so we issue GET and drain the body.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Concurrent requests in flight. Kept modest to avoid hammering the docs host. */
const CONCURRENCY = 10;
/** Per-request timeout. */
const TIMEOUT_MS = 30_000;
/** Retries for transient failures (network errors, 5xx) before giving up. */
const MAX_ATTEMPTS = 3;

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
        headers: {accept: 'text/html, text/markdown, */*'},
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      await res.text().catch(() => {}); // drain so the connection can be reused
      // Retry only on 5xx (transient); 4xx is a definitive dead link.
      if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
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

  const broken = results.filter((r) => r.status === 0 || r.status >= 400);
  const ok = results.length - broken.length;

  if (broken.length > 0) {
    console.error(`\n✖ ${broken.length} broken guide URL(s) (${ok} OK):\n`);
    for (const b of broken.sort((a, z) => a.id.localeCompare(z.id))) {
      const reason = b.status === 0 ? `network error: ${b.error}` : `HTTP ${b.status}`;
      console.error(`  ${b.id}\n    ${b.url}\n    ${reason}`);
    }
    console.error(
      `\nRegenerate the index from an up-to-date commerce-cloud-docs clone ` +
        `(pnpm run generate:guides-index). If a page was removed upstream, this is expected — regeneration drops it.`,
    );
    process.exit(1);
  }

  console.log(`✓ All ${ok} guide URLs resolved.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
