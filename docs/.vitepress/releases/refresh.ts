/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {releaseSections} from './history.js';
import type {PublishedRelease, ReleaseSnapshot} from './history.js';

const repository = 'SalesforceCommerceCloud/b2c-developer-tooling';
const seed: ReleaseSnapshot = JSON.parse(fs.readFileSync(new URL('./seed.json', import.meta.url), 'utf8'));
const {values} = parseArgs({options: {'seed-since': {type: 'string'}}});
const seedSince = values['seed-since'];
if (seedSince && !/^\d{4}-\d{2}-\d{2}$/.test(seedSince)) throw new Error('--seed-since must be YYYY-MM-DD');
const since = seedSince ? `${seedSince}T00:00:00Z` : seed.since;
if (!since) throw new Error('Release seed must specify its starting date');
const api = <T>(...args: string[]): T =>
  JSON.parse(execFileSync('gh', ['api', ...args], {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}));
// Re-read the complete published history since the seed on every deployment,
// including doc-only deployments. Fail before writing anything on API errors.
const pages = api<PublishedRelease[][]>(`repos/${repository}/releases?per_page=100`, '--paginate', '--slurp');
const releases: PublishedRelease[] = [];
for (const release of pages.flat()) {
  if (release.draft || release.prerelease || release.published_at < since || !releaseSections(release).length) continue;
  const {sha: commit} = api<{sha: string}>(`repos/${repository}/commits/${encodeURIComponent(release.tag_name)}`);
  releases.push({
    tag_name: release.tag_name,
    published_at: release.published_at,
    body: release.body,
    html_url: release.html_url,
    draft: release.draft,
    prerelease: release.prerelease,
    commit,
  });
}
if (!releases.length) throw new Error('No product releases returned; refusing to replace release history');
const destination = fileURLToPath(new URL(seedSince ? './seed.json' : './live.json', import.meta.url));
fs.writeFileSync(`${destination}.tmp`, JSON.stringify({since, releases}, null, 2) + '\n');
fs.renameSync(`${destination}.tmp`, destination);
console.log(`Loaded ${releases.length} product releases since ${since.slice(0, 10)}`);
